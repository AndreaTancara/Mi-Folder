<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Rol de cada cuenta: "estudiante" (por defecto) o "kardex" (personal que edita la guía).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('rol', 20)->default('estudiante')->after('email');
            $table->string('registro_universitario', 40)->nullable()->after('rol');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['rol', 'registro_universitario']);
        });
    }
};
