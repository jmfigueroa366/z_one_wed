-- ============================================================
-- Z-ONE · Fase 2 · Columnas que la app necesita para escribir
-- Requiere: tablas, rls, funciones, seed, solicitudes, vistaColaboradores,
--           sesiones y arregloFront2 ya ejecutados.
-- La app (local primero) ya funciona con el esquema actual: si falta una de
-- estas columnas, la escritura simplemente deja de enviar ese dato. Al
-- ejecutar este archivo, la informacion completa pasa a guardarse en Supabase.
-- Es idempotente: se puede ejecutar mas de una vez sin romper nada.
-- ============================================================

-- ---------- 1) Canciones: partes de audio y ensayo ----------
-- La app guarda las partes de la grabacion (vocales, guitarra...) como arreglo
-- y marca si la canción necesita ensayo antes de la sesion. Se usa el mismo
-- tipo que en solicitudes y sesiones (jsonb).
alter table public.canciones
  add column if not exists partes jsonb not null default '[]'::jsonb,
  add column if not exists requiere_ensayo boolean not null default false;

comment on column public.canciones.partes is
  'Partes de la grabacion (vocales, guitarra...) como arreglo json.';
comment on column public.canciones.requiere_ensayo is
  'true si la canción necesita ensayo previo a la sesion.';


-- ---------- 2) Proyectos: tipo de proyecto ----------
-- album, ep o sencillo. Es lo que usa la app para calcular la facturacion.
alter table public.proyectos
  add column if not exists tipo text;

comment on column public.proyectos.tipo is
  'Tipo de proyecto: album, ep o sencillo.';


-- ---------- 3) Colaboradores: especialidad ----------
-- Genero o area del colaborador (Pop, Grabacion, Ingenieria de sonido...).
-- La vista publica se recrea para que tambien la exponga.
alter table public.colaboradores
  add column if not exists especialidad text;

comment on column public.colaboradores.especialidad is
  'Genero o area principal del colaborador.';

-- La fecha de ingreso es obligatoria: se rellena sola si no se envia.
alter table public.colaboradores
  add column if not exists fecha_ingreso date not null default current_date;

alter table public.colaboradores
  alter column fecha_ingreso set default current_date;

-- Si la columna ya existia sin la obligatoriedad, se deja obligatoria.
update public.colaboradores set fecha_ingreso = current_date where fecha_ingreso is null;

alter table public.colaboradores
  alter column fecha_ingreso set not null;


-- ---------- 4) Vista publica de colaboradores con la especialidad ----------
drop view if exists public.colaboradores_publicos;

create view public.colaboradores_publicos as
select
  c.id,
  c.perfil,
  c.nombre_artistico,
  c.nombre_real,
  c.vinculacion,
  c.disponibilidad,
  c.especialidad,
  c.biografia,
  c.trayectoria,
  c.productoras,
  c.foto
from public.colaboradores c
where c.vinculacion = 'activo' and c.visible_publico = true;

grant select on public.colaboradores_publicos to anon, authenticated;


-- ---------- 5) Indices de las claves foraneas ----------
-- Las consultas de la app siempre filtran por proyecto, cliente o sala.
create index if not exists idx_canciones_proyecto_id
  on public.canciones (proyecto_id);
create index if not exists idx_proyectos_cliente_id
  on public.proyectos (cliente_id);
create index if not exists idx_colaboradores_usuario_id
  on public.colaboradores (usuario_id);
create index if not exists idx_solicitudes_cancion_id
  on public.solicitudes (cancion_id);
create index if not exists idx_solicitudes_proyecto_id
  on public.solicitudes (proyecto_id);
create index if not exists idx_solicitudes_sala_id
  on public.solicitudes (sala_id);
create index if not exists idx_solicitud_colaboradores_colaborador_id
  on public.solicitud_colaboradores (colaborador_id);
create index if not exists idx_sesiones_cancion_id
  on public.sesiones (cancion_id);
create index if not exists idx_sesiones_sala_id
  on public.sesiones (sala_id);
create index if not exists idx_sesiones_colaborador_id
  on public.sesiones (colaborador_id);
