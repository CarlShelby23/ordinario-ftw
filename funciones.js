/**
 * Funciones principales para el sitio ZooAventura
 * Versión corregida con mejoras de accesibilidad
 */

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM cargado - ZooAnimales');

    // Cargar animales si estamos en esa página
    if (document.getElementById('resultados-animales')) {
        cargarAnimales();
    }

    // Configurar formulario de contacto
    const formContacto = document.getElementById('formulario-contacto');
    if (formContacto) {
        formContacto.addEventListener('submit', manejarEnvioContacto);
        configurarValidacionTiempoReal();
    }

    // Configurar filtros de animales
    const btnFiltrar = document.getElementById('btn-filtrar');
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', filtrarAnimales);
    }

    const btnLimpiar = document.getElementById('btn-limpiar');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarFiltros);
    }

    // Configurar búsqueda en tiempo real
    const busqueda = document.getElementById('busqueda');
    if (busqueda) {
        busqueda.addEventListener('input', function() {
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(filtrarAnimales, 300);
        });
    }
});

// Función para cargar datos de animales desde XML
function cargarAnimales() {
    const contenedor = document.getElementById('resultados-animales');
    const estadoCarga = document.getElementById('estado-carga');
    
    if (!contenedor) return;

    // Actualizar estado de carga
    if (estadoCarga) {
        estadoCarga.textContent = 'Cargando información de los animales...';
    }

    fetch('datos.xml')
        .then(respuesta => {
            if (!respuesta.ok) throw new Error('Error al cargar datos');
            return respuesta.text();
        })
        .then(xmlString => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "text/xml");
            mostrarAnimales(xmlDoc);
            
            // Actualizar estado de carga exitoso
            if (estadoCarga) {
                estadoCarga.textContent = 'Información de animales cargada correctamente';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            contenedor.innerHTML = `
                <div class="tarjeta error" role="alert">
                    <p>No pudimos cargar la información de los animales. Por favor intenta más tarde.</p>
                    <button onclick="cargarAnimales()" type="button">Reintentar</button>
                </div>
            `;
            
            // Actualizar estado de error
            if (estadoCarga) {
                estadoCarga.textContent = 'Error al cargar la información de los animales';
            }
        });
}

// Mostrar animales en el DOM con gestión de foco mejorada
function mostrarAnimales(xmlDoc) {
    const animales = xmlDoc.querySelectorAll('animal');
    const contenedor = document.getElementById('resultados-animales');

    if (!animales.length) {
        contenedor.innerHTML = '<p class="tarjeta">No hay animales registrados.</p>';
        return;
    }

    // Configurar aria-live para contenido dinámico
    contenedor.setAttribute('aria-live', 'polite');
    contenedor.setAttribute('aria-atomic', 'false');

    let html = '<div class="grid-animales">';

    animales.forEach((animal, index) => {
        const nombre = animal.querySelector('nombre').textContent;
        const especie = animal.querySelector('especie').textContent;
        const habitat = animal.querySelector('habitat').textContent;
        const edad = animal.querySelector('edad').textContent;
        const descripcion = animal.querySelector('descripcion').textContent;

        // Mapear nombres de animales a archivos de imagen correctos
        let imagen = 'imagenes/logo.jpg'; // imagen por defecto
        
        switch(nombre.toLowerCase()) {
            case 'scar':
                imagen = 'imagenes/scar.jpg';
                break;
            case 'po':
                imagen = 'imagenes/po.jpeg';
                break;
            case 'melman':
                imagen = 'imagenes/melman.jpg';
                break;
            case 'orejas':
                imagen = 'imagenes/orejas.jpg';
                break;
            case 'burbujas':
                imagen = 'imagenes/burbujas.jpg';
                break;
            case 'pluma':
                imagen = 'imagenes/pluma.jpeg';
                break;
        }

        html += `
            <article class="animal" data-habitat="${habitat.toLowerCase()}" 
                     role="article" aria-labelledby="animal-${index}-nombre">
                <img src="${imagen}" alt="${nombre}, ${especie}. ${descripcion.substring(0, 100)}...">
                <div class="info-animal">
                    <h3 id="animal-${index}-nombre">${nombre}</h3>
                    <p><strong>Especie:</strong> ${especie}</p>
                    <p><strong>Hábitat:</strong> ${habitat}</p>
                    <p><strong>Edad:</strong> ${edad}</p>
                    <p>${descripcion}</p>
                </div>
            </article>
        `;
    });

    html += '</div>';
    contenedor.innerHTML = html;

    // GESTIÓN DE FOCO CRÍTICA - mover foco al contenedor después de cargar
    setTimeout(() => {
        contenedor.setAttribute('tabindex', '-1');
        contenedor.focus();
        
        // Anunciar cuántos animales se han cargado
        const estadoCarga = document.getElementById('estado-carga');
        if (estadoCarga) {
            estadoCarga.textContent = `Se han cargado ${animales.length} animales correctamente`;
        }
    }, 100);
}

