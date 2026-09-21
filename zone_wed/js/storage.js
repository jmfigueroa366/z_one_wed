//Habla directamente con el localStorage

const PREFIJO = 'z_one.';

export const Storage = {
    //Devuelve la lista completa de la coleccion (o [] si no existe)
    obtenerTodos(coleccion) {
        try {
            const crudo = localStorage.getItem(PREFIJO + coleccion);
            const datos = crudo ? JSON.parse(crudo) : [];
            return Array.isArray(datos) ? datos : [];
        } catch (error) {
            console.error(`[storage] No se pudo leer" ${coleccion}":`, error);
            return [];
        }
    }, 

    //Filtra los elementos con una condicion
    buscar(coleccion, condicion) {
        const lista = this.obtenerTodos(coleccion);
        if (typeof condicion !== 'function')
            return lista;
        return lista.filter(condicion);
    },

    //Buscar un elemento por su id (undefined -> No existe)
    obtenerPorId(coleccion, id) {
        return this.obtenerTodos(coleccion).find((item) => item.id === id);
    },

    //Guarda la lista completa
    _guardarLista(coleccion, lista) {
        try {
            localStorage.setItem(PREFIJO + coleccion, JSON.stringify(lista));
            return true;
        } catch (error) {
            console.error(`[storage] No se pudo leer)" ${coleccion}":`, error);
            return false;
        }
    },

    //Crea un registro nuevo:asigna id numerico automatico y agrega a la lista. Devuelve el objeto creado
    crear(coleccion, datos) {
        const lista = this.obtenerTodos(coleccion);
        const nuevo = {
            id: this._siguienteId(coleccion),
            ...datos,
        };
        lista.unshift(nuevo);
        this._guardarLista(coleccion, lista);
        return nuevo;
    },

    //Actualiza un registro existente
    actualizar(coleccion, id, cambios) {
        const lista = this.obtenerTodos(coleccion);
        const indice = lista.findIndex((item) => item.id === id);
        if(indice === -1) 
            return null;
        lista[indice] = { ...lista[indice], ...cambios};
        this._guardarLista(coleccion, lista);
        return lista[indice];
    },

    //Elimina un registro
    eliminar (coleccion, id) {
        const lista = this.obtenerTodos(coleccion).filter((item) => item.id !== id);
        return this._guardarLista(coleccion, lista);
    }, 

    //Contador de ids. Nota: Siempre se genera un id unico
    //El contador tiene su propia clave: '<coleccion>.__nextId'
    _contadorKey(coleccion) {
        return PREFIJO + coleccion + '.__nextId';
    },

    _leerContador(coleccion) {
        try {
            return parseInt(localStorage.getItem(this._contadorKey(coleccion)) || '0', 10) || 0;
        } catch (error) {
            return 0;
        }
    },

    _fijarContador(coleccion, valor) {
        try {
            localStorage.setItem(this._contadorKey(coleccion), String(valor));
        } catch (error) {
            console.error(`[storage] No se puede fijar el contador de" ${coleccion}":`, error);
        }
    },

    //Calcular el siguiente id numerico para una coleccion
    _siguienteId(coleccion) {
        const siguiente = this._leerContador(coleccion) + 1;
        this._fijarContador(coleccion, siguiente);
        return siguiente;
    },

    //Datos de prueba, por si la colección esta vacia
    sembrar(coleccion, datosIniciales) {
        if (this.obtenerTodos(coleccion).length === 0) {
            const conIds = datosIniciales.map((datos, indice) => ({
                id: indice + 1,
                ...datos,
            }));
            this._guardarLista(coleccion, conIds);
            this._fijarContador(coleccion, conIds.length);
            return conIds;
        }
        return this.obtenerTodos(coleccion);
    },
};