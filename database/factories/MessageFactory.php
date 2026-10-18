<?php

namespace Database\Factories;

use App\Models\Message;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Message> */
class MessageFactory extends Factory
{
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'sender_id' => User::factory(),
            'recipient_id' => User::factory(),
            'body' => fake()->sentence(),
            'read_at' => null,
        ];
    }
}