// Filtrar animales según los criterios con gestión de foco
function filtrarAnimales() {
    const busqueda = document.getElementById('busqueda').value.toLowerCase();
    const habitat = document.getElementById('habitat').value.toLowerCase();
    const animales = document.querySelectorAll('.animal');
    const estadoCarga = document.getElementById('estado-carga');

    let animalesMostrados = 0;

    // Anunciar que se está filtrando
    if (estadoCarga) {
        estadoCarga.textContent = 'Filtrando animales...';
    }

    animales.forEach(animal => {
        const nombre = animal.querySelector('h3').textContent.toLowerCase();
        const especie = animal.querySelector('p:nth-of-type(1)').textContent.toLowerCase();
        const animalHabitat = animal.getAttribute('data-habitat');

        const coincideBusqueda = !busqueda || nombre.includes(busqueda) || especie.includes(busqueda);
        const coincideHabitat = !habitat || animalHabitat.includes(habitat);

        if (coincideBusqueda && coincideHabitat) {
            animal.style.display = 'block';
            animal.setAttribute('aria-hidden', 'false');
            animalesMostrados++;
        } else {
            animal.style.display = 'none';
            animal.setAttribute('aria-hidden', 'true');
        }
    });

    // Gestionar mensaje de resultados
    const mensaje = document.getElementById('mensaje-sin-resultados') || document.createElement('div');
    mensaje.id = 'mensaje-sin-resultados';
    mensaje.className = 'tarjeta';
    mensaje.setAttribute('role', 'status');
    mensaje.setAttribute('aria-live', 'polite');

    if (animalesMostrados === 0) {
        mensaje.textContent = 'No se encontraron animales con esos criterios de búsqueda.';
        if (!document.getElementById('mensaje-sin-resultados')) {
            document.getElementById('resultados-animales').appendChild(mensaje);
        }
        
        // Mover foco al mensaje
        setTimeout(() => {
            mensaje.setAttribute('tabindex', '-1');
            mensaje.focus();
        }, 100);
    } else {
        if (document.getElementById('mensaje-sin-resultados')) {
            document.getElementById('mensaje-sin-resultados').remove();
        }
    }

    // Anunciar resultados
    if (estadoCarga) {
        estadoCarga.textContent = `Se encontraron ${animalesMostrados} animales que coinciden con los criterios`;
    }
}

// Limpiar filtros con gestión de foco
function limpiarFiltros() {
    const formulario = document.getElementById('filtro-animales');
    const estadoCarga = document.getElementById('estado-carga');
    
    if (formulario) {
        formulario.reset();
    }

    const animales = document.querySelectorAll('.animal');
    animales.forEach(animal => {
        animal.style.display = 'block';
        animal.removeAttribute('aria-hidden');
    });

    // Eliminar mensaje de sin resultados
    const mensaje = document.getElementById('mensaje-sin-resultados');
    if (mensaje) {
        mensaje.remove();
    }

    // Anunciar limpieza
    if (estadoCarga) {
        estadoCarga.textContent = 'Filtros limpiados. Mostrando todos los animales';
    }

    // Mover foco al campo de búsqueda
    const busqueda = document.getElementById('busqueda');
    if (busqueda) {
        setTimeout(() => {
            busqueda.focus();
        }, 100);
    }
}

