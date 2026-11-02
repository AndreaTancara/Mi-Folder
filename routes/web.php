<?php

use App\Http\Controllers\Api\AvanceController;
use App\Http\Controllers\Api\CartaController;
use App\Http\Controllers\Api\CatalogoController;
use App\Http\Controllers\Api\SeguimientoController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PanelController;
use Illuminate\Support\Facades\Route;

// Página principal: la aplicación Mi Folder (las pantallas se cambian con #inicio, #folder/azul, etc.).
Route::view('/', 'app');

// Cuentas
Route::middleware('guest')->group(function () {
    Route::get('/ingresar', [AuthController::class, 'mostrarIngreso'])->name('login');
    Route::post('/ingresar', [AuthController::class, 'ingresar']);
    Route::get('/registro', [AuthController::class, 'mostrarRegistro']);
    Route::post('/registro', [AuthController::class, 'registrar']);
});
Route::middleware('auth')->group(function () {
    Route::get('/cuenta', [AuthController::class, 'cuenta']);
    Route::put('/cuenta', [AuthController::class, 'actualizarCuenta']);
    Route::put('/cuenta/clave', [AuthController::class, 'cambiarClave']);
    Route::post('/salir', [AuthController::class, 'salir']);
});

// Panel de Kardex
Route::middleware(['auth', 'kardex'])->prefix('panel')->group(function () {
    Route::get('/', [PanelController::class, 'index']);
    Route::get('/estudiantes/{user}', [PanelController::class, 'estudiante']);
    Route::post('/estudiantes/{user}/notas', [PanelController::class, 'nota']);
    Route::post('/estudiantes/{user}/clave', [PanelController::class, 'nuevaClave']);
    Route::post('/colacion', [PanelController::class, 'colacion']);
});

// Datos que pide el JavaScript de la página
Route::prefix('api')->group(function () {
    Route::get('/catalogo', [CatalogoController::class, 'index']);
    Route::put('/catalogo/{clave}', [CatalogoController::class, 'actualizar'])->middleware(['auth', 'kardex']);
    Route::get('/avance', [AvanceController::class, 'mostrar'])->middleware('auth');
    Route::put('/avance', [AvanceController::class, 'guardar'])->middleware('auth');
    Route::post('/cartas', [CartaController::class, 'registrar'])->middleware('throttle:30,1');
    Route::post('/seguimiento', [SeguimientoController::class, 'registrar'])->middleware(['auth', 'throttle:20,1']);
});
