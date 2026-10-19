-- ============================================================
-- Z-ONE · 01 · Esquema Supabase (BORRADOR)
-- Ejecutar en: Supabase -> SQL Editor -> New query -> Run
-- Empezar de cero. Revisa y ajusta los campos antes de dar uso.
-- Orden: 01_schema -> 02_rls -> 03_funciones -> 04_seed
-- ============================================================

-- ---------- 0) Extensiones ----------
create extension if not exists pgcrypto with schema extensions;

-- ---------- 0.1) Limpieza (borra lo anterior si existe) ----------
drop table if exists public.ordenes cascade;
drop table if exists public.sesiones cascade;
drop table if exists public.solicitud_colaboradores cascade;
drop table if exists public.solicitudes cascade;
drop table if exists public.canciones cascade;
drop table if exists public.proyectos cascade;
drop table if exists public.invitaciones cascade;
drop table if exists public.colaborador_artistas cascade;
drop table if exists public.colaborador_productores cascade;
drop table if exists public.colaborador_ingenieros_sonido cascade;
drop table if exists public.colaborador_ingenieros_mezcla cascade;
drop table if exists public.colaborador_ingenieros_master cascade;
drop table if exists public.colaborador_otros cascade;
drop table if exists public.colaborador_proyectos cascade;
drop table if exists public.colaborador_notas cascade;
drop table if exists public.colaboradores cascade;
drop table if exists public.clientes cascade;
drop table if exists public.salas cascade;
drop table if exists public.usuarios cascade;
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.manejar_nuevo_usuario() cascade;
drop type if exists public.estado_portafolio cascade;
drop type if exists public.disponibilidad cascade;
drop type if exists public.estado_vinculacion cascade;
drop type if exists public.estado_invitacion_colaborador cascade;
drop type if exists public.estado_invitacion cascade;
drop type if exists public.estado_solicitud cascade;
drop type if exists public.tipo_cliente cascade;
drop type if exists public.perfil_colaborador cascade;
drop type if exists public.rol_usuario cascade;

-- ---------- 1) Tipos (enumeraciones) ----------
create type public.rol_usuario as enum ('administrador', 'cliente', 'colaborador');
create type public.tipo_cliente as enum ('persona', 'empresa');
create type public.perfil_colaborador as enum (
  'artista', 'productor', 'ingeniero_sonido',
  'ingeniero_mezcla', 'ingeniero_master', 'otro'
);
create type public.estado_vinculacion as enum ('activo', 'desvinculado');
create type public.disponibilidad as enum ('disponible', 'no_disponible');
create type public.estado_portafolio as enum ('finalizado', 'activo');
create type public.estado_solicitud as enum (
  'solicitada', 'confirmada', 'rechazada', 'cancelada'
);
create type public.estado_invitacion as enum ('pendiente', 'aceptada', 'rechazada');
create type public.estado_invitacion_colaborador as enum (
  'pendiente', 'aceptada', 'expirada', 'cancelada'
);

-- ---------- 2) Usuarios (cuenta de acceso, ligada a Supabase Auth) ----------
-- El administrador es una cuenta unica; se crea por semilla, no desde el registro.
-- El registro publico SIEMPRE crea rol 'cliente'. Ser colaborador solo por invitacion.
create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  rol public.rol_usuario not null default 'cliente',
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- Crea la fila en public.usuarios al registrarse en Auth.
-- No lee el rol desde los metadatos: nunca se puede auto-asignar administrador.
create or replace function public.manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.usuarios (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.manejar_nuevo_usuario();

-- ---------- 3) Clientes (perfil del rol cliente) ----------
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid unique not null references public.usuarios(id) on delete cascade,
  tipo public.tipo_cliente not null default 'persona',
  nombre text not null,
  documento text,
  direccion text,
  telefono text,
  email_contacto text,
  datos_facturacion text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- ---------- 4) Colaboradores (datos comunes + perfil) ----------
-- vinculacion: si sigue en el equipo (desvinculado = sin permisos, conserva historial).
-- disponibilidad: primer filtro para asignar a nuevas sesiones (los choques se revisan por sesion).
-- visible_publico: si su perfil puede mostrarse en el catalogo publico.
create table public.colaboradores (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid unique references public.usuarios(id) on delete set null,
  perfil public.perfil_colaborador not null,
  vinculacion public.estado_vinculacion not null default 'activo',
  disponibilidad public.disponibilidad not null default 'disponible',
  visible_publico boolean not null default false,
  nombre_artistico text,
  nombre_real text,
  fecha_nacimiento date,
  biografia text,
  trayectoria text,
  productoras text,
  foto text,
  desvinculado_en timestamptz,
  creado_en timestamptz not null default now()
);

-- ---------- 4.1) Campos propios por perfil ----------
create table public.colaborador_artistas (
  colaborador_id uuid primary key references public.colaboradores(id) on delete cascade,
  genero_musical text,
  disquera text,
  instrumentos text,
  redes text
);

create table public.colaborador_productores (
  colaborador_id uuid primary key references public.colaboradores(id) on delete cascade,
  generos_produce text,
  daw_principal text,
  creditos text
);

create table public.colaborador_ingenieros_sonido (
  colaborador_id uuid primary key references public.colaboradores(id) on delete cascade,
  areas_grabacion text,
  certificaciones text,
  equipos text
);

