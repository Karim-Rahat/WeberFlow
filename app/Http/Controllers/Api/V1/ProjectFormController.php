<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProjectFormRequest;
use App\Http\Requests\SubmitProjectFormRequest;
use App\Http\Resources\TaskResource;
use App\Models\Project;
use App\Models\ProjectForm;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class ProjectFormController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function store(StoreProjectFormRequest $request, Project $project): JsonResponse
    {
        $this->authorizeProject($request, $project, 'update');
        $form = $project->forms()->create($request->validated());

        return response()->json(['data' => $form], 201);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function submit(SubmitProjectFormRequest $request, ProjectForm $projectForm): TaskResource
    {
        $project = $projectForm->project;
        $this->authorizeProject($request, $project, 'view');
        abort_unless($projectForm->is_active, 404);

        $responses = collect($request->validated('responses'));
        foreach ($projectForm->fields as $index => $field) {
            if (($field['required'] ?? false) && blank($responses->get((string) $index))) {
                abort(422, 'A required form response is missing.');
            }
        }

        $task = $project->tasks()->create([
            'workspace_id' => $project->workspace_id,
            'creator_id' => $request->user()->id,
            'title' => $request->validated('title'),
            'description' => collect($projectForm->fields)->map(fn (array $field, int $index): string => $field['label'].': '.($responses->get((string) $index) ?: '—'))->implode("\n"),
            'position' => ((int) $project->tasks()->max('position')) + 1,
        ]);

        return new TaskResource($task);
    }

    /**
     * Display the specified resource.
     */
    public function destroy(StoreProjectFormRequest $request, Project $project, ProjectForm $projectForm): JsonResponse
    {
        $this->authorizeProject($request, $project, 'update');
        abort_unless($projectForm->project_id === $project->id, 404);
        $projectForm->delete();

        return response()->json(status: 204);
    }

    /**
     * Update the specified resource in storage.
     */
    private function authorizeProject(StoreProjectFormRequest|SubmitProjectFormRequest $request, Project $project, string $ability): void
    {
        abort_unless($request->user()->current_workspace_id === $project->workspace_id, 404);
        Gate::authorize($ability, $project);
    }
}
