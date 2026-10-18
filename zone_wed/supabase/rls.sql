-- ============================================================
-- Z-ONE · 02 · Políticas RLS (BORRADOR)
-- Ejecutar DESPUÉS de 01_schema.sql
-- Reglas:
--   - Solo el administrador invita y cambia vinculación/disponibilidad/perfil.
--   - El colaborador SOLO consulta y edita sus datos de perfil (no sus estados).
--   - El cliente solo ve perfiles publicables (activos + visibles).
-- ============================================================

-- ---------- Funciones auxiliares (SECURITY DEFINER: evitan recursión de RLS) ----------
create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.usuarios u
    where u.id = auth.uid() and u.rol = 'administrador' and u.activo
  );
$$;

create or replace function public.mi_colaborador_id() returns uuid
language sql stable security definer set search_path = public as $$
  select c.id from public.colaboradores c where c.usuario_id = auth.uid();
$$;

create or replace function public.mi_cliente_id() returns uuid
language sql stable security definer set search_path = public as $$
  select c.id from public.clientes c where c.usuario_id = auth.uid();
$$;

create or replace function public.colaborador_publicable(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.colaboradores c
    where c.id = p_id and c.vinculacion = 'activo' and c.visible_publico
  );
$$;

create or replace function public.es_mi_solicitud(p_solicitud_id bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.solicitud_colaboradores sc
    where sc.solicitud_id = p_solicitud_id and sc.colaborador_id = public.mi_colaborador_id()
  );
$$;

create or replace function public.es_solicitud_de_mi_cliente(p_solicitud_id bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.solicitudes s
    where s.id = p_solicitud_id and s.cliente_id = public.mi_cliente_id()
  );
$$;

create or replace function public.es_mi_proyecto(p_proyecto_id bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.proyectos p
    where p.id = p_proyecto_id and p.cliente_id = public.mi_cliente_id()
  );
$$;

create or replace function public.es_mi_sesion(p_sesion_id bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.sesiones s
    where s.id = p_sesion_id and s.cliente_id = public.mi_cliente_id()
  );
$$;

-- ---------- usuarios ----------
drop policy if exists usuarios_admin on public.usuarios;
create policy usuarios_admin on public.usuarios
  for all using (public.es_admin()) with check (public.es_admin());

drop policy if exists usuarios_select_propio on public.usuarios;
create policy usuarios_select_propio on public.usuarios
  for select using (id = auth.uid());
-- Sin política de insert: lo hace el trigger. Sin política de update propio:
-- un usuario NO puede cambiar su rol (evita auto-ascenso a administrador).

-- ---------- clientes ----------
drop policy if exists clientes_admin on public.clientes;
create policy clientes_admin on public.clientes
  for all using (public.es_admin()) with check (public.es_admin());

drop policy if exists clientes_select_propio on public.clientes;
create policy clientes_select_propio on public.clientes
  for select using (usuario_id = auth.uid());

drop policy if exists clientes_update_propio on public.clientes;
create policy clientes_update_propio on public.clientes
  for update using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- ---------- colaboradores ----------
drop policy if exists colaboradores_admin on public.colaboradores;
create policy colaboradores_admin on public.colaboradores
  for all using (public.es_admin()) with check (public.es_admin());

drop policy if exists colaboradores_select_propio on public.colaboradores;
create policy colaboradores_select_propio on public.colaboradores
  for select using (usuario_id = auth.uid());

-- Sin política de lectura pública sobre la tabla base: la exposición pública
-- se hace por la vista public.colaboradores_publicos (más abajo), que oculta
-- campos privados (fecha_nacimiento, usuario_id, etc.).

drop policy if exists colaboradores_update_propio on public.colaboradores;
create policy colaboradores_update_propio on public.colaboradores
  for update using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
-- Un trigger (03_funciones.sql) impide que el colaborador cambie
-- vinculacion, disponibilidad, visible_publico, perfil o usuario_id.

-- ---------- Campos propios por perfil ----------
-- Patrón: admin todo; el mismo colaborador; lectura publica si es publicable.
drop policy if exists artistas_admin on public.colaborador_artistas;
create policy artistas_admin on public.colaborador_artistas
  for all using (public.es_admin()) with check (public.es_admin());
drop policy if exists artistas_propio on public.colaborador_artistas;
create policy artistas_propio on public.colaborador_artistas
  for all using (colaborador_id = public.mi_colaborador_id())
  with check (colaborador_id = public.mi_colaborador_id());
