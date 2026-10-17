-- ============================================================
-- Z-ONE · 04 · Datos iniciales (BORRADOR)
-- Requiere: 01, 02, 03 ejecutados Y las 3 cuentas creadas en Auth primero.
-- ============================================================

-- 1) Administrador único
update public.usuarios
   set rol = 'administrador'
 where email = 'admin@z-one.com';

-- 2) Cliente de demostración
insert into public.clientes (usuario_id, tipo, nombre, documento, direccion, telefono, email_contacto)
select u.id, 'empresa', 'Productora Demo S.A.S.', '900.123.456-7',
       'Calle 1 # 2-3', '300 123 4567', u.email
  from public.usuarios u
 where u.email = 'cliente@z-one.com'
on conflict (usuario_id) do nothing;

-- 3) Colaborador de demostración (perfil artista)
insert into public.colaboradores
  (usuario_id, perfil, vinculacion, disponibilidad, visible_publico,
   nombre_artistico, nombre_real, fecha_nacimiento, biografia, trayectoria,
   productoras, fecha_ingreso)
select u.id, 'artista', 'activo', 'disponible', true,
       'Lua', 'Luisa Martínez', '1996-05-14',
       'Cantautora de pop alternativo con influencias latinas.',
       'Festivales en Bogotá y Medellín; gira 2024.',
       'Regalías Music, Sony', '2024-03-01'
  from public.usuarios u
 where u.email = 'lua@z-one.com'
on conflict (usuario_id) do nothing;

-- 4) Perfil propio del artista (tabla satélite)
insert into public.colaborador_artistas (colaborador_id, genero_musical, disquera, instrumentos, redes)
select c.id, 'Pop alternativo', 'Independiente', 'Guitarra, voz', '@lua'
  from public.colaboradores c
  join public.usuarios u on u.id = c.usuario_id
 where u.email = 'lua@z-one.com'
on conflict (colaborador_id) do nothing;

-- 5) Portafolio del artista
insert into public.colaborador_proyectos (colaborador_id, titulo, descripcion, productora, rol, anio, estado)
select c.id, 'Álbum Debut', 'Primer álbum de estudio', 'Regalías Music', 'Intérprete', 2024, 'finalizado'
  from public.colaboradores c
  join public.usuarios u on u.id = c.usuario_id
 where u.email = 'lua@z-one.com'
   and not exists (select 1 from public.colaborador_proyectos p
                   where p.colaborador_id = c.id and p.titulo = 'Álbum Debut');

insert into public.colaborador_proyectos (colaborador_id, titulo, descripcion, productora, rol, anio, estado)
select c.id, 'Sencillo 2026', 'Nuevo sencillo en producción', 'Independiente', 'Intérprete', 2026, 'activo'
  from public.colaboradores c
  join public.usuarios u on u.id = c.usuario_id
 where u.email = 'lua@z-one.com'
   and not exists (select 1 from public.colaborador_proyectos p
                   where p.colaborador_id = c.id and p.titulo = 'Sencillo 2026');

-- 6) Comentario interno (lo ven admin y el colaborador)
insert into public.colaborador_notas (colaborador_id, autor_id, comentario)
select c.id, a.id, 'Bienvenida al equipo. Excelente desempeño en las primeras sesiones.'
  from public.colaboradores c
  join public.usuarios u on u.id = c.usuario_id
  left join public.usuarios a on a.email = 'admin@z-one.com'
 where u.email = 'lua@z-one.com'
   and not exists (select 1 from public.colaborador_notas n
                   where n.colaborador_id = c.id
                     and n.comentario = 'Bienvenida al equipo. Excelente desempeño en las primeras sesiones.');

-- 7) Salas
insert into public.salas (nombre, precio_hora)
select v.nombre, v.precio
  from (values ('Sala A', 80000), ('Sala B', 65000), ('Sala C', 50000)) as v(nombre, precio)
 where not exists (select 1 from public.salas s where s.nombre = v.nombre);
