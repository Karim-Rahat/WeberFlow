<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCustomFieldRequest;
use App\Models\CustomField;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class ProjectCustomFieldController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function store(StoreCustomFieldRequest $request, Project $project): JsonResponse
    {
        $this->authorizeProject($request, $project);

        $field = $project->customFields()->create([
            ...$request->safe()->only(['name', 'type', 'options', 'is_required']),
            'position' => ((int) $project->customFields()->max('position')) + 1,
        ]);

        return response()->json(['data' => $field], 201);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function destroy(StoreCustomFieldRequest $request, Project $project, CustomField $customField): JsonResponse
    {
        $this->authorizeProject($request, $project);
        abort_unless($customField->project_id === $project->id, 404);
        $customField->delete();

        return response()->json(status: 204);
    }

    /**
     * Display the specified resource.
     */
    private function authorizeProject(StoreCustomFieldRequest $request, Project $project): void
    {
        abort_unless($request->user()->current_workspace_id === $project->workspace_id, 404);
        Gate::authorize('update', $project);
    }
}
