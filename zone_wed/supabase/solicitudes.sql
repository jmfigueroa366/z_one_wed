-- ============================================================
-- Z-ONE · 05 · Amplía la tabla solicitudes
-- Requiere: 01, 02, 03, 04 ejecutados.
-- Ya fue ejecutado en el entorno; este archivo queda como respaldo.
-- ============================================================

-- Ojo: no se agregan "fecha" ni "fecha_solicitud":
--   * fecha            -> se usa la columna fecha_deseada (tipo date: 'YYYY-MM-DD')
--   * fecha_solicitud  -> se usa la columna creado_en (timestamptz)
-- Con un timestamptz, Supabase devolvería '2026-10-20T00:00:00+00:00' y la
-- comparación de la app (solicitud.fecha === fecha) dejaría de coincidir,
-- por lo que no se detectarían choques de sala.

alter table public.solicitudes
  add column if not exists titulo text not null default '',
  add column if not exists tipo text not null default 'grabacion',
  add column if not exists franja text,
  add column if not exists partes jsonb,
  add column if not exists cancion_id bigint references public.canciones(id) on delete set null,
  add column if not exists proyecto_id bigint references public.proyectos(id) on delete set null;
