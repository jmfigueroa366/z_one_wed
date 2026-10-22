-- ============================================================
-- Z-ONE · Arreglos de esquema aplicados en la rama front2
-- Requiere: tablas, rls, funciones, seed, solicitudes, vistaColaboradores,
--           sesiones y 07_sesiones ya ejecutados.
-- Este archivo documenta los cambios de BD que hicieron falta para que los
-- flujos reales (registro de cliente, invitaciones, sesiones) funcionen con RLS.
-- Ya fue ejecutado en el entorno; queda como respaldo.
-- ============================================================

-- ---------- 1) Enum estado_solicitud ----------
-- Faltaban estados que la app usa ('por_autorizar' y 'por_pagar'); sin ellos,
-- el UPDATE a esos estados fallaba con "invalid input value for enum".
alter type public.estado_solicitud add value if not exists 'por_autorizar';
alter type public.estado_solicitud add value if not exists 'por_pagar';


-- ---------- 2) Alta automática del cliente + usuario ----------
-- Un único trigger sobre auth.users: crea la fila en public.usuarios y, para
-- los clientes, también la fila en public.clientes (con el nombre enviado en
-- los metadatos del registro, o el prefijo del correo).
-- Para colaboradores el registro público NO crea colaborador: debe ser por invitación/admin.
-- Se elimina el trigger viejo sobre public.usuarios que provocaba orden
-- ambiguo de disparadores.
drop trigger if exists trg_crear_cliente_al_registrar on public.usuarios;

create or replace function public.manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol text := coalesce(nullif(trim(new.raw_user_meta_data->>'rol'), ''), 'cliente');
  v_nombre text := coalesce(nullif(trim(new.raw_user_meta_data->>'nombre'), ''), split_part(new.email, '@', 1));
begin
  insert into public.usuarios (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  if v_rol = 'cliente' then
    insert into public.clientes (usuario_id, nombre)
    values (new.id, v_nombre)
    on conflict (usuario_id) do nothing;
  elsif v_rol = 'colaborador' then
    -- No se crea colaborador desde registro público. Debe hacerse por invitación o desde panel admin.
    -- Solo se crea el usuario; el colaborador se vincula luego.
    null;
  end if;

  return new;
end;
$$;

drop function if exists public.crear_cliente_al_registrar() cascade;


-- ---------- 3) El colaborador puede actualizar las solicitudes donde participa ----------
-- Necesario para que, al aceptar/rechazar, la solicitud avance de estado.
drop policy if exists solicitudes_colaborador_update on public.solicitudes;
create policy solicitudes_colaborador_update on public.solicitudes
  for update
  using (
    public.es_admin()
    or exists (
      select 1
      from public.solicitud_colaboradores sc
      where sc.solicitud_id = solicitudes.id
        and sc.colaborador_id = public.mi_colaborador_id()
    )
  )
  with check (
    public.es_admin()
    or exists (
      select 1
      from public.solicitud_colaboradores sc
      where sc.solicitud_id = solicitudes.id
        and sc.colaborador_id = public.mi_colaborador_id()
    )
  );


-- ---------- 4) El cliente gestiona sus propios proyectos ----------
drop policy if exists proyectos_cliente_all on public.proyectos;
create policy proyectos_cliente_all on public.proyectos
  for all
  using (public.es_admin() or cliente_id = public.mi_cliente_id())
  with check (public.es_admin() or cliente_id = public.mi_cliente_id());


-- ---------- 5) El cliente gestiona las canciones de sus proyectos ----------
drop policy if exists canciones_cliente_all on public.canciones;
create policy canciones_cliente_all on public.canciones
  for all
  using (
    public.es_admin()
    or proyecto_id in (
      select p.id from public.proyectos p where p.cliente_id = public.mi_cliente_id()
    )
  )
  with check (
    public.es_admin()
    or proyecto_id in (
      select p.id from public.proyectos p where p.cliente_id = public.mi_cliente_id()
    )
  );
