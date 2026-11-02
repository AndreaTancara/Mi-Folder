<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Vencimiento de documentos (tencia), seguimiento de estudiantes y fecha límite de colación.
return new class extends Migration
{
    public function up(): void
    {
        // Hasta cuándo vale un documento: null (no vence) o "gestion" (hasta el 31 de diciembre).
        Schema::table('requisitos', function (Blueprint $table) {
            $table->string('vigencia', 10)->nullable()->after('condicion');
        });
        DB::table('requisitos')->where('codigo', 'like', '%_documentos')->update(['vigencia' => 'gestion']);

        // Fecha en que el estudiante sacó cada documento que vence.
        Schema::table('avances', function (Blueprint $table) {
            $table->json('fechas')->nullable()->after('tramite');
        });

        // Historial de seguimiento: pausas del estudiante y notas de Kardex.
        Schema::create('seguimientos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('autor', 12); // "estudiante" o "kardex"
            $table->string('motivo', 20);
            $table->text('detalle')->nullable();
            $table->timestamps();
        });

        // Ajustes que Kardex cambia desde el panel (por ejemplo, la fecha límite de colación).
        Schema::create('ajustes', function (Blueprint $table) {
            $table->string('clave', 40)->primary();
            $table->text('valor')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ajustes');
        Schema::dropIfExists('seguimientos');
        Schema::table('avances', fn (Blueprint $table) => $table->dropColumn('fechas'));
        Schema::table('requisitos', fn (Blueprint $table) => $table->dropColumn('vigencia'));
    }
};
