<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Cada documento que se pide en un folder. "orden" define el orden de la carpeta.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('requisitos', function (Blueprint $table) {
            $table->id();
            $table->string('nivel', 20);
            $table->foreign('nivel')->references('clave')->on('niveles')->cascadeOnDelete();
            $table->string('codigo', 100);
            $table->unsignedSmallInteger('orden')->default(0);
            $table->string('titulo', 160);
            $table->text('descripcion');
            $table->string('donde', 400);
            $table->text('como');
            $table->string('costo', 150)->nullable();
            $table->string('tiempo', 150)->nullable();
            $table->text('revisar');
            $table->text('condicion')->nullable();
            $table->string('fuente', 400);
            $table->date('fecha');
            $table->boolean('verificado')->default(false);
            $table->timestamps();
            $table->unique(['nivel', 'codigo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requisitos');
    }
};
