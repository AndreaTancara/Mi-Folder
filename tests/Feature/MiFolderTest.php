<?php

namespace Tests\Feature;

use App\Models\Requisito;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MiFolderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    private function kardex(): User
    {
        return User::where('rol', 'kardex')->first();
    }

    public function test_la_pagina_principal_abre(): void
    {
        $this->get('/')->assertOk()->assertSee('Mi Folder')->assertSee('servidor.js');
    }

    public function test_el_catalogo_viene_de_la_base_de_datos(): void
    {
        $r = $this->getJson('/api/catalogo')->assertOk();
        $this->assertCount(15, $r['catalog']['azul']);
        $this->assertSame('azul_carta', $r['catalog']['azul'][0]['id']);
        $this->assertArrayHasKey('where', $r['catalog']['azul'][0]);
    }

    public function test_un_estudiante_se_registra_y_guarda_su_avance(): void
    {
        $this->post('/registro', [
            'name' => 'Ana Quispe',
            'email' => 'ana@example.com',
            'password' => 'secreta123',
            'password_confirmation' => 'secreta123',
        ])->assertRedirect('/');

        $this->getJson('/api/avance')->assertOk()->assertExactJson(['avance' => null]);

        $this->putJson('/api/avance', [
            'level' => 'naranja',
            'progress' => ['real:naranja:naranja_ci' => true, 'real:naranja:otro' => false, 'mal formado' => true],
            'excluded' => [],
            'workflow' => ['azul' => ['screened' => true]],
        ])->assertOk();

        $this->getJson('/api/avance')
            ->assertJsonPath('avance.level', 'naranja')
            ->assertJsonPath('avance.progress', ['real:naranja:naranja_ci' => true])
            ->assertJsonPath('avance.workflow.azul.screened', true);
    }

    public function test_una_cuenta_nueva_nunca_es_de_kardex(): void
    {
        $this->post('/registro', [
            'name' => 'Intruso',
            'email' => 'x@example.com',
            'password' => 'secreta123',
            'password_confirmation' => 'secreta123',
            'rol' => 'kardex',
        ]);
        $this->assertSame('estudiante', User::where('email', 'x@example.com')->value('rol'));
    }

    public function test_sin_sesion_no_hay_avance_ni_edicion(): void
    {
        $this->getJson('/api/avance')->assertUnauthorized();
        $this->putJson('/api/catalogo/azul', ['requisitos' => []])->assertUnauthorized();
    }

    public function test_un_estudiante_no_puede_editar_la_guia_ni_ver_el_panel(): void
    {
        $e = User::factory()->create();
        $this->actingAs($e)->putJson('/api/catalogo/azul', ['requisitos' => []])->assertForbidden();
        $this->actingAs($e)->get('/panel')->assertForbidden();
    }

    public function test_kardex_reordena_edita_y_borra_requisitos(): void
    {
        $lista = $this->getJson('/api/catalogo')['catalog']['crema_ts'];
        $lista = array_reverse($lista);
        $lista[0]['title'] = 'Título corregido';
        array_pop($lista);

        $this->actingAs($this->kardex())
            ->putJson('/api/catalogo/crema_ts', ['requisitos' => $lista, 'proceso' => 'Nuevo proceso'])
            ->assertOk();

        $nuevo = $this->getJson('/api/catalogo');
        $this->assertCount(count($lista), $nuevo['catalog']['crema_ts']);
        $this->assertSame('Título corregido', $nuevo['catalog']['crema_ts'][0]['title']);
        $this->assertSame($lista[0]['id'], $nuevo['catalog']['crema_ts'][0]['id']);
        $this->assertSame('Nuevo proceso', $nuevo['process']['crema_ts']);
    }

    public function test_kardex_no_puede_guardar_requisitos_incompletos(): void
    {
        $this->actingAs($this->kardex())
            ->putJson('/api/catalogo/azul', ['requisitos' => [['id' => 'x', 'title' => '']]])
            ->assertUnprocessable();
        $this->assertSame(15, Requisito::where('nivel', 'azul')->count());
    }

    public function test_se_cuentan_las_cartas_y_el_panel_las_muestra(): void
    {
        $this->postJson('/api/cartas', ['tipo' => 'cert_ts'])->assertOk();
        $this->postJson('/api/cartas', ['tipo' => 'inventado'])->assertUnprocessable();

        $this->actingAs($this->kardex())->get('/panel')
            ->assertOk()->assertSee('cartas generadas')->assertSee('Calificaciones y conclusión · TS');
    }

    public function test_ingreso_con_clave_incorrecta_y_correcta(): void
    {
        $this->post('/ingresar', ['email' => 'kardex@mifolder.test', 'password' => 'mala'])
            ->assertSessionHasErrors('email');
        $this->post('/ingresar', ['email' => 'kardex@mifolder.test', 'password' => 'kardex2026'])
            ->assertRedirect('/panel');
    }

    public function test_volver_a_sembrar_no_borra_los_cambios_de_kardex(): void
    {
        Requisito::where('codigo', 'azul_ci')->update(['titulo' => 'Editado por Kardex']);
        $this->seed(DatabaseSeeder::class);
        $this->assertSame('Editado por Kardex', Requisito::where('codigo', 'azul_ci')->value('titulo'));
        $this->assertSame(1, User::where('rol', 'kardex')->count());
    }

    public function test_mi_cuenta_muestra_y_guarda_los_datos(): void
    {
        $this->get('/cuenta')->assertRedirect('/ingresar');

        $e = User::factory()->create(['name' => 'Ana Quispe']);
        $this->actingAs($e)->get('/cuenta')->assertOk()->assertSee('Cerrar sesión')->assertSee($e->email);
        $this->actingAs($e)->put('/cuenta', ['name' => 'Ana Q. Mamani', 'registro_universitario' => '201900123'])
            ->assertRedirect();
        $this->assertSame('201900123', $e->fresh()->registro_universitario);
    }

    public function test_la_pagina_sin_permiso_explica_que_es_solo_para_kardex(): void
    {
        $this->actingAs(User::factory()->create())->get('/panel')
            ->assertForbidden()->assertSee('solo para Kardex')->assertSee('Volver a Mi Folder');
    }
}
