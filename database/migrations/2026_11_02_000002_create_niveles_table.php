<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Los cuatro folders (azul, naranja, crema_ts, crema_lic) y el texto de "¿Qué sigue después?".
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('niveles', function (Blueprint $table) {
            $table->string('clave', 20)->primary();
            $table->string('nombre', 100);
            $table->text('proceso')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('niveles');
    }
};