drop policy if exists artistas_publico on public.colaborador_artistas;
create policy artistas_publico on public.colaborador_artistas
  for select using (public.colaborador_publicable(colaborador_id));

drop policy if exists productores_admin on public.colaborador_productores;
create policy productores_admin on public.colaborador_productores
  for all using (public.es_admin()) with check (public.es_admin());
drop policy if exists productores_propio on public.colaborador_productores;
create policy productores_propio on public.colaborador_productores
  for all using (colaborador_id = public.mi_colaborador_id())
  with check (colaborador_id = public.mi_colaborador_id());
drop policy if exists productores_publico on public.colaborador_productores;
create policy productores_publico on public.colaborador_productores
  for select using (public.colaborador_publicable(colaborador_id));

drop policy if exists ing_sonido_admin on public.colaborador_ingenieros_sonido;
create policy ing_sonido_admin on public.colaborador_ingenieros_sonido
  for all using (public.es_admin()) with check (public.es_admin());
drop policy if exists ing_sonido_propio on public.colaborador_ingenieros_sonido;
create policy ing_sonido_propio on public.colaborador_ingenieros_sonido
  for all using (colaborador_id = public.mi_colaborador_id())
  with check (colaborador_id = public.mi_colaborador_id());
drop policy if exists ing_sonido_publico on public.colaborador_ingenieros_sonido;
create policy ing_sonido_publico on public.colaborador_ingenieros_sonido
  for select using (public.colaborador_publicable(colaborador_id));

drop policy if exists ing_mezcla_admin on public.colaborador_ingenieros_mezcla;
create policy ing_mezcla_admin on public.colaborador_ingenieros_mezcla
  for all using (public.es_admin()) with check (public.es_admin());
drop policy if exists ing_mezcla_propio on public.colaborador_ingenieros_mezcla;
create policy ing_mezcla_propio on public.colaborador_ingenieros_mezcla
  for all using (colaborador_id = public.mi_colaborador_id())
  with check (colaborador_id = public.mi_colaborador_id());
drop policy if exists ing_mezcla_publico on public.colaborador_ingenieros_mezcla;
create policy ing_mezcla_publico on public.colaborador_ingenieros_mezcla
  for select using (public.colaborador_publicable(colaborador_id));

drop policy if exists ing_master_admin on public.colaborador_ingenieros_master;
create policy ing_master_admin on public.colaborador_ingenieros_master
  for all using (public.es_admin()) with check (public.es_admin());
drop policy if exists ing_master_propio on public.colaborador_ingenieros_master;
create policy ing_master_propio on public.colaborador_ingenieros_master
  for all using (colaborador_id = public.mi_colaborador_id())
  with check (colaborador_id = public.mi_colaborador_id());
drop policy if exists ing_master_publico on public.colaborador_ingenieros_master;
create policy ing_master_publico on public.colaborador_ingenieros_master
  for select using (public.colaborador_publicable(colaborador_id));

drop policy if exists otros_admin on public.colaborador_otros;
create policy otros_admin on public.colaborador_otros
  for all using (public.es_admin()) with check (public.es_admin());
drop policy if exists otros_propio on public.colaborador_otros;
create policy otros_propio on public.colaborador_otros
  for all using (colaborador_id = public.mi_colaborador_id())
  with check (colaborador_id = public.mi_colaborador_id());
drop policy if exists otros_publico on public.colaborador_otros;
create policy otros_publico on public.colaborador_otros
  for select using (public.colaborador_publicable(colaborador_id));

-- ---------- Portafolio del colaborador (visible al cliente si es publicable) ----------
drop policy if exists cproyectos_admin on public.colaborador_proyectos;
create policy cproyectos_admin on public.colaborador_proyectos
  for all using (public.es_admin()) with check (public.es_admin());
drop policy if exists cproyectos_propio on public.colaborador_proyectos;
create policy cproyectos_propio on public.colaborador_proyectos
  for all using (colaborador_id = public.mi_colaborador_id())
  with check (colaborador_id = public.mi_colaborador_id());
drop policy if exists cproyectos_publico on public.colaborador_proyectos;
create policy cproyectos_publico on public.colaborador_proyectos
  for select using (public.colaborador_publicable(colaborador_id));

-- ---------- Bitácora interna (solo admin; el colaborador ve lo autorizado) ----------
drop policy if exists cnotas_admin on public.colaborador_notas;
create policy cnotas_admin on public.colaborador_notas
  for all using (public.es_admin()) with check (public.es_admin());
