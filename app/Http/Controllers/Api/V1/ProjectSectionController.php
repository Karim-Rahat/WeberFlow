<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSectionRequest;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class ProjectSectionController extends Controller
{
    public function store(StoreSectionRequest $request, Project $project): JsonResponse
    {
        abort_unless($request->user()->current_workspace_id === $project->workspace_id, 404);
        Gate::authorize('update', $project);

        $section = $project->sections()->create([
            'name' => $request->string('name')->toString(),
            'position' => ((int) $project->sections()->max('position')) + 1,
        ]);

        return response()->json(['data' => $section], 201);
    }
}