create table public.colaborador_ingenieros_mezcla (
  colaborador_id uuid primary key references public.colaboradores(id) on delete cascade,
  daw_principal text,
  plugins text,
  creditos text
);

create table public.colaborador_ingenieros_master (
  colaborador_id uuid primary key references public.colaboradores(id) on delete cascade,
  estudio text,
  equipos text,
  creditos text
);

create table public.colaborador_otros (
  colaborador_id uuid primary key references public.colaboradores(id) on delete cascade,
  area text,
  descripcion text
);

-- ---------- 4.2) Portafolio del colaborador (CV: proyectos que ha hecho) ----------
-- Distinto de public.proyectos (los que contrata el cliente). El cliente SI ve este portafolio.
-- estado: proyectos finalizados o en curso (activos).
create table public.colaborador_proyectos (
  id bigint generated always as identity primary key,
  colaborador_id uuid not null references public.colaboradores(id) on delete cascade,
  titulo text not null,
  descripcion text,
  productora text,
  rol text,
  anio integer,
  estado public.estado_portafolio not null default 'finalizado',
  creado_en timestamptz not null default now()
);

-- ---------- 4.3) Bitacora interna de la productora (NO visible al cliente) ----------
-- Tiempo en la empresa, desempeno, sesiones, notas internas, etc.
-- El colaborador solo ve las entradas marcadas visible_colaborador.
create table public.colaborador_notas (
  id bigint generated always as identity primary key,
  colaborador_id uuid not null references public.colaboradores(id) on delete cascade,
  autor_id uuid references public.usuarios(id) on delete set null,
  tipo text,
  contenido text not null,
  visible_colaborador boolean not null default false,
  creado_en timestamptz not null default now()
);

-- ---------- 5) Invitaciones de colaborador (unica via de incorporacion) ----------
-- El admin invita por correo y define el perfil. Enlace seguro, caducidad y uso unico.
-- Se guarda el HASH del token, no el token en claro.
create table public.invitaciones (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  perfil public.perfil_colaborador not null,
  estado public.estado_invitacion_colaborador not null default 'pendiente',
  token_hash text not null unique,
  expira_en timestamptz not null default (now() + interval '7 days'),
  usada_en timestamptz,
  creada_por uuid references public.usuarios(id),
  creado_en timestamptz not null default now()
);

create index invitaciones_email_idx on public.invitaciones (lower(email));

-- ---------- 6) Salas ----------
create table public.salas (
  id bigint generated always as identity primary key,
  nombre text not null,
  precio_hora numeric(10, 2) not null default 0,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- ---------- 7) Proyectos y canciones ----------
create table public.proyectos (
  id bigint generated always as identity primary key,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  nombre text not null,
  estado text not null default 'activo',
  creado_en timestamptz not null default now()
);

create table public.canciones (
  id bigint generated always as identity primary key,
  proyecto_id bigint not null references public.proyectos(id) on delete cascade,
  titulo text not null,
  duracion_seg integer,
  creado_en timestamptz not null default now()
);

-- ---------- 8) Solicitudes e invitaciones a sesion ----------
create table public.solicitudes (
  id bigint generated always as identity primary key,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  sala_id bigint references public.salas(id),
  estado public.estado_solicitud not null default 'solicitada',
  descripcion text,
  fecha_deseada date,
  creado_en timestamptz not null default now()
);

create table public.solicitud_colaboradores (
  solicitud_id bigint not null references public.solicitudes(id) on delete cascade,
  colaborador_id uuid not null references public.colaboradores(id),
  rol text,
  estado public.estado_invitacion not null default 'pendiente',
  primary key (solicitud_id, colaborador_id)
);

-- ---------- 9) Sesiones ----------
create table public.sesiones (
  id bigint generated always as identity primary key,
  solicitud_id bigint references public.solicitudes(id) on delete set null,
  cliente_id uuid references public.clientes(id),
  colaborador_id uuid references public.colaboradores(id),
  sala_id bigint references public.salas(id),
  cancion_id bigint references public.canciones(id),
  fecha timestamptz,
  estado text not null default 'programada',
  partes text,
  creado_en timestamptz not null default now()
);

-- ---------- 10) Ordenes de servicio (facturacion) ----------
create table public.ordenes (
  id bigint generated always as identity primary key,
  sesion_id bigint references public.sesiones(id) on delete set null,
  total numeric(12, 2) not null default 0,
  estado text not null default 'pendiente',
  creado_en timestamptz not null default now()
);

-- ---------- 11) Seguridad (RLS): activada; politicas en 02_rls.sql ----------
alter table public.usuarios enable row level security;
alter table public.clientes enable row level security;
alter table public.colaboradores enable row level security;
alter table public.colaborador_artistas enable row level security;
alter table public.colaborador_productores enable row level security;
alter table public.colaborador_ingenieros_sonido enable row level security;
alter table public.colaborador_ingenieros_mezcla enable row level security;
alter table public.colaborador_ingenieros_master enable row level security;
alter table public.colaborador_otros enable row level security;
alter table public.colaborador_proyectos enable row level security;
alter table public.colaborador_notas enable row level security;
alter table public.invitaciones enable row level security;
alter table public.salas enable row level security;
alter table public.proyectos enable row level security;
alter table public.canciones enable row level security;
alter table public.solicitudes enable row level security;
alter table public.solicitud_colaboradores enable row level security;
alter table public.sesiones enable row level security;
alter table public.ordenes enable row level security;
