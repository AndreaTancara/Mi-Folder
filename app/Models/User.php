<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'registro_universitario'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public function avance(): HasOne
    {
        return $this->hasOne(Avance::class);
    }

    public function cartas(): HasMany
    {
        return $this->hasMany(Carta::class);
    }

    public function seguimientos(): HasMany
    {
        return $this->hasMany(Seguimiento::class)->latest('id');
    }

    // Última pausa o "retomé" del propio estudiante (las notas de Kardex no cuentan).
    public function ultimaPausa(): ?Seguimiento
    {
        $ultimo = $this->seguimientos()->where('autor', 'estudiante')->first();

        return $ultimo && $ultimo->motivo !== Seguimiento::RETOMADO ? $ultimo : null;
    }

    // El personal de Kardex puede editar la guía y ver el panel.
    public function esKardex(): bool
    {
        return $this->rol === 'kardex';
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