drop policy if exists cnotas_propio on public.colaborador_notas;
create policy cnotas_propio on public.colaborador_notas
  for select using (
    colaborador_id = public.mi_colaborador_id() and visible_colaborador = true
  );

-- ---------- invitaciones (solo admin) ----------
drop policy if exists invitaciones_admin on public.invitaciones;
create policy invitaciones_admin on public.invitaciones
  for all using (public.es_admin()) with check (public.es_admin());
-- No hay select/insert para colaboradores ni clientes. Aceptar se hace por RPC.

-- ---------- salas ----------
drop policy if exists salas_admin on public.salas;
create policy salas_admin on public.salas
  for all using (public.es_admin()) with check (public.es_admin());
drop policy if exists salas_select on public.salas;
create policy salas_select on public.salas
  for select using (activo = true);

-- ---------- proyectos ----------
drop policy if exists proyectos_admin on public.proyectos;
create policy proyectos_admin on public.proyectos
  for all using (public.es_admin()) with check (public.es_admin());
drop policy if exists proyectos_cliente on public.proyectos;
create policy proyectos_cliente on public.proyectos
  for select using (cliente_id = public.mi_cliente_id());

-- ---------- canciones ----------
drop policy if exists canciones_admin on public.canciones;
create policy canciones_admin on public.canciones
  for all using (public.es_admin()) with check (public.es_admin());
drop policy if exists canciones_cliente on public.canciones;
create policy canciones_cliente on public.canciones
  for select using (public.es_mi_proyecto(proyecto_id));

-- ---------- solicitudes ----------
drop policy if exists solicitudes_admin on public.solicitudes;
create policy solicitudes_admin on public.solicitudes
  for all using (public.es_admin()) with check (public.es_admin());
drop policy if exists solicitudes_cliente on public.solicitudes;
create policy solicitudes_cliente on public.solicitudes
  for all using (cliente_id = public.mi_cliente_id())
  with check (cliente_id = public.mi_cliente_id());
drop policy if exists solicitudes_colaborador on public.solicitudes;
create policy solicitudes_colaborador on public.solicitudes
  for select using (public.es_mi_solicitud(id));

-- ---------- solicitud_colaboradores ----------
drop policy if exists solicitud_colab_admin on public.solicitud_colaboradores;
create policy solicitud_colab_admin on public.solicitud_colaboradores
  for all using (public.es_admin()) with check (public.es_admin());
drop policy if exists solicitud_colab_cliente on public.solicitud_colaboradores;
create policy solicitud_colab_cliente on public.solicitud_colaboradores
  for all using (public.es_solicitud_de_mi_cliente(solicitud_id))
  with check (public.es_solicitud_de_mi_cliente(solicitud_id));
drop policy if exists solicitud_colab_propio on public.solicitud_colaboradores;
create policy solicitud_colab_propio on public.solicitud_colaboradores
  for all using (colaborador_id = public.mi_colaborador_id())
  with check (colaborador_id = public.mi_colaborador_id());

-- ---------- sesiones ----------
drop policy if exists sesiones_admin on public.sesiones;
create policy sesiones_admin on public.sesiones
  for all using (public.es_admin()) with check (public.es_admin());
drop policy if exists sesiones_cliente on public.sesiones;
create policy sesiones_cliente on public.sesiones
  for select using (cliente_id = public.mi_cliente_id());
drop policy if exists sesiones_colaborador on public.sesiones;
create policy sesiones_colaborador on public.sesiones
  for select using (colaborador_id = public.mi_colaborador_id());

-- ---------- ordenes ----------
drop policy if exists ordenes_admin on public.ordenes;
create policy ordenes_admin on public.ordenes
  for all using (public.es_admin()) with check (public.es_admin());
drop policy if exists ordenes_cliente on public.ordenes;
create policy ordenes_cliente on public.ordenes
  for select using (public.es_mi_sesion(sesion_id));

-- ---------- Vista pública de colaboradores ----------
-- Expone SOLO campos de interés para un posible cliente (bibliografía superficial,
-- trayectoria, productoras, foto). Oculta fecha de nacimiento, usuario_id, etc.
-- La vista es propiedad del owner (bypassa RLS): filtra por activo + visible_publico.
drop view if exists public.colaboradores_publicos;
create view public.colaboradores_publicos as
select
  c.id,
  c.perfil,
  c.nombre_artistico,
  c.biografia,
  c.trayectoria,
  c.productoras,
  c.foto
from public.colaboradores c
where c.vinculacion = 'activo' and c.visible_publico = true;

grant select on public.colaboradores_publicos to anon, authenticated;
