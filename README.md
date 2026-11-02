# Mi Folder (Laravel)

Guía para armar los folders de titulación en Kardex (Ingeniería de Sistemas, UPEA),
ahora con **Laravel** y **base de datos**.

## Qué hace

- **Estudiantes:** ven los requisitos de cada folder, marcan lo que ya tienen, calculan sus
  certificados con su récord y generan sus cartas. Si crean una cuenta, su avance se guarda
  en la base de datos y lo ven desde cualquier computadora.
- **Personal de Kardex:** ingresa con su cuenta, edita la guía de requisitos (todos ven el cambio)
  y ve un panel con estadísticas y el **seguimiento** de cada estudiante: quién pausó su trámite
  y por qué, quién no avanza hace más de 30 días y a quién se le venció la tencia. También pone
  la **fecha límite del acto de colación** y los estudiantes ven cuántos días les quedan.
- **Tencia (certificado de documentos):** vale hasta el 31 de diciembre del año en que se saca.
  El estudiante anota la fecha y la página le avisa cuando vence.

## Cómo correrlo en tu computadora (Laragon)

1. Instala **Laragon** (https://laragon.org/download) y ábrelo. Presiona **Start All**.
   Revisa que su PHP sea 8.3 o más nuevo (`php -v` en la terminal de Laragon).
2. Copia esta carpeta dentro de `C:\laragon\www\` (queda `C:\laragon\www\mi-folder`).
3. En Laragon, clic en **Terminal**, entra a la carpeta y ejecuta, una línea a la vez:

   ```
   cd mi-folder
   composer install
   copy .env.example .env
   php artisan key:generate
   php artisan migrate --seed
   php artisan serve
   ```

   Si `migrate` pregunta si quieres crear la base de datos `mi_folder`, responde **yes**.
4. Abre http://127.0.0.1:8000 en el navegador.

**Cuenta de Kardex inicial:** `kardex@mifolder.test` / `kardex2026`.
Cámbiala en `.env` (`KARDEX_EMAIL`, `KARDEX_PASSWORD`) antes de ejecutar `migrate --seed`
en un servidor público.

## Pruebas

```
php artisan test
```

## Cómo está organizado (para aprender)

| Carpeta / archivo | Qué hay ahí |
| --- | --- |
| `routes/web.php` | Las direcciones de la página (`/`, `/ingresar`, `/panel`, `/api/...`). Empieza a leer por aquí. |
| `app/Http/Controllers/` | Lo que pasa cuando alguien entra a cada dirección. |
| `app/Models/` | Las tablas de la base de datos como clases de PHP: `User`, `Nivel`, `Requisito`, `Avance`, `Carta`, `Seguimiento`, `Ajuste`. |
| `database/migrations/` | Cómo se crean las tablas. |
| `database/seeders/` | Los datos iniciales: los 38 requisitos (`catalogo.json`) y la cuenta de Kardex. Solo se cargan la primera vez. |
| `resources/views/` | Las páginas en HTML (Blade): `app` (la app), `auth/` (ingreso y registro), `panel` y `panel-estudiante`. |
| `public/js/`, `public/css/` | El JavaScript y los estilos de la app original. `servidor.js` la conecta con Laravel. |
| `app/Http/Middleware/SoloKardex.php` | Deja entrar al editor y al panel solo a la cuenta de Kardex. |
| `tests/Feature/MiFolderTest.php` | Pruebas automáticas. |
| `Dockerfile` | Para publicar en Render. |

## Base de datos

- `users`: cuentas (rol `estudiante` o `kardex`).
- `niveles`: los 4 folders y el texto de "¿Qué sigue después?".
- `requisitos`: cada documento de cada folder, en orden.
- `avances`: lo que cada estudiante marcó y en qué etapa está.
- `cartas`: cuántas cartas se generaron de cada tipo (sin datos personales).
- `seguimientos`: pausas de los estudiantes (con su motivo), cuándo retoman y notas de Kardex.
- `ajustes`: valores sueltos que cambia Kardex, como la fecha del acto de colación.

## Seguridad

- Contraseñas cifradas, protección CSRF en formularios y consultas seguras (Eloquent) contra inyección SQL.
- Máximo 5 intentos de ingreso por minuto.
- Las cuentas nuevas siempre son de estudiante; el rol `kardex` solo se asigna desde la base de datos.
- El récord académico se sigue leyendo en el navegador: nunca se sube al servidor.
