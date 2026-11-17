// CAPA: Presentación
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiPost } from '../api/apiClient.ts';
import AuthLayout, { authBoton, authCampo, authEtiqueta } from '../components/AuthLayout.tsx';
import { validarPasswordSegura } from '../utils/validators.ts';
import type { ChangeEvent, FormEvent } from 'react';

export default function RestablecerPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') ?? '';
    const [formulario, setFormulario] = useState({ password: '', confirmacion: '' });
    const [error, setError] = useState('');
    const [exito, setExito] = useState(false);
    const [cargando, setCargando] = useState(false);

    const manejarCambio = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormulario((anterior) => ({ ...anterior, [name]: value }));
    };

    const manejarSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        if (!token) {
            setError('Falta el token en el enlace. Solicita un nuevo correo de recuperación.');
            return;
        }

        const errores = validarPasswordSegura(formulario.password, undefined, undefined, 8);
        if (formulario.password !== formulario.confirmacion) {
            errores.push('Las contraseñas no coinciden.');
        }
        if (errores.length > 0) {
            setError(errores.join(' '));
            return;
        }

        setCargando(true);
        try {
            await apiPost('/auth/restablecer-password', {
                Token: token,
                PasswordNueva: formulario.password,
            });
            setExito(true);
        } catch (err) {
            setError(err instanceof Error ? err.message || 'No se pudo cambiar la contraseña.' : 'No se pudo cambiar la contraseña.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <AuthLayout
            titulo="Cambiar contraseña"
            subtitulo="Elige una nueva contraseña para tu cuenta."
        >
            {!token ? (
                <p className="rounded-xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-peligro" role="alert">
                    Falta el token en el enlace. Solicita un nuevo correo de recuperación.
                </p>
            ) : exito ? (
                <p className="rounded-xl border border-exito/30 bg-exito/10 px-4 py-3 text-sm text-exito-soft" role="status">
                    Tu contraseña se cambió correctamente. Ya puedes iniciar sesión.
                </p>
            ) : (
                <form onSubmit={manejarSubmit} className="grid gap-4">
                    <label className="block">
                        <span className={authEtiqueta}>Contraseña nueva</span>
                        <input
                            type="password"
                            name="password"
                            value={formulario.password}
                            onChange={manejarCambio}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            className={authCampo}
                            minLength={8}
                            required
                        />
                    </label>

                    <label className="block">
                        <span className={authEtiqueta}>Confirmar contraseña</span>
                        <input
                            type="password"
                            name="confirmacion"
                            value={formulario.confirmacion}
                            onChange={manejarCambio}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            className={authCampo}
                            minLength={8}
                            required
                        />
                    </label>

                    {error ? (
                        <p className="rounded-xl border border-peligro/40 bg-peligro/10 px-4 py-2.5 text-sm text-peligro" role="alert">
                            {error}
                        </p>
                    ) : null}

                    <button type="submit" disabled={cargando} className={authBoton}>
                        {cargando ? 'Cambiando...' : 'Cambiar contraseña'}
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
