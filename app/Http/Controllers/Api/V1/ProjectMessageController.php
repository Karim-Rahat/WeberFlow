<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\ProjectMessagePosted;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProjectMessageRequest;
use App\Http\Resources\ProjectMessageResource;
use App\Models\Project;
use App\Models\ProjectMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class ProjectMessageController extends Controller
{
    public function index(Request $request, Project $project): AnonymousResourceCollection
    {
        $this->authorizeProject($request, $project);
        Gate::authorize('view', $project);

        return ProjectMessageResource::collection($project->projectMessages()->with('user')->paginate(20));
    }

    public function store(StoreProjectMessageRequest $request, Project $project): JsonResponse
    {
        $this->authorizeProject($request, $project);
        Gate::authorize('view', $project);

        $message = $project->projectMessages()->create([
            'user_id' => $request->user()->id,
            'body' => $request->string('body')->toString(),
        ]);

        ProjectMessagePosted::dispatch($message);

        return (new ProjectMessageResource($message->load('user')))->response()->setStatusCode(201);
    }

    public function destroy(Request $request, Project $project, ProjectMessage $projectMessage): Response
    {
        $this->authorizeProject($request, $project);
        abort_unless($projectMessage->project_id === $project->id, 404);
        abort_unless($projectMessage->user_id === $request->user()->id || $project->owner_id === $request->user()->id, 403);

        $projectMessage->delete();

        return response()->noContent();
    }

    private function authorizeProject(Request $request, Project $project): void
    {
        abort_unless($request->user()->current_workspace_id === $project->workspace_id, 404);
    }
}
