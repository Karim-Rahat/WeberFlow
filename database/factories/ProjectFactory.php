<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Project> */
class ProjectFactory extends Factory
{
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'owner_id' => User::factory(),
            'name' => fake()->sentence(3),
            'description' => fake()->sentence(),
            'status' => 'on_track',
            'start_date' => now()->toDateString(),
            'due_date' => now()->addMonth()->toDateString(),
        ];
    }
}
