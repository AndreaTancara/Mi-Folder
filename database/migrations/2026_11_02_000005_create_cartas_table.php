<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Registro de cartas generadas. Solo el tipo y la fecha: no se guardan datos personales de la carta.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cartas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('tipo', 20);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cartas');
    }
};
