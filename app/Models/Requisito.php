<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'nivel', 'codigo', 'orden', 'titulo', 'descripcion', 'donde', 'como', 'costo',
    'tiempo', 'revisar', 'condicion', 'fuente', 'fecha', 'verificado',
])]
class Requisito extends Model
{
    // Nombre de cada campo en la base de datos => nombre que usa el JavaScript de la página.
    public const CAMPOS = [
        'codigo' => 'id',
        'titulo' => 'title',
        'descripcion' => 'description',
        'donde' => 'where',
        'como' => 'how',
        'costo' => 'cost',
        'tiempo' => 'time',
        'revisar' => 'check',
        'condicion' => 'condition',
        'fuente' => 'source',
        'fecha' => 'date',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date:Y-m-d',
            'verificado' => 'boolean',
        ];
    }

    // Convierte el requisito al formato que entiende la página (core.js).
    public function paraPagina(): array
    {
        $r = [];
        foreach (self::CAMPOS as $columna => $campo) {
            $r[$campo] = $columna === 'fecha' ? $this->fecha->format('Y-m-d') : (string) $this->$columna;
        }
        $r['verified'] = $this->verificado;

        return $r;
    }

    // Convierte un requisito enviado por la página al formato de la base de datos.
    public static function desdePagina(array $r): array
    {
        $datos = [];
        foreach (self::CAMPOS as $columna => $campo) {
            $datos[$columna] = trim((string) ($r[$campo] ?? ''));
        }
        $datos['verificado'] = ($r['verified'] ?? false) === true;

        return $datos;
    }
}
