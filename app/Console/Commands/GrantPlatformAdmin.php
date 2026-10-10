<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('admin:grant {email}')]
#[Description('Grant WeberFlow platform administrator access to an existing user')]
class GrantPlatformAdmin extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $user = User::where('email', $this->argument('email'))->first();
        if (! $user) {
            $this->error('No user exists with that email address.');

            return self::FAILURE;
        }
        $user->update(['is_platform_admin' => true]);
        $this->info($user->email.' is now a WeberFlow platform administrator.');

        return self::SUCCESS;
    }
}
