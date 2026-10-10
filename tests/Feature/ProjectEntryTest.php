<?php

namespace Tests\Feature;

use Tests\TestCase;

class ProjectEntryTest extends TestCase
{
    public function test_root_redirects_to_the_project_flowchart(): void
    {
        $response = $this->get('/');

        $response->assertRedirect('/flowchart.html');
    }

    public function test_application_shell_renders_successfully(): void
    {
        $response = $this->get('/app');

        $response
            ->assertOk()
            ->assertViewIs('app')
            ->assertSee('id="app"', false);
    }

    public function test_implementation_plan_is_available(): void
    {
        $response = $this->get('/implementation-plan');

        $response
            ->assertOk()
            ->assertHeader('content-type', 'text/markdown; charset=UTF-8');
    }
}
