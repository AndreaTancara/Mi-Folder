<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Avance de cada estudiante: documentos marcados, etapa del trámite y certificados calculados.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('avances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('nivel', 20)->default('azul');
            $table->json('marcados');
            $table->json('no_aplica');
            $table->json('tramite');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('avances');
    }
};
