<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Task> */
class TaskFactory extends Factory
{
    public function definition(): array
    {
        return [
            'workspace_id' => fn (array $attributes): int => Project::query()->findOrFail($attributes['project_id'])->workspace_id,
            'project_id' => Project::factory(),
            'creator_id' => User::factory(),
            'title' => fake()->sentence(4),
            'status' => 'not_started',
            'priority' => 'medium',
            'start_date' => now()->toDateString(),
            'due_date' => now()->addWeek()->toDateString(),
            'position' => 1,
        ];
    }
}
