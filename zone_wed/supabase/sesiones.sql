-- Sesiones: columnas que le faltan + permisos RLS
-- Requiere: tablas, rls, funciones y seed ejecutados.

-- Columnas que la app necesita y la tabla no tiene.
--    hora_inicio/hora_fin son texto a propósito: la app guarda '08:00' y
--    con tipo time Supabase devolvería '08:00:00' y rompería la comparación.
alter table public.sesiones
  add column if not exists titulo text not null default '',
  add column if not exists hora_inicio text,
  add column if not exists hora_fin text;

-- fecha: la app compara igualdad de texto ('2026-11-21') para detectar
--    choques de sala; con timestamptz eso fallaría. La tabla está vacía.
alter table public.sesiones
  alter column fecha type date using (fecha::date);

-- partes: la app guarda un arreglo ('voz','bateria').
alter table public.sesiones
  alter column partes type jsonb
  using (case when partes is null or partes = '' then null else partes::jsonb end);

-- RLS: hoy solo el admin puede escribir sesiones. Pero la app crea una
--    sesión cuando el último colaborador acepta la invitación, y también
--    cuando un cliente pide una cabina. Se permite a los participantes.
grant select, insert, update, delete on public.sesiones to authenticated;

drop policy if exists sesiones_participante_insert on public.sesiones;
create policy sesiones_participante_insert on public.sesiones
  for insert with check (
    public.es_admin()
    or cliente_id = public.mi_cliente_id()
    or (colaborador_id = public.mi_colaborador_id()
        and public.es_mi_solicitud(solicitud_id))
  );

drop policy if exists sesiones_participante_update on public.sesiones;
create policy sesiones_participante_update on public.sesiones
  for update using (
    public.es_admin()
    or cliente_id = public.mi_cliente_id()
    or colaborador_id = public.mi_colaborador_id()
  )
  with check (
    public.es_admin()
    or cliente_id = public.mi_cliente_id()
    or colaborador_id = public.mi_colaborador_id()
  );