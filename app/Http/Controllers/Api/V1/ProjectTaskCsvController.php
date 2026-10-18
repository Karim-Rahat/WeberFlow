<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\TaskChanged;
use App\Http\Controllers\Controller;
use App\Http\Requests\ImportProjectTasksRequest;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProjectTaskCsvController extends Controller
{
    /** @var list<string> */
    private const STATUSES = ['not_started', 'in_progress', 'blocked', 'complete'];

    /** @var list<string> */
    private const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

    /** @var list<string> */
    private const HEADERS = ['Title', 'Description', 'Status', 'Priority', 'Assignee', 'Start Date', 'Due Date', 'Section', 'Milestone'];

    public function export(Request $request, Project $project): StreamedResponse
    {
        abort_unless($request->user()->current_workspace_id === $project->workspace_id, 404);
        Gate::authorize('view', $project);

        $tasks = $project->tasks()->with(['assignee', 'section'])->orderBy('position')->get();

        return response()->streamDownload(function () use ($tasks): void {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, self::HEADERS, escape: '');

            foreach ($tasks as $task) {
                fputcsv($handle, [
                    $task->title,
                    $task->description,
                    $task->status,
                    $task->priority,
                    $task->assignee?->email,
                    $task->start_date?->toDateString(),
                    $task->due_date?->toDateString(),
                    $task->section?->name,
                    $task->is_milestone ? 'yes' : 'no',
                ], escape: '');
            }

            fclose($handle);
        }, Str::slug($project->name).'-tasks.csv', ['Content-Type' => 'text/csv']);
    }

    public function import(ImportProjectTasksRequest $request, Project $project): JsonResponse
    {
        abort_unless($request->user()->current_workspace_id === $project->workspace_id, 404);
        Gate::authorize('update', $project);

        $handle = fopen($request->file('file')->getRealPath(), 'r');
        $columns = $this->mapColumns(fgetcsv($handle, escape: '') ?: []);

        $sections = $project->sections()->pluck('id', 'name')
            ->mapWithKeys(fn (int $id, string $name): array => [Str::lower(trim($name)) => $id]);
        $assignees = $project->workspace->members()->wherePivot('status', 'active')->get()
            ->mapWithKeys(fn ($member): array => [Str::lower($member->email) => $member->id]);

        $userId = $request->user()->id;
        $position = (int) $project->tasks()->max('position');
        $imported = 0;
        $skipped = 0;

        DB::transaction(function () use ($handle, $columns, $sections, $assignees, $project, $userId, &$position, &$imported, &$skipped): void {
            while (($row = fgetcsv($handle, escape: '')) !== false && $row !== null) {
                $title = $this->value($row, $columns, 'title');

                if ($title === null) {
                    $skipped++;

                    continue;
                }

                $startDate = $this->parseDate($this->value($row, $columns, 'start_date'));
                $dueDate = $this->parseDate($this->value($row, $columns, 'due_date'));

                if ($startDate && $dueDate && $dueDate->lessThan($startDate)) {
                    $dueDate = null;
                }

                $section = $this->value($row, $columns, 'section');
                $assignee = $this->value($row, $columns, 'assignee');
                $milestone = $this->value($row, $columns, 'milestone');

                $task = $project->tasks()->create([
                    'workspace_id' => $project->workspace_id,
                    'creator_id' => $userId,
                    'title' => $title,
                    'description' => $this->value($row, $columns, 'description'),
                    'status' => $this->normalize($this->value($row, $columns, 'status'), self::STATUSES, 'not_started'),
                    'priority' => $this->normalize($this->value($row, $columns, 'priority'), self::PRIORITIES, 'medium'),
                    'section_id' => $section ? $sections->get(Str::lower($section)) : null,
                    'assignee_id' => $assignee ? $assignees->get(Str::lower($assignee)) : null,
                    'start_date' => $startDate,
                    'due_date' => $dueDate,
                    'is_milestone' => in_array(Str::lower((string) $milestone), ['yes', 'y', 'true', '1'], true),
                    'position' => ++$position,
                ]);

                $task->activities()->create(['workspace_id' => $project->workspace_id, 'actor_id' => $userId, 'event' => 'task.created']);

                TaskChanged::dispatch($task, 'created');

                $imported++;
            }
        });

        fclose($handle);

        return response()->json(['data' => ['imported' => $imported, 'skipped' => $skipped]], 201);
    }

    /**
     * @param  list<string|null>  $header
     * @return array<string, int>
     */
    private function mapColumns(array $header): array
    {
        $aliases = [
            'title' => ['title', 'name', 'task', 'task name'],
            'description' => ['description', 'notes', 'details'],
            'status' => ['status'],
            'priority' => ['priority'],
            'assignee' => ['assignee', 'assignee email', 'owner'],
            'start_date' => ['start date', 'start', 'start_date'],
            'due_date' => ['due date', 'due', 'due_date', 'deadline'],
            'section' => ['section', 'section name'],
            'milestone' => ['milestone', 'is milestone'],
        ];

        $normalized = array_map(
            fn (?string $label): string => Str::of((string) $label)->replace("\u{FEFF}", '')->trim()->lower()->toString(),
            $header,
        );

        $columns = [];

        foreach ($aliases as $field => $names) {
            foreach ($normalized as $index => $label) {
                if (in_array($label, $names, true)) {
                    $columns[$field] = $index;

                    break;
                }
            }
        }

        return $columns;
    }

    /**
     * @param  list<string|null>  $row
     * @param  array<string, int>  $columns
     */
    private function value(array $row, array $columns, string $field): ?string
    {
        $value = isset($columns[$field]) ? trim((string) ($row[$columns[$field]] ?? '')) : '';

        return $value === '' ? null : $value;
    }

    /**
     * @param  list<string>  $allowed
     */
    private function normalize(?string $value, array $allowed, string $default): string
    {
        $normalized = $value === null ? '' : Str::of($value)->lower()->replace([' ', '-'], '_')->toString();

        return in_array($normalized, $allowed, true) ? $normalized : $default;
    }

    private function parseDate(?string $value): ?Carbon
    {
        if ($value === null) {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }
}
