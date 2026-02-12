const URL_API = 'https://api.jikan.moe/v4';
let animesActuales = [];
let paginaActual = 1;
let totalPaginas = 1;
let filtroActual = 'bypopularity';
let consultaActual = '';
const entradaBusqueda = document.getElementById('entradaBusqueda');
const botonBuscar = document.getElementById('botonBuscar');
const cuadriculaAnime = document.getElementById('cuadriculaAnime');
const cargador = document.getElementById('cargador');
const seccionResultados = document.getElementById('resultados');
const seccionDetalles = document.getElementById('detalles');
const contenedorDetalles = document.getElementById('contenedorDetalles');
const botonVolver = document.getElementById('botonVolver');
const botonesFiltro = document.querySelectorAll('.boton-filtro');
const paginacion = document.getElementById('paginacion');
const botonAnterior = document.getElementById('botonAnterior');
const botonSiguiente = document.getElementById('botonSiguiente');
const infoPagina = document.getElementById('infoPagina');

botonBuscar.addEventListener('click', buscarAnime);
entradaBusqueda.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') buscarAnime();
});

botonVolver.addEventListener('click', volverResultados);
botonAnterior.addEventListener('click', paginaAnterior);
botonSiguiente.addEventListener('click', paginaSiguiente);

botonesFiltro.forEach(boton => {
    boton.addEventListener('click', () => {
        botonesFiltro.forEach(b => b.classList.remove('activo'));
        boton.classList.add('activo');
        const tipo = boton.dataset.tipo;
        filtroActual = tipo;
        consultaActual = '';
        paginaActual = 1;
        obtenerTopAnime(tipo, 1);
    });
});

function alternarCargador(mostrar) {
    cargador.classList.toggle('oculto', !mostrar);
}

function actualizarPaginacion() {
    infoPagina.textContent = `${paginaActual} de ${totalPaginas}`;
    botonAnterior.disabled = paginaActual === 1;
    botonSiguiente.disabled = paginaActual >= totalPaginas;
    paginacion.classList.remove('oculto');
}

function paginaAnterior(){
    if (paginaActual > 1){
        paginaActual--;
        if (consultaActual)
        {
            buscarAnimePagina(consultaActual, paginaActual);
        } else{
            obtenerTopAnime(filtroActual, paginaActual);
        }
        window.scrollTo(0, 0);
    }
}

function paginaSiguiente(){
    if (paginaActual < totalPaginas){
        paginaActual++;
        if (consultaActual) {
            buscarAnimePagina(consultaActual, paginaActual);
        } else {
            obtenerTopAnime(filtroActual, paginaActual);
        }
        window.scrollTo(0, 0);
    }
}

async function buscarAnime(){
    const consulta = entradaBusqueda.value.trim();
    consultaActual = consulta;
    paginaActual = 1;
    buscarAnimePagina(consulta, 1);
}

async function buscarAnimePagina(consulta, pagina){
    alternarCargador(true);
    cuadriculaAnime.innerHTML = '';
    
    try {
        const respuesta = await fetch(`${URL_API}/anime?q=${encodeURIComponent(consulta)}&page=${pagina}&limit=25`);
        
        if (!respuesta.ok) {
            throw new Error('Error');
        }
        
        const datos = await respuesta.json();
        animesActuales = datos.data;
        totalPaginas = datos.pagination.last_visible_page;
        
        mostrarAnimes(animesActuales);
        actualizarPaginacion();
    } catch (error){
        console.error('Error:', error);
        cuadriculaAnime.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--texto-secundario); padding: 3rem;">Error al buscar. Intenta de nuevo</p>';
    } finally{
        alternarCargador(false);
    }
}

async function obtenerTopAnime(tipo, pagina) {
    alternarCargador(true);
    cuadriculaAnime.innerHTML = '';
    try{
        const respuesta = await fetch(`${URL_API}/top/anime?filter=${tipo}&page=${pagina}&limit=25`);
        
        if(!respuesta.ok) {
            throw new Error('Error al obtener top anime');
        }
        const datos = await respuesta.json();
        animesActuales = datos.data;
        totalPaginas = datos.pagination.last_visible_page;
        mostrarAnimes(animesActuales);
        actualizarPaginacion();
    } catch(error){
        console.error('Error:', error);
        cuadriculaAnime.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--texto-secundario); padding: 3rem;">Error al cargar. Intenta de nuevo</p>';
    } finally{
        alternarCargador(false);
    }
}

