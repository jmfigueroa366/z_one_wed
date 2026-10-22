-- ============================================================
-- Z-ONE · 06 · Vista pública de colaboradores (ampliada)
-- Requiere: 01, 02, 03, 04 ejecutados.
-- Ya fue ejecutado en el entorno; este archivo queda como respaldo.
-- ============================================================

-- La tabla colaboradores está protegida por RLS: solo el administrador la ve
-- entera (un cliente o un invitado reciben 0 filas). La vista pública es la
-- única forma de que puedan ver artistas para invitarlos o consultarlos.
-- No expone fecha_nacimiento ni usuario_id: ese es justamente su propósito.

drop view if exists public.colaboradores_publicos;

create view public.colaboradores_publicos as
select
  c.id,
  c.perfil,
  c.nombre_artistico,
  c.nombre_real,
  c.vinculacion,
  c.disponibilidad,
  c.biografia,
  c.trayectoria,
  c.productoras,
  c.foto
from public.colaboradores c
where c.vinculacion = 'activo' and c.visible_publico = true;

grant select on public.colaboradores_publicos to anon, authenticated;
