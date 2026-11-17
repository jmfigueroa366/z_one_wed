// CAPA: Presentación
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiPost } from '../api/apiClient.ts';
import AuthLayout, { authBoton, authCampo, authEtiqueta } from '../components/AuthLayout.tsx';
import type { ChangeEvent, FormEvent } from 'react';

export default function OlvidePassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [enviado, setEnviado] = useState(false);
    const [cargando, setCargando] = useState(false);

    const manejarCambio = (event: ChangeEvent<HTMLInputElement>) => {
        setEmail(event.target.value);
    };

    const manejarSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setCargando(true);

        try {
            await apiPost('/auth/olvide-password', { Email: email.trim() });
            setEnviado(true);
        } catch (err) {
            setError(err instanceof Error ? err.message || 'No se pudo enviar el enlace.' : 'No se pudo enviar el enlace.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <AuthLayout
            titulo="Recuperar contraseña"
            subtitulo="Escribe tu correo y te enviaremos un enlace para restablecer tu contraseña."
        >
            {enviado ? (
                <p className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-texto" role="status">
                    Si el correo está registrado, recibirás un enlace para restablecer la contraseña.
                </p>
            ) : (
                <form onSubmit={manejarSubmit} className="grid gap-4">
                    <label className="block">
                        <span className={authEtiqueta}>Email</span>
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={manejarCambio}
                            placeholder="tucorreo@ejemplo.com"
                            autoComplete="email"
                            className={authCampo}
                            required
                        />
                    </label>

                    {error ? (
                        <p className="rounded-xl border border-peligro/40 bg-peligro/10 px-4 py-2.5 text-sm text-peligro" role="alert">
                            {error}
                        </p>
                    ) : null}

                    <button type="submit" disabled={cargando} className={authBoton}>
                        {cargando ? 'Enviando...' : 'Enviar enlace'}
                    </button>
                </form>
            )}

            <Link
                className="mt-3 flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-surface/40 px-4 text-sm font-semibold text-texto transition hover:border-accent/60 hover:text-accent"
                to="/login"
            >
                Volver a iniciar sesión
            </Link>
        </AuthLayout>
    );
}
