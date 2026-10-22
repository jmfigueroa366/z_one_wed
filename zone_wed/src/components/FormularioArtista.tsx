// CAPA: Presentación
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { BOTON_PRIMARIO, CAMPO, ETIQUETA } from '../styles/clases.ts';
import { supabase, haySupabase } from '../lib/supabaseClient.ts';
import '../styles/tailwind.css';

const ESPECIALIDADES = ['Pop', 'Vallenato', 'Urbano', 'Rock', 'Salsa', 'Canto', 'Otro'];
const TIPOS_DOCUMENTO = ['CC', 'CE', 'Pasaporte', 'NIT', 'Otro'];
const ESTADOS_CIVILES = ['Soltero', 'Casado', 'Union libre', 'Divorciado', 'Viudo'];
const METODOS_PAGO = ['Transferencia', 'Efectivo', 'Otro'];

interface FormularioArtistaProps {
    onRegistrado: () => void;
}

function leerArchivoBase64(archivo: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = () => {
            if (typeof lector.result === 'string') resolve(lector.result);
            else reject(new Error('No se pudo leer el archivo'));
        };
        lector.onerror = () => reject(new Error('No se pudo leer el archivo'));
        lector.readAsDataURL(archivo);
    });
}

export default function FormularioArtista({ onRegistrado }: FormularioArtistaProps) {
    const [formulario, setFormulario] = useState({
        nombre_completo: '',
        apellidos: '',
        nombre_artistico: '',
        tipo_documento: TIPOS_DOCUMENTO[0],
        numero_identidad: '',
        fecha_nacimiento: '',
        nacionalidad: '',
        estado_civil: ESTADOS_CIVILES[0],
        residencia_habitual: '',
        correo_personal: '',
        numero_celular: '',
        email_login: '',
        password: '',
        genero_musical_principal: ESPECIALIDADES[0],
        fecha_firma: '',
        fecha_inicio: '',
        fecha_terminacion: '',
        datos_bancarios: '',
        metodo_pago_preferido: METODOS_PAGO[0],
        informacion_bancaria: '',
    });
    const [fotoDocumento, setFotoDocumento] = useState<string>('');
    const [fotoArtista, setFotoArtista] = useState<string>('');
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [cargando, setCargando] = useState(false);

    const cambiarCampo = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;
        setFormulario((actual) => ({ ...actual, [name]: value }));
        setError('');
        setMensaje('');
    };

    const manejarFotoDocumento = async (event: ChangeEvent<HTMLInputElement>) => {
        const archivo = event.target.files?.[0];
        setError('');
        if (!archivo) {
            setFotoDocumento('');
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(archivo.type)) {
            setError('El documento debe estar en formato JPG, PNG, WebP o PDF.');
            event.target.value = '';
            return;
        }
        if (archivo.size > 2 * 1024 * 1024) {
            setError('El documento debe pesar 2 MB o menos.');
            event.target.value = '';
            return;
        }
        try {
            const base64 = await leerArchivoBase64(archivo);
            setFotoDocumento(base64);
        } catch {
            setError('No se pudo leer el documento.');
        }
    };

    const manejarFotoArtista = async (event: ChangeEvent<HTMLInputElement>) => {
        const archivo = event.target.files?.[0];
        setError('');
        if (!archivo) {
            setFotoArtista('');
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
            setError('La foto del artista debe estar en formato JPG, PNG o WebP.');
            event.target.value = '';
            return;
        }
        if (archivo.size > 1.5 * 1024 * 1024) {
            setError('La foto del artista debe pesar 1.5 MB o menos.');
            event.target.value = '';
            return;
        }
        try {
            const base64 = await leerArchivoBase64(archivo);
            setFotoArtista(base64);
        } catch {
            setError('No se pudo leer la foto del artista.');
        }
    };

    const registrarArtista = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setMensaje('');

        if (!haySupabase) {
            setError('No hay conexión con Supabase.');
            return;
        }

        if (!fotoDocumento) {
            setError('La foto del documento de identidad es obligatoria.');
            return;
        }

        if (!fotoArtista) {
            setError('La foto del artista es obligatoria.');
            return;
        }

        setCargando(true);

        try {
            const { data, error: rpcError } = await supabase.rpc('crear_artista_completo', {
                p_nombre_completo: formulario.nombre_completo.trim(),
                p_apellidos: formulario.apellidos.trim(),
                p_nombre_artistico: formulario.nombre_artistico.trim(),
                p_tipo_documento: formulario.tipo_documento,
                p_numero_identidad: formulario.numero_identidad.trim(),
                p_fecha_nacimiento: formulario.fecha_nacimiento,
                p_nacionalidad: formulario.nacionalidad.trim(),
                p_estado_civil: formulario.estado_civil,
                p_residencia_habitual: formulario.residencia_habitual.trim(),
                p_correo_personal: formulario.correo_personal.trim().toLowerCase(),
                p_numero_celular: formulario.numero_celular.trim(),
                p_email_login: formulario.email_login.trim().toLowerCase(),
                p_password: formulario.password,
                p_genero_musical_principal: formulario.genero_musical_principal,
                p_fecha_firma: formulario.fecha_firma,
                p_fecha_inicio: formulario.fecha_inicio,
                p_fecha_terminacion: formulario.fecha_terminacion || null,
                p_datos_bancarios: formulario.datos_bancarios.trim() || null,
                p_metodo_pago_preferido: formulario.metodo_pago_preferido || null,
                p_informacion_bancaria: formulario.informacion_bancaria.trim() || null,
                p_foto_documento_identidad: fotoDocumento,
                p_foto_artista: fotoArtista,
            });

            if (rpcError) {
                throw new Error(rpcError.message);
            }

            const resultado = data as { success: boolean; error?: string; email?: string; nombre_artistico?: string } | null;
            if (!resultado?.success) {
                throw new Error(resultado?.error || 'No se pudo crear el artista.');
            }

            setMensaje(`Artista ${resultado.nombre_artistico || formulario.nombre_artistico} creado correctamente. Credenciales: ${resultado.email} / ${formulario.password}`);
            setFormulario({
                nombre_completo: '',
                apellidos: '',
                nombre_artistico: '',
                tipo_documento: TIPOS_DOCUMENTO[0],
                numero_identidad: '',
                fecha_nacimiento: '',
                nacionalidad: '',
                estado_civil: ESTADOS_CIVILES[0],
                residencia_habitual: '',
                correo_personal: '',
                numero_celular: '',
                email_login: '',
                password: '',
                genero_musical_principal: ESPECIALIDADES[0],
                fecha_firma: '',
                fecha_inicio: '',
                fecha_terminacion: '',
                datos_bancarios: '',
                metodo_pago_preferido: METODOS_PAGO[0],
                informacion_bancaria: '',
            });
            setFotoDocumento('');
            setFotoArtista('');
            onRegistrado();
        } catch (errorRegistro) {
            setError(errorRegistro instanceof Error ? errorRegistro.message : 'No se pudo registrar el artista.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <section className="rounded-3xl border border-border bg-surface/70 p-6" aria-labelledby="artist-registration-title">
            <div>
                <p className="workspace-eyebrow">NUEVO TALENTO</p>
                <h2 id="artist-registration-title" className="mt-1 text-xl font-bold tracking-tight text-texto-soft">
                    Registrar artista
                </h2>
            </div>

            <form className="mt-5 grid max-w-4xl gap-6" onSubmit={registrarArtista}>
                <div>
                    <h3 className="text-lg font-semibold text-texto-soft">Datos de Identificación Personal</h3>
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                        <label>
                            <span className={ETIQUETA}>Nombre completo *</span>
                            <input className={CAMPO} name="nombre_completo" value={formulario.nombre_completo} onChange={cambiarCampo} required />
                        </label>
                        <label>
                            <span className={ETIQUETA}>Apellidos completos *</span>
                            <input className={CAMPO} name="apellidos" value={formulario.apellidos} onChange={cambiarCampo} required />
                        </label>
                        <label>
                            <span className={ETIQUETA}>Nombre artístico o pseudónimo *</span>
                            <input className={CAMPO} name="nombre_artistico" value={formulario.nombre_artistico} onChange={cambiarCampo} required />
                        </label>
                        <label>
                            <span className={ETIQUETA}>Tipo de documento *</span>
                            <select className={CAMPO} name="tipo_documento" value={formulario.tipo_documento} onChange={cambiarCampo}>
                                {TIPOS_DOCUMENTO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                            </select>
                        </label>
                        <label>
                            <span className={ETIQUETA}>Número de identidad *</span>
                            <input className={CAMPO} name="numero_identidad" value={formulario.numero_identidad} onChange={cambiarCampo} required />
                        </label>
                        <label>
                            <span className={ETIQUETA}>Fecha de nacimiento *</span>
                            <input className={CAMPO} type="date" name="fecha_nacimiento" value={formulario.fecha_nacimiento} onChange={cambiarCampo} required />
                        </label>
                        <label>
                            <span className={ETIQUETA}>Nacionalidad *</span>
                            <input className={CAMPO} name="nacionalidad" value={formulario.nacionalidad} onChange={cambiarCampo} required />
                        </label>
                        <label>
                            <span className={ETIQUETA}>Estado civil *</span>
                            <select className={CAMPO} name="estado_civil" value={formulario.estado_civil} onChange={cambiarCampo}>
                                {ESTADOS_CIVILES.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                            </select>
                        </label>
                        <label className="md:col-span-2">
                            <span className={ETIQUETA}>Residencia habitual actual *</span>
                            <input className={CAMPO} name="residencia_habitual" value={formulario.residencia_habitual} onChange={cambiarCampo} required />
                        </label>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-texto-soft">Datos de Contacto</h3>
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                        <label>
                            <span className={ETIQUETA}>Correo Personal *</span>
                            <input className={CAMPO} type="email" name="correo_personal" value={formulario.correo_personal} onChange={cambiarCampo} required />
                        </label>
                        <label>
                            <span className={ETIQUETA}>Número de Celular *</span>
                            <input className={CAMPO} name="numero_celular" value={formulario.numero_celular} onChange={cambiarCampo} required />
                        </label>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-texto-soft">Creación del Perfil</h3>
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                        <label>
                            <span className={ETIQUETA}>Correo Electrónico (para la cuenta) *</span>
                            <input className={CAMPO} type="email" name="email_login" value={formulario.email_login} onChange={cambiarCampo} required />
                        </label>
                        <label>
                            <span className={ETIQUETA}>Contraseña de Acceso *</span>
                            <input className={CAMPO} type="password" name="password" value={formulario.password} onChange={cambiarCampo} placeholder="Mínimo 6 caracteres" required />
                        </label>
                        <label>
                            <span className={ETIQUETA}>Rol Principal del Artista *</span>
                            <input className={CAMPO} value="Cantante" disabled />
                        </label>
                        <label>
                            <span className={ETIQUETA}>Género Musical Principal *</span>
                            <select className={CAMPO} name="genero_musical_principal" value={formulario.genero_musical_principal} onChange={cambiarCampo}>
                                {ESPECIALIDADES.map((especialidad) => <option key={especialidad} value={especialidad}>{especialidad}</option>)}
                            </select>
                        </label>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-texto-soft">Vinculación con Productora</h3>
                    <div className="mt-3 grid gap-4 md:grid-cols-3">
                        <label>
                            <span className={ETIQUETA}>Fecha de Firma *</span>
                            <input className={CAMPO} type="date" name="fecha_firma" value={formulario.fecha_firma} onChange={cambiarCampo} required />
                        </label>
                        <label>
                            <span className={ETIQUETA}>Fecha de Inicio *</span>
                            <input className={CAMPO} type="date" name="fecha_inicio" value={formulario.fecha_inicio} onChange={cambiarCampo} required />
                        </label>
                        <label>
                            <span className={ETIQUETA}>Fecha de Terminación</span>
                            <input className={CAMPO} type="date" name="fecha_terminacion" value={formulario.fecha_terminacion} onChange={cambiarCampo} />
                        </label>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-texto-soft">Datos de Pago</h3>
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                        <label className="md:col-span-2">
                            <span className={ETIQUETA}>Datos Bancarios Completos</span>
                            <textarea className={CAMPO} name="datos_bancarios" value={formulario.datos_bancarios} onChange={cambiarCampo} rows={3} />
                        </label>
                        <label>
                            <span className={ETIQUETA}>Método de Pago Preferido</span>
                            <select className={CAMPO} name="metodo_pago_preferido" value={formulario.metodo_pago_preferido} onChange={cambiarCampo}>
                                {METODOS_PAGO.map((metodo) => <option key={metodo} value={metodo}>{metodo}</option>)}
                            </select>
                        </label>
                        <label>
                            <span className={ETIQUETA}>Información Bancaria</span>
                            <input className={CAMPO} name="informacion_bancaria" value={formulario.informacion_bancaria} onChange={cambiarCampo} />
                        </label>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-texto-soft">Archivos para adjuntar</h3>
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                        <div className="grid gap-1.5">
                            <label className={ETIQUETA} htmlFor="doc-identidad">Foto del documento de identidad *</label>
                            <input className={`${CAMPO} text-xs file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-accent/40 file:bg-accent/20 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-texto`} id="doc-identidad" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={manejarFotoDocumento} />
                        </div>
                        <div className="grid gap-1.5">
                            <label className={ETIQUETA} htmlFor="foto-artista">Foto del artista *</label>
                            <input className={`${CAMPO} text-xs file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-accent/40 file:bg-accent/20 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-texto`} id="foto-artista" type="file" accept="image/png,image/jpeg,image/webp" onChange={manejarFotoArtista} />
                        </div>
                    </div>
                </div>

                {error && <p className="m-0 text-sm text-peligro-soft" role="alert">{error}</p>}
                {mensaje && <p className="m-0 text-sm text-exito-soft" role="status">{mensaje}</p>}
                <button className={`${BOTON_PRIMARIO} w-fit`} disabled={cargando} type="submit">
                    {cargando ? 'Registrando...' : 'Registrar artista'}
                </button>
            </form>
        </section>
    );
}

