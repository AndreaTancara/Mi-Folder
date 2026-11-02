<?php

namespace App\Http\Controllers;

use App\Models\Ajuste;
use App\Models\Avance;
use App\Models\Carta;
use App\Models\Requisito;
use App\Models\Seguimiento;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

// Panel del personal de Kardex: estadísticas, seguimiento de estudiantes y fecha de colación.
class PanelController extends Controller
{
    // Días sin actividad para considerar que un estudiante está "estancado".
    public const DIAS_INACTIVO = 30;

    public function index(Request $request)
    {
        $requisitos = Requisito::all();
        $filas = User::where('rol', 'estudiante')->with(['avance', 'seguimientos'])->get()
            ->map(fn (User $u) => $this->filaEstudiante($u, $requisitos))
            ->sortByDesc(fn ($f) => [$f['atencion'], $f['dias']])
            ->values();

        // Buscador: por nombre, R.U. o correo (sin importar mayúsculas).
        $buscar = trim((string) $request->query('buscar', ''));
        $encontrados = $buscar === '' ? $filas : $filas->filter(fn ($f) => Str::contains(
            Str::lower($f['user']->name.' '.$f['user']->registro_universitario.' '.$f['user']->email),
            Str::lower($buscar)
        ))->values();

        $etapas = ['azul' => 0, 'naranja' => 0, 'crema_ts' => 0, 'crema_lic' => 0];
        $motivos = array_fill_keys(array_keys(Seguimiento::MOTIVOS), 0);
        foreach ($filas as $f) {
            if ($f['nivel']) {
                $etapas[$f['nivel']]++;
            }
            if ($f['pausa']) {
                $motivos[$f['pausa']->motivo]++;
            }
        }

        $cartas = Carta::selectRaw('tipo, count(*) as total')->groupBy('tipo')->pluck('total', 'tipo');

        return view('panel', [
            'estudiantes' => $filas->count(),
            'requisitos' => $requisitos->count(),
            'etapas' => $etapas,
            'entregados' => $filas->where('entregado', true)->count(),
            'cartas' => $cartas,
            'totalCartas' => $cartas->sum(),
            'filas' => $encontrados,
            'buscar' => $buscar,
            // Aviso si la cuenta de Kardex todavía usa la contraseña de ejemplo.
            'claveInicial' => Hash::check('kardex2026', $request->user()->password),
            'enPausa' => $filas->whereNotNull('pausa')->count(),
            'inactivos' => $filas->where('inactivo', true)->count(),
            'vencidas' => $filas->where('tencia.estado', 'vencida')->count(),
            'porVencer' => $filas->where('tencia.estado', 'por_vencer')->count(),
            'motivos' => $motivos,
            'colacionFecha' => Ajuste::leer('colacion_fecha'),
            'colacionTexto' => Ajuste::leer('colacion_texto'),
        ]);
    }

    public function estudiante(User $user)
    {
        abort_if($user->esKardex(), 404);
        $user->load(['avance', 'seguimientos']);

        return view('panel-estudiante', [
            'e' => $user,
            'fila' => $this->filaEstudiante($user, Requisito::all()),
        ]);
    }

    public function nota(Request $request, User $user)
    {
        abort_if($user->esKardex(), 404);
        $datos = $request->validate(['detalle' => ['required', 'string', 'max:1000']]);
        $user->seguimientos()->create($datos + ['autor' => 'kardex', 'motivo' => Seguimiento::NOTA]);

        return back()->with('ok', 'Nota guardada.');
    }

    // El estudiante olvidó su contraseña: Kardex le da una nueva (se muestra una sola vez).
    public function nuevaClave(User $user)
    {
        abort_if($user->esKardex(), 404);
        $clave = 'folder-'.random_int(1000, 9999).Str::lower(Str::random(3));
        $user->update(['password' => $clave]);
        $user->seguimientos()->create(['autor' => 'kardex', 'motivo' => Seguimiento::NOTA, 'detalle' => 'Kardex le dio una contraseña nueva.']);

        return back()->with('clave', $clave);
    }

    public function colacion(Request $request)
    {
        $datos = $request->validate([
            'fecha' => ['nullable', 'date_format:Y-m-d'],
            'texto' => ['nullable', 'string', 'max:150'],
        ]);
        Ajuste::guardar('colacion_fecha', $datos['fecha'] ?? null);
        Ajuste::guardar('colacion_texto', $datos['texto'] ?? null);

        return back()->with('ok', $datos['fecha'] ?? null ? 'Fecha de colación guardada.' : 'Fecha de colación quitada.');
    }

    // Resume la situación de un estudiante para la tabla de seguimiento.
    private function filaEstudiante(User $u, $requisitos): array
    {
        $avance = $u->avance;
        $pausa = $u->seguimientos->where('autor', 'estudiante')->first();
        $pausa = $pausa && $pausa->motivo !== Seguimiento::RETOMADO ? $pausa : null;

        $ultima = collect([$avance?->updated_at, $u->seguimientos->where('autor', 'estudiante')->first()?->created_at, $u->created_at])
            ->filter()->max();
        $dias = (int) $ultima->diffInDays(now());

        $nivel = $avance?->nivel;
        $porcentaje = $avance ? self::porcentaje($avance, $requisitos->where('nivel', $nivel)) : 0;
        $tramite = $avance?->tramite ?? [];
        $entregado = ! empty($tramite['azul']['delivered']) || ! empty($tramite['naranja']['delivered']);
        $terminado = str_starts_with((string) $nivel, 'crema') && $porcentaje === 100;
        $tencia = $avance ? self::tencia($avance, $requisitos) : null;
        $inactivo = ! $terminado && $dias >= self::DIAS_INACTIVO;

        return [
            'user' => $u,
            'nivel' => $nivel,
            'porcentaje' => $porcentaje,
            'dias' => $dias,
            'entregado' => $entregado,
            'pausa' => $pausa,
            'inactivo' => $inactivo,
            'tencia' => $tencia,
            'atencion' => (bool) ($pausa || $inactivo || ($tencia['estado'] ?? null) === 'vencida'),
        ];
    }

    // Porcentaje de documentos marcados del folder actual (sin contar los que "no aplican").
    public static function porcentaje(Avance $avance, $requisitosDelNivel): int
    {
        $marcados = $avance->marcados ?? [];
        $noAplica = $avance->no_aplica ?? [];
        $total = 0;
        $hechos = 0;
        foreach ($requisitosDelNivel as $r) {
            $clave = 'real:'.$r->nivel.':'.$r->codigo;
            if (! empty($noAplica[$clave])) {
                continue;
            }
            $total++;
            $hechos += ! empty($marcados[$clave]) ? 1 : 0;
        }

        return $total ? (int) round($hechos * 100 / $total) : 0;
    }

    // Estado de la tencia (o de cualquier documento que vence): vigente, por_vencer o vencida.
    public static function tencia(Avance $avance, $requisitos): ?array
    {
        foreach ($avance->fechas ?? [] as $clave => $fecha) {
            [, $nivel, $codigo] = explode(':', $clave) + [null, null, null];
            $r = $requisitos->first(fn ($x) => $x->nivel === $nivel && $x->codigo === $codigo);
            $vence = Requisito::venceEl($fecha, $r?->vigencia);
            if (! $vence) {
                continue;
            }
            $dias = (int) now()->startOfDay()->diffInDays(Carbon::parse($vence), false);

            return [
                'sacada' => $fecha,
                'vence' => $vence,
                'dias' => $dias,
                'estado' => $dias < 0 ? 'vencida' : ($dias <= 30 ? 'por_vencer' : 'vigente'),
            ];
        }

        return null;
    }
}
