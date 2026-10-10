<?php

namespace Database\Factories;

use App\Models\NotificationPreference;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<NotificationPreference>
 */
class NotificationPreferenceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'assignments_email' => true,
            'mentions_email' => true,
            'comments_email' => true,
            'deadlines_email' => true,
            'daily_digest_email' => false,
            'in_app_notifications' => true,
        ];
    }
}
