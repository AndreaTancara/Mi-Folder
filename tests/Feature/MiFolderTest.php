<?php

namespace Tests\Feature;

use App\Models\Requisito;
use App\Models\Seguimiento;
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

        $this->getJson('/api/avance')->assertOk()->assertExactJson(['avance' => null, 'pausa' => null]);

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

    private function avanceCon(User $u, array $fechas = [], array $marcados = []): void
    {
        $u->avance()->create(['nivel' => 'azul', 'marcados' => $marcados, 'no_aplica' => [], 'tramite' => [], 'fechas' => $fechas]);
    }

    public function test_la_tencia_vale_hasta_fin_de_anio(): void
    {
        $this->assertSame('2026-12-31', Requisito::venceEl('2026-03-15', 'gestion'));
        $this->assertNull(Requisito::venceEl('2026-03-15', null));
        $this->assertNull(Requisito::venceEl('no es fecha', 'gestion'));

        $r = $this->getJson('/api/catalogo')->assertOk();
        $tencia = collect($r['catalog']['azul'])->firstWhere('id', 'azul_documentos');
        $this->assertSame('gestion', $tencia['validity']);
    }

    public function test_se_guardan_las_fechas_de_los_documentos(): void
    {
        $u = User::factory()->create();
        $this->actingAs($u)->putJson('/api/avance', [
            'level' => 'azul',
            'progress' => [],
            'excluded' => [],
            'workflow' => [],
            'dates' => ['real:azul:azul_documentos' => '2026-02-10', 'real:azul:x' => 'mal', 'mala clave' => '2026-01-01'],
        ])->assertOk();

        $this->getJson('/api/avance')->assertJsonPath('avance.dates', ['real:azul:azul_documentos' => '2026-02-10']);
    }

    public function test_el_estudiante_pausa_y_retoma_su_tramite(): void
    {
        $u = User::factory()->create();
        $this->actingAs($u)->postJson('/api/seguimiento', ['motivo' => 'dinero', 'detalle' => 'Junto para el depósito'])
            ->assertOk()->assertJsonPath('pausa.motivo', Seguimiento::MOTIVOS['dinero']);
        $this->getJson('/api/avance')->assertJsonPath('pausa.motivo', Seguimiento::MOTIVOS['dinero']);

        $this->postJson('/api/seguimiento', ['motivo' => 'inventado'])->assertUnprocessable();

        $this->postJson('/api/seguimiento', ['motivo' => 'retomado'])->assertOk()->assertJsonPath('pausa', null);
        $this->getJson('/api/avance')->assertJsonPath('pausa', null);
        $this->assertSame(2, $u->seguimientos()->count());
    }

    public function test_el_panel_muestra_quien_necesita_atencion(): void
    {
        $pausado = User::factory()->create(['name' => 'Estudiante Pausado']);
        $pausado->seguimientos()->create(['autor' => 'estudiante', 'motivo' => 'tiempo']);

        $quieto = User::factory()->create(['name' => 'Estudiante Quieto', 'created_at' => now()->subDays(60)]);

        $vencido = User::factory()->create(['name' => 'Estudiante Vencido']);
        $this->avanceCon($vencido, ['real:azul:azul_documentos' => (now()->year - 1).'-05-01']);

        $this->actingAs($this->kardex())->get('/panel')->assertOk()
            ->assertSee('Estudiante Pausado')->assertSee(Seguimiento::MOTIVOS['tiempo'])
            ->assertSee('Estudiante Quieto')->assertSee('Sin avanzar')
            ->assertSee('Estudiante Vencido')->assertSee('Vencida');

        $this->get('/panel/estudiantes/'.$vencido->id)->assertOk()->assertSee('debe volver a hacer el depósito');
    }

    public function test_kardex_anota_y_pone_la_fecha_de_colacion(): void
    {
        $e = User::factory()->create();
        $this->actingAs($this->kardex());

        $this->post('/panel/estudiantes/'.$e->id.'/notas', ['detalle' => 'Se le llamó por teléfono'])->assertRedirect();
        $this->get('/panel/estudiantes/'.$e->id)->assertSee('Se le llamó por teléfono')->assertSee('Nota de Kardex');

        $this->post('/panel/colacion', ['fecha' => '2026-11-23', 'texto' => 'Colación de diciembre'])->assertRedirect();
        $this->getJson('/api/catalogo')->assertJsonPath('colacion', ['fecha' => '2026-11-23', 'texto' => 'Colación de diciembre']);

        $this->post('/panel/colacion', ['fecha' => '23/11/2026'])->assertSessionHasErrors('fecha');
        $this->post('/panel/colacion', ['fecha' => ''])->assertRedirect();
        $this->getJson('/api/catalogo')->assertJsonPath('colacion.fecha', null);
    }

    public function test_un_estudiante_no_entra_al_seguimiento_de_otros(): void
    {
        $otro = User::factory()->create();
        $this->actingAs(User::factory()->create());
        $this->get('/panel/estudiantes/'.$otro->id)->assertForbidden();
        $this->post('/panel/estudiantes/'.$otro->id.'/notas', ['detalle' => 'x'])->assertForbidden();
        $this->post('/panel/colacion', ['fecha' => '2026-11-23'])->assertForbidden();
        $this->post('/api/seguimiento', ['motivo' => 'dinero']);
        $this->assertSame(0, $otro->seguimientos()->count());
    }

    public function test_sin_sesion_no_se_registra_seguimiento(): void
    {
        $this->postJson('/api/seguimiento', ['motivo' => 'dinero'])->assertUnauthorized();
    }

    public function test_al_salir_se_pide_borrar_el_avance_del_navegador(): void
    {
        $this->actingAs(User::factory()->create())->post('/salir')
            ->assertRedirect('/')->assertSessionHas('salio', true);
        $this->assertGuest();
    }

    public function test_el_estudiante_cambia_su_contrasena(): void
    {
        $u = User::factory()->create(['email' => 'ana@x.com', 'password' => 'secreta123']);
        $this->actingAs($u);

        $this->put('/cuenta/clave', ['clave_actual' => 'equivocada', 'password' => 'nueva12345', 'password_confirmation' => 'nueva12345'])
            ->assertSessionHasErrors('clave_actual');
        $this->put('/cuenta/clave', ['clave_actual' => 'secreta123', 'password' => 'nueva12345', 'password_confirmation' => 'nueva12345'])
            ->assertSessionHas('ok');

        $this->post('/salir');
        $this->post('/ingresar', ['email' => 'ana@x.com', 'password' => 'nueva12345'])->assertRedirect('/');
        $this->assertAuthenticatedAs($u);
    }

    public function test_kardex_da_una_contrasena_nueva_a_quien_la_olvido(): void
    {
        $u = User::factory()->create(['email' => 'ana@x.com']);
        $this->actingAs($this->kardex())->post('/panel/estudiantes/'.$u->id.'/clave')->assertSessionHas('clave');
        $clave = session('clave');
        $this->assertMatchesRegularExpression('/^folder-\d{4}[a-z0-9]{3}$/', $clave);
        $this->get('/panel/estudiantes/'.$u->id)->assertSee('le dio una contraseña nueva');

        $this->post('/salir');
        $this->post('/ingresar', ['email' => 'ana@x.com', 'password' => $clave])->assertRedirect('/');
        $this->assertAuthenticatedAs($u);
    }

    public function test_un_estudiante_no_puede_cambiar_la_clave_de_otro(): void
    {
        $otro = User::factory()->create();
        $this->actingAs(User::factory()->create())->post('/panel/estudiantes/'.$otro->id.'/clave')->assertForbidden();
    }

    public function test_el_panel_busca_estudiantes_y_avisa_la_clave_de_ejemplo(): void
    {
        User::factory()->create(['name' => 'Ana Quispe', 'registro_universitario' => '200111']);
        User::factory()->create(['name' => 'Beto Mamani']);
        $this->actingAs($this->kardex());

        $this->get('/panel')->assertSee('contraseña de ejemplo')->assertSee('Ana Quispe')->assertSee('Beto Mamani');
        $this->get('/panel?buscar=quispe')->assertSee('Ana Quispe')->assertDontSee('Beto Mamani');
        $this->get('/panel?buscar=200111')->assertSee('Ana Quispe');
        $this->get('/panel?buscar=nadie')->assertSee('Nadie coincide');
    }
}