// Configurar validación en tiempo real para formularios
function configurarValidacionTiempoReal() {
    const campos = ['nombre', 'email', 'telefono', 'mensaje'];
    
    campos.forEach(nombreCampo => {
        const campo = document.getElementById(nombreCampo);
        const errorDiv = document.getElementById(`${nombreCampo}-error`);
        
        if (campo && errorDiv) {
            campo.addEventListener('blur', () => validarCampo(campo, errorDiv));
            campo.addEventListener('input', () => {
                if (errorDiv.textContent) {
                    validarCampo(campo, errorDiv);
                }
            });
        }
    });
}

// Validar campo individual
function validarCampo(campo, errorDiv) {
    let mensaje = '';
    const valor = campo.value.trim();
    
    // Validaciones específicas
    switch(campo.id) {
        case 'nombre':
            if (!valor) {
                mensaje = 'El nombre es obligatorio';
            } else if (valor.length < 2) {
                mensaje = 'El nombre debe tener al menos 2 caracteres';
            }
            break;
            
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!valor) {
                mensaje = 'El email es obligatorio';
            } else if (!emailRegex.test(valor)) {
                mensaje = 'Por favor ingresa un email válido';
            }
            break;
            
        case 'telefono':
            if (valor && !/^\d{10}$/.test(valor.replace(/\D/g, ''))) {
                mensaje = 'El teléfono debe tener 10 dígitos';
            }
            break;
            
        case 'mensaje':
            if (!valor) {
                mensaje = 'El mensaje es obligatorio';
            } else if (valor.length < 10) {
                mensaje = 'El mensaje debe tener al menos 10 caracteres';
            }
            break;
    }
    
    // Mostrar/ocultar error
    if (mensaje) {
        errorDiv.textContent = mensaje;
        errorDiv.style.display = 'block';
        campo.setAttribute('aria-invalid', 'true');
    } else {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
        campo.setAttribute('aria-invalid', 'false');
    }
}

// Manejar envío de formulario de contacto con validación mejorada
function manejarEnvioContacto(evento) {
    evento.preventDefault();

    const formulario = evento.target;
    const datos = new FormData(formulario);
    const nombre = datos.get('nombre');
    const email = datos.get('email');
    const mensaje = datos.get('mensaje');

    // Validación completa antes de envío
    let hayErrores = false;
    const campos = ['nombre', 'email', 'mensaje'];
    
    campos.forEach(nombreCampo => {
        const campo = document.getElementById(nombreCampo);
        const errorDiv = document.getElementById(`${nombreCampo}-error`);
        if (campo && errorDiv) {
            validarCampo(campo, errorDiv);
            if (errorDiv.textContent) {
                hayErrores = true;
            }
        }
    });

    if (hayErrores) {
        // Mover foco al primer campo con error
        const primerError = formulario.querySelector('[aria-invalid="true"]');
        if (primerError) {
            primerError.focus();
        }
        return;
    }

    // Simular envío
    console.log('Datos del formulario:', Object.fromEntries(datos.entries()));

    // Mostrar feedback accesible
    formulario.innerHTML = `
        <div class="mensaje-exito" role="alert" aria-live="assertive" tabindex="-1">
            <h3>¡Gracias, ${nombre}!</h3>
            <p>Hemos recibido tu mensaje y nos pondremos en contacto contigo a ${email} muy pronto.</p>
            <button onclick="location.reload()" type="button">Enviar otro mensaje</button>
        </div>
    `;
    
    // Mover foco al mensaje de éxito
    setTimeout(() => {
        const mensajeExito = formulario.querySelector('.mensaje-exito');
        if (mensajeExito) {
            mensajeExito.focus();
        }
    }, 100);
}

// Función global para reintentar carga con mejoras
window.reintentarCarga = function () {
    const contenedor = document.getElementById('resultados-animales');
    const estadoCarga = document.getElementById('estado-carga');
    
    contenedor.innerHTML = '<p class="cargando">Cargando información de los animales...</p>';
    
    if (estadoCarga) {
        estadoCarga.textContent = 'Reintentando cargar información...';
    }
    
    cargarAnimales();
};