function mostrarAnimes(animes){
    if (!animes || animes.length === 0){
        cuadriculaAnime.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--texto-secundario); padding: 3rem;">No se han encontrado resultados</p>';
        paginacion.classList.add('oculto');
        return;
    }
    
    cuadriculaAnime.innerHTML = animes.map(anime => `
        <div class="tarjeta-anime" onclick="mostrarDetallesAnime(${anime.mal_id})">
            <img 
                src="${anime.images.jpg.large_image_url || anime.images.jpg.image_url}" 
                alt="${anime.title}"
                class="imagen-anime"
                loading="lazy"
            >
            <div class="info-anime">
                <h3 class="titulo-anime">${anime.title}</h3>
                <div class="meta-anime">
                    <span class="puntuacion-anime">
                        <i class="bi bi-star-fill"></i>
                        ${anime.score || 'N/A'}
                    </span>
                    <span class="tipo-anime">${anime.type || 'N/A'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

async function mostrarDetallesAnime(idAnime){
    alternarCargador(true);
    seccionResultados.classList.add('oculto');
    seccionDetalles.classList.remove('oculto');
    contenedorDetalles.innerHTML = '<p style="text-align: center; padding: 3rem; color: var(--texto-secundario);">Cargando...</p>';
    
    try {
        const respuesta = await fetch(`${URL_API}/anime/${idAnime}/full`);
        
        if (!respuesta.ok) {
            throw new Error('Error al obtener detalles');
        }
        
        const datos = await respuesta.json();
        const anime = datos.data;
        
        mostrarDetalles(anime);
    } catch (error) {
        console.error('Error:', error);
        contenedorDetalles.innerHTML = '<p style="text-align: center; color: #ef4444; padding: 3rem;">Error al cargar</p>';
    } finally {
        alternarCargador(false);
    }
}

function mostrarDetalles(anime){
    const generos=anime.genres.map(g => `<span class="etiqueta-genero">${g.name}</span>`).join('');
    const estado = anime.status || 'Desconocido';
    const episodios = anime.episodes || 'N/A';
    const duracion = anime.duration || 'N/A';
    const emision = anime.aired?.string || 'N/A';
    const clasificacion = anime.rating || 'N/A';
    const estudios = anime.studios?.map(s => s.name).join(', ') || 'N/A';
    contenedorDetalles.innerHTML=`
        <div class="encabezado-detalles">
            <img 
                src="${anime.images.jpg.large_image_url}" 
                alt="${anime.title}"
                class="imagen-detalles"
            >
            <div class="info-detalles">
                <h2 class="titulo-detalles">${anime.title}</h2>
                ${anime.title_english ? `<p class="subtitulo-detalles">${anime.title_english}</p>` : ''}
                
                <div class="meta-detalles">
                    <div class="item-meta">
                        <div class="etiqueta-meta">Puntuacion</div>
                        <div class="valor-meta">
                            <i class="bi bi-star-fill"></i>
                            ${anime.score || 'N/A'}
                        </div>
                    </div>
                    <div class="item-meta">
                        <div class="etiqueta-meta">Tipo</div>
                        <div class="valor-meta">${anime.type}</div>
                    </div>
                    <div class="item-meta">
                        <div class="etiqueta-meta">Episodios</div>
                        <div class="valor-meta">${episodios}</div>
                    </div>
                    <div class="item-meta">
                        <div class="etiqueta-meta">Estado</div>
                        <div class="valor-meta">${estado}</div>
                    </div>
                    <div class="item-meta">
                        <div class="etiqueta-meta">Duracion</div>
                        <div class="valor-meta">${duracion}</div>
                    </div>
                    <div class="item-meta">
                        <div class="etiqueta-meta">Ranking</div>
                        <div class="valor-meta">
                            <i class="bi bi-trophy-fill"></i>
                            #${anime.rank || 'N/A'}
                        </div>
                    </div>
                </div>
                
                <div class="generos">
                    ${generos}
                </div>
            </div>
        </div>
        
        <div class="seccion-sinopsis">
            <h3 class="titulo-sinopsis">
                <i class="bi bi-book"></i>
                Sinopsis
            </h3>
            <p class="texto-sinopsis">${anime.synopsis || 'Sin sinopsis'}</p>
        </div>
        
        <div class="seccion-extra">
            <div class="meta-detalles">
                <div class="item-meta">
                    <div class="etiqueta-meta">Emision</div>
                    <div class="valor-meta" style="font-size: 0.85rem;">${emision}</div>
                </div>
                <div class="item-meta">
                    <div class="etiqueta-meta">Estudios</div>
                    <div class="valor-meta" style="font-size: 0.85rem;">${estudios}</div>
                </div>
                <div class="item-meta">
                    <div class="etiqueta-meta">Clasificacion</div>
                    <div class="valor-meta" style="font-size: 0.85rem;">${clasificacion}</div>
                </div>
            </div>
        </div>
        
        ${anime.trailer?.url ? `
            <div class="seccion-sinopsis">
                <h3 class="titulo-sinopsis">
                    <i class="bi bi-play-circle"></i>
                    Trailer
                </h3>
                <a href="${anime.trailer.url}" target="_blank">
                    Ver trailer en YouTube
                    <i class="bi bi-box-arrow-up-right"></i>
                </a>
            </div>
        ` : ''}
    `;
}

function volverResultados() {
    seccionDetalles.classList.add('oculto');
    seccionResultados.classList.remove('oculto');
}
window.addEventListener('load', () => {
    obtenerTopAnime('bypopularity', 1);
});