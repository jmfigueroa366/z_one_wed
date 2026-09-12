

function guardarDato(clave, datos) {
    localStorage.setItem(clave, JSON.stringify(datos));
}

function obtenerDato(clave) {
    const crudo = localStorage.getItem(clave);
    return crudo ? JSON.parse(crudo) : [];
}

/*Confirmación reutilizable para Guardar/Eliminar*/
function confirmarAccion(mensaje) {
    return window.confirm(mensaje);
}


/*CATALOGO MUSICAL (catalogo.html)*/

const CATALOGO_KEY = 'zone_catalogo';

const catalogoSeed = [
    {id: 'c1', titulo: 'Canción 1', artista: 'Artista 1', album: 'Álbum 1', duracion: '3:45', estado: 'publicado' },
    {id: 'c2', titulo: 'Canción 2', artista: 'Artista 2', album: 'Álbum 2', duracion: '4:20', estado: 'proceso' },
    {id: 'c3', titulo: 'Canción 3', artista: 'Artista 3', album: 'Álbum 3', duracion: '5:10', estado: 'publicado'},
    {id: 'c4', titulo: 'Canción 4', artista: 'Artista 4', album: 'Álbum 4', duracion: '3:30', estado: 'borrador' },
     ];
    
function inicializarCatalogo() {
    const tabla = document.getElementById('catalogoBody');
    if (!tabla) return; 

    if (obtenerDatos(CATALOGO_KEY).length === 0) {
        guardarDato(CATALOGO_KEY, catalogoSeed);
    }

    const form = document.getElementById('catalogoForm');
    const buscador = document.getElementById('catalogoBuscar');
    const chips = document.querySelectorAll('.filter-chip');
    let filtroTipo = 'todos';
    let filtroTexto = '';

    function pintarTabla() {
        const items = obtenerDatos(CATALOGO_KEY)
            .filter((it) => filtroTipo === 'todos' || it.tipo === filtroTipo)
            .filter((it) => {
                const q = filtroTexto.trim().toLowerCase();
                if (!q) return true;
                return (it.titulo + ' ' + it.artista + ' ' + it.album).toLowerCase().includes(q);
            });

        tabla.innerHTML = ' ';

        if (items.length === 0) {
            tabla.innerHTML = '<tr class="empty-row"><td colspan="5">No hay resultados</td></tr>';
            return;
        }

        items.forEach((it) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <span class="track-title">${it.titulo}</span>
                    <span class="track-sub">${it.artista}</span>
                </td>
                <td>${it.album}</td>
                <td><span class="type-badge ${it.tipo}">${etiquetaTipo(it.tipo)}</span></td>
                <td>${it.duracion}</td>
                <td>
                    <span class="status-pill ${it.estado}">${etiquetaEstado(it.estado)}</span>
                </td>
                <td><button type="button" class="row-remove" data-id="${it.id}">Eliminar</button></td>
            `;
            tabla.appendChild(tr);
        });

        tabla.querySelectorAll('.row-remove').forEach((btn) => {
            btn.addEventListener('click', function () {
                if (!confirmarAccion('¿Deseas eliminar este elemento del catálogo?')) return;
                const restantes = obtenerDatos(CATALOGO_KEY).filter((it) => it.id !== btn.dataset.id);
                guardarDato(CATALOGO_KEY, restantes);
                pintarTabla();
            });
        });
    }
    
    function etiquetaTipo(tipo) {
        return {cancion: 'Canción', version: 'Versión', album: 'Álbum'} [ tipo ] || tipo;
    }

    function etiquetaEstado(estado) {
        return {publicado: 'Publicado', proceso: 'En proceso', borrador: 'Borrador'} [ estado ] || estado;
    }

    if (chips.length) {
        chips.forEach((chip) => {
            chip.addEventListener('click', function () {
                chips.forEach((c) => c.classList.remove('active'));
                chip.classList.add('active');
                filtroTipo = chip.dataset.tipo;
                pintarTabla();
            });
        });
    }

    if(buscador) {
        buscador.addEventListener('input', function () {
            filtroTexto = buscador.value;
            pintarTabla();
        });
    }

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!confirmarAccion('¿Deseas guardar esta canción en el catálogo?')) return;

            const nuevo = {
                id: 'c' + Date.now(),
                titulo: document.getElementById('catTitulo').value.trim(),
                artista: document.getElementById('catArtista').value.trim(),
                album: document.getElementById('catAlbum').value.trim() || '-',
                tipo: document.getElementById('catTipo').value,
                duracion: document.getElementById('catDuracion').value.trim() || '-',
                estado: document.getElementById('catEstado').value,
            };

            const items = obtenerDatos(CATALOGO_KEY);
            items.unshift(nuevo);
            guardarDato(CATALOGO_KEY, items);
            form.reset();
            pintarTabla();
        });
    }

    pintarTabla();
}
