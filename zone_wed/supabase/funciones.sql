-- ============================================================
-- Z-ONE · 03 · Funciones y disparadores (BORRADOR)
-- Ejecutar DESPUÉS de 02_rls.sql
--   - Protege los estados del colaborador (solo admin los cambia).
--   - Invitación administrativa: creación, aceptación y cancelación.
--   - Aceptar NUNCA otorga el rol administrador.
-- ============================================================

-- ---------- 1) Protección de campos sensibles del colaborador ----------
-- El colaborador puede editar su perfil (nombre, biografía, etc.) pero NO
-- vinculacion, disponibilidad, visible_publico, perfil ni usuario_id.
create or replace function public.proteger_colaborador()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.es_admin() then
    if new.vinculacion is distinct from old.vinculacion
       or new.disponibilidad is distinct from old.disponibilidad
       or new.visible_publico is distinct from old.visible_publico
       or new.perfil is distinct from old.perfil
       or new.usuario_id is distinct from old.usuario_id then
      raise exception 'Solo el administrador puede cambiar la vinculacion, disponibilidad, visibilidad o perfil';
    end if;
  end if;

  if new.vinculacion = 'desvinculado' and old.vinculacion = 'activo' then
    new.desvinculado_en := now();
  elsif new.vinculacion = 'activo' then
    new.desvinculado_en := null;
  end if;

  return new;
end;
$$;

drop trigger if exists proteger_colaborador on public.colaboradores;
create trigger proteger_colaborador
before update on public.colaboradores
for each row execute function public.proteger_colaborador();

-- ---------- 2) Crear invitación (solo administrador) ----------
-- Devuelve el token en claro UNA sola vez (para armar el enlace).
-- En la base solo queda el hash del token.
create or replace function public.crear_invitacion(
  p_email text,
  p_perfil public.perfil_colaborador,
  p_dias integer default 7
)
returns text
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  v_token text;
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede invitar colaboradores';
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.invitaciones (email, perfil, token_hash, expira_en, creada_por)
  values (
    lower(p_email),
    p_perfil,
    encode(extensions.digest(v_token, 'sha256'), 'hex'),
    now() + make_interval(days => p_dias),
    auth.uid()
  );

  return v_token;
end;
$$;

-- ---------- 3) Cancelar invitación (solo administrador) ----------
create or replace function public.cancelar_invitacion(p_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede cancelar invitaciones';
  end if;

  update public.invitaciones
     set estado = 'cancelada'
   where id = p_id and estado = 'pendiente';
end;
$$;

-- ---------- 4) Aceptar invitación (usuario autenticado con ese correo) ----------
-- Valida caducidad, uso único y que el correo coincida. Crea el colaborador
-- con el perfil definido por el admin y fija el rol 'colaborador' (nunca admin).
create or replace function public.aceptar_invitacion(p_token text)
returns uuid
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  v_inv public.invitaciones;
  v_uid uuid := auth.uid();
  v_email text;
  v_colab uuid;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesion para aceptar la invitacion';
  end if;

  select * into v_inv
    from public.invitaciones
   where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
   for update;

  if not found then
    raise exception 'Invitacion invalida';
  end if;

  if v_inv.estado <> 'pendiente' then
    raise exception 'Invitacion ya utilizada o cancelada';
  end if;

  if v_inv.expira_en < now() then
    update public.invitaciones set estado = 'expirada' where id = v_inv.id;
    raise exception 'Invitacion expirada';
  end if;

  select email into v_email from auth.users where id = v_uid;
  if lower(v_email) <> lower(v_inv.email) then
    raise exception 'La invitacion corresponde a otro correo';
  end if;

  update public.invitaciones
     set estado = 'aceptada', usada_en = now()
   where id = v_inv.id;

  update public.usuarios set rol = 'colaborador' where id = v_uid;

  insert into public.colaboradores (usuario_id, perfil, vinculacion)
  values (v_uid, v_inv.perfil, 'activo')
  on conflict (usuario_id) do update set perfil = excluded.perfil
  returning id into v_colab;

  return v_colab;
end;
$$;
