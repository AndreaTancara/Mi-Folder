<?php

namespace Database\Seeders;

use App\Models\Nivel;
use App\Models\Requisito;
use App\Models\User;
use Illuminate\Database\Seeder;

// Llena la base con los folders y requisitos de la guía, y crea la cuenta del personal de Kardex.
// Se ejecuta con: php artisan migrate --seed
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $datos = json_decode(file_get_contents(__DIR__.'/catalogo.json'), true);
        $nombres = [
            'azul' => 'Técnico Superior',
            'naranja' => 'Licenciatura',
            'crema_ts' => 'Modalidad de graduación TS',
            'crema_lic' => 'Modalidad de graduación Licenciatura',
        ];

        // Solo carga la guía la primera vez: si Kardex ya la editó, no se pisan sus cambios.
        foreach (Nivel::CLAVES as $clave) {
            $nivel = Nivel::firstOrCreate(
                ['clave' => $clave],
                ['nombre' => $nombres[$clave], 'proceso' => $datos['process'][$clave] ?? '']
            );
            if (! $nivel->wasRecentlyCreated) {
                continue;
            }
            foreach ($datos['catalog'][$clave] ?? [] as $orden => $r) {
                Requisito::create(Requisito::desdePagina($r) + ['nivel' => $clave, 'orden' => $orden]);
            }
        }

        $kardex = User::firstOrNew(['email' => env('KARDEX_EMAIL', 'kardex@mifolder.test')]);
        if (! $kardex->exists) {
            $kardex->name = 'Personal de Kardex';
            $kardex->password = env('KARDEX_PASSWORD', 'kardex2026');
            $kardex->rol = 'kardex';
            $kardex->save();
        }
    }
}
