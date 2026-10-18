<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSavedSearchRequest;
use App\Models\SavedSearch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class SavedSearchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $searches = SavedSearch::query()
            ->where('workspace_id', $request->user()->current_workspace_id)
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['data' => $searches]);
    }

    public function store(StoreSavedSearchRequest $request): JsonResponse
    {
        $search = SavedSearch::query()->create([
            'workspace_id' => $request->user()->current_workspace_id,
            'user_id' => $request->user()->id,
            'name' => $request->string('name')->toString(),
            'filters' => $request->array('filters'),
        ]);

        return response()->json(['data' => $search], 201);
    }

    public function destroy(Request $request, SavedSearch $savedSearch): Response
    {
        abort_unless(
            $savedSearch->user_id === $request->user()->id
            && $savedSearch->workspace_id === $request->user()->current_workspace_id,
            404,
        );

        $savedSearch->delete();

        return response()->noContent();
    }
}
