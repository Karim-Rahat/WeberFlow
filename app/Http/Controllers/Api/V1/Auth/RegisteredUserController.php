<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Actions\CreateUserWithWorkspace;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class RegisteredUserController extends Controller
{
    public function __invoke(RegisterRequest $request, CreateUserWithWorkspace $createUser): JsonResponse
    {
        $user = $createUser->handle($request->validated());

        event(new Registered($user));
        Auth::login($user);
        $request->session()->regenerate();

        return (new UserResource($user))->response()->setStatusCode(201);
    }
}
