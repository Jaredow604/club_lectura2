// 1. EL "MONITO GRIS" POR DEFECTO (Código SVG seguro)
const monitoGris = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';

// 2. BASE DE DATOS SIMULADA (Temporal)
let baseDeDatos = {
    "juanlector": { pass: "123", rol: "lector", nombre: "Juan Pérez", correo: "juan@mail.com", ciudad: "Guadalajara", bio: "Amante de la ciencia ficción.", foto: monitoGris },
    "anaescritora": { pass: "123", rol: "autor", nombre: "Ana Gómez", correo: "ana@mail.com", ciudad: "CDMX", bio: "Escribiendo mi tercer novela.", foto: monitoGris },
    "carlosorg": { pass: "123", rol: "organizador", nombre: "Carlos Ruiz", correo: "carlos@mail.com", ciudad: "Monterrey", bio: "Organizo 3 clubes de lectura.", foto: monitoGris },
    "cafeblanca": { pass: "123", rol: "sede", nombre: "Café La Blanca", correo: "contacto@cafelablanca.com", ciudad: "Puebla", bio: "El mejor café y libros.", foto: monitoGris }
};

let usuarioActual = null;

// ==========================================
// FUNCIONES GENERALES E INTERACTIVIDAD 
// ==========================================

function mostrarAlerta(mensaje) {
    alert(mensaje);
}

function ejecutarBusqueda() {
    let input = document.getElementById('input-busqueda').value;
    if(input.trim() === "") {
        alert("Por favor ingresa un término de búsqueda.");
    } else {
        alert("Buscando en la comunidad: '" + input + "'\n(Esta es una simulación visual)");
        document.getElementById('input-busqueda').value = "";
    }
}

// Oculta la tarjeta completa (ej. al aceptar una invitación)
function eliminarTarjeta(btn, mensaje) {
    alert(mensaje);
    let tarjeta = btn.closest('.panel-box');
    if (tarjeta) {
        tarjeta.style.display = 'none';
    }
}

// Oculta un elemento de lista (ej. al revisar notificaciones de lista)
function eliminarLista(btn, mensaje) {
    alert(mensaje);
    let fila = btn.closest('li');
    if (fila) {
        fila.style.display = 'none';
    }
}

async function enviarMensajeChat() {
    let input = document.getElementById('chat-input');
    if(input.value.trim() !== "") {
        let contenidoOriginal = input.value;
        let contactoName = document.getElementById('chat-room-title').innerText;
        
        // Mapeo temporal visual hacia la API de BDD backend
        // Como no tenemos todos los nombres parseados a username, usamos los default de la demo
        let remitenteUsername = usuarioActual || "juanlector";
        let destinatarioUsername = contactoName === "Carlos Ruiz" ? "carlosorg" : "anaescritora"; // Default si no matchea

        try {
            // Intentar guardarlo en la Base de Datos PostgreSQL a través de la API
            const response = await fetch("http://localhost:8000/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    remitente_username: remitenteUsername,
                    destinatario_username: destinatarioUsername,
                    contenido: contenidoOriginal
                })
            });

            if(!response.ok) {
                console.error("No se pudo guardar el mensaje en Postgres. Quizá el servidor API no está corriendo.");
                // Pero permitiremos que fluya visualmente para que la demo funcione.
            }
        } catch (error) {
            console.error("Error al conectar con la API:", error);
        }

        // --- CÓDIGO ORIGINAL VISUAL INTACTO ---
        let chatBody = document.getElementById('chat-room-body');
        chatBody.innerHTML += `
            <div style="align-self: flex-end; background: var(--header-bg); color: white; padding: 10px 15px; border-radius: 15px 15px 0 15px; max-width: 80%; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                <p style="margin: 0; font-size: 0.95rem;">${contenidoOriginal}</p>
            </div>
        `;
        input.value = "";
        chatBody.scrollTop = chatBody.scrollHeight; // Scroll al fondo
    }
}

// ==========================================
// NAVEGACIÓN GLOBAL (MENÚ DE ARRIBA)
// ==========================================
function navegarA(seccion) {
    document.querySelectorAll('.dashboard-view').forEach(vista => {
        vista.classList.remove('active');
    });
    
    const vistaDestino = document.getElementById('global-' + seccion);
    if(vistaDestino) {
        vistaDestino.classList.add('active');
    }
}


// ==========================================
// FUNCIONES DE VENTANAS (MODALES)
// ==========================================
function abrirModal(id) {
    document.getElementById(id).style.display = 'flex';
}

function cerrarModal(id) {
    document.getElementById(id).style.display = 'none';
    if(document.getElementById('login-error')) {
        document.getElementById('login-error').style.display = 'none';
    }
}

// ==========================================
// INICIO DE SESIÓN
// ==========================================
document.getElementById('form-login').addEventListener('submit', function(e) {
    e.preventDefault(); 
    
    const userIngresado = document.getElementById('login-user').value.toLowerCase();
    const passIngresada = document.getElementById('login-pass').value;

    if (baseDeDatos[userIngresado] && baseDeDatos[userIngresado].pass === passIngresada) {
        usuarioActual = userIngresado;
        
        cerrarModal('auth-modal');
        actualizarHeader(); 
        mostrarVista(baseDeDatos[usuarioActual].rol); // Te lleva a tu panel privado
        cargarDatosEnFormulario(); 
        renderizarClubes(); // Re-renderizar clubes por cambio de sesión
        aplicarRestriccionGlobal(); // Actualizar CTAs restringidos
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
});

// ==========================================
// REGISTRO Y ROLES DINÁMICOS
// ==========================================
function cambiarFormularioRegistro() {
    const rol = document.getElementById('reg-rol').value;
    const comunes = document.getElementById('reg-campos-comunes');
    const dinamicos = document.getElementById('reg-campos-dinamicos');
    const btnSubmit = document.getElementById('btn-submit-reg');

    if (!rol) {
        comunes.style.display = 'none';
        btnSubmit.style.display = 'none';
        dinamicos.innerHTML = '<p style="font-size: 0.85rem; color: #666; text-align:center;">Por favor, selecciona un rol para continuar.</p>';
        return;
    }

    comunes.style.display = 'block'; // Activar nombre de usuario y contraseña siempre
    btnSubmit.style.display = 'block';
    
    let htmlDinamico = '';
    
    if (rol === 'usuario' || rol === 'organizador' || rol === 'escritor') {
        htmlDinamico = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group" style="grid-column: 1 / -1; margin-bottom: 0;">
                    <label>Nombre Completo</label>
                    <input type="text" required>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label>Número de Teléfono</label>
                    <input type="tel" required>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label>Correo Electrónico</label>
                    <input type="email" required>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label>País</label>
                    <input type="text" required>
                </div>
                <div class="form-group" style="margin-bottom: 10px;">
                    <label>Ciudad</label>
                    <input type="text" required>
                </div>
            </div>
        `;
    } else if (rol === 'sede') {
        htmlDinamico = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group" style="grid-column: 1 / -1; margin-bottom: 0;">
                    <label>Nombre del Lugar</label>
                    <input type="text" required>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label>Correo Electrónico</label>
                    <input type="email" required>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label>Número de Teléfono</label>
                    <input type="tel" required>
                </div>
                <div class="form-group" style="grid-column: 1 / -1; margin-bottom: 10px;">
                    <label>Domicilio / Dirección Completa</label>
                    <input type="text" required>
                </div>
            </div>
        `;
    }

    dinamicos.innerHTML = htmlDinamico;
}

document.getElementById('form-registro').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('¡Registro exitoso! En un entorno real se enviaría a la API.');
    cerrarModal('register-modal');
});

// ==========================================
// HEADER Y MENÚ DESPLEGABLE
// ==========================================
function actualizarHeader() {
    const data = baseDeDatos[usuarioActual];
    
    let badgeNotif = contadores.notificaciones > 0 ? `<span class="badge">${contadores.notificaciones}</span>` : '';
    let badgeMensajes = contadores.mensajes > 0 ? `<span class="badge">${contadores.mensajes}</span>` : '';

    document.getElementById('user-status').innerHTML = `
        <div class="dropdown-container">
            <img src='${data.foto}' class="avatar-btn" onclick="toggleMenu()" id="header-avatar" alt="Perfil">
            
            <div id="mi-menu" class="dropdown-content">
                <div class="dropdown-header">
                    <strong id="header-nombre">${data.nombre}</strong><br>
                    <small style="color: #666; text-transform: capitalize;">${data.rol}</small>
                </div>
                <a href="#" onclick="mostrarVista('${data.rol}'); toggleMenu();"><i class="fas fa-columns"></i> Mi Panel</a>
                
                <a href="#" onclick="abrirModal('edit-profile-modal'); cargarDatosEnFormulario(); toggleMenu();"><i class="fas fa-user-edit"></i> Editar Perfil</a>
                <a href="#" onclick="abrirModal('notifications-modal'); toggleMenu();"><i class="fas fa-bell"></i> Notificaciones ${badgeNotif}</a>
                <a href="#" onclick="abrirModal('messages-modal'); toggleMenu();"><i class="fas fa-envelope"></i> Mensajes ${badgeMensajes}</a>
                <div class="dropdown-divider"></div>
                <a href="#" onclick="cerrarSesion()" class="logout-link"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</a>
            </div>
        </div>
    `;
}

function toggleMenu() { 
    document.getElementById("mi-menu").classList.toggle("mostrar-dropdown"); 
}

window.onclick = function(event) {
    if (!event.target.matches('.avatar-btn')) {
        let dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            if (dropdowns[i].classList.contains('mostrar-dropdown')) {
                dropdowns[i].classList.remove('mostrar-dropdown');
            }
        }
    }
}

// ==========================================
// MANEJO DE VISTAS PRIVADAS
// ==========================================
function mostrarVista(rol) {
    document.querySelectorAll('.dashboard-view').forEach(vista => {
        vista.classList.remove('active');
    });
    
    const vistaDestino = document.getElementById('vista-' + rol);
    if(vistaDestino) {
        vistaDestino.classList.add('active');
    }
}

// ==========================================
// EDICIÓN DE PERFIL (FOTO Y DATOS)
// ==========================================
function cargarDatosEnFormulario() {
    const data = baseDeDatos[usuarioActual];
    if(document.getElementById('preview-foto')) document.getElementById('preview-foto').src = data.foto;
    if(document.getElementById('edit-nombre')) document.getElementById('edit-nombre').value = data.nombre;
    if(document.getElementById('edit-correo')) document.getElementById('edit-correo').value = data.correo;
    if(document.getElementById('edit-username')) document.getElementById('edit-username').value = usuarioActual;
}

if(document.getElementById('input-foto')) {
    document.getElementById('input-foto').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('preview-foto').src = event.target.result;
            }
            reader.readAsDataURL(file);
        }
    });
}

if(document.getElementById('form-edit-profile')) {
    document.getElementById('form-edit-profile').addEventListener('submit', function(e) {
        e.preventDefault(); 
        
        if(document.getElementById('preview-foto')) baseDeDatos[usuarioActual].foto = document.getElementById('preview-foto').src;
        if(document.getElementById('edit-nombre')) baseDeDatos[usuarioActual].nombre = document.getElementById('edit-nombre').value;
        if(document.getElementById('edit-correo')) baseDeDatos[usuarioActual].correo = document.getElementById('edit-correo').value;

        actualizarHeader();
        cerrarModal('edit-profile-modal');
        alert('¡Tu perfil ha sido actualizado con éxito!');
    });
}


// ==========================================
// LÓGICA DE NOTIFICACIONES Y MENSAJES 
// ==========================================
let contadores = {
    notificaciones: 2,
    mensajes: 1
};

function leerNotificacion(titulo, mensaje, elemento) {
    if (!elemento.classList.contains('leido')) {
        elemento.classList.add('leido');
        elemento.style.background = 'white'; 
        
        let icono = elemento.querySelector('.icono-bg');
        if(icono) {
            icono.style.background = '#f4f4f4';
            icono.style.color = '#999';
        }
        
        if (contadores.notificaciones > 0) {
            contadores.notificaciones--;
            actualizarHeader(); 
        }
    }
    
    document.getElementById('notif-detail-title').innerText = titulo;
    document.getElementById('notif-detail-body').innerText = mensaje;
    cerrarModal('notifications-modal');
    abrirModal('notif-detail-modal');
}

function abrirChat(nombreContacto, elemento) {
    if (elemento && !elemento.classList.contains('leido')) {
        elemento.classList.add('leido');
        elemento.style.background = '#f9f9f9'; 
        
        let badge = elemento.querySelector('.chat-badge');
        if (badge) badge.style.display = 'none';
        
        if (contadores.mensajes > 0) {
            contadores.mensajes--;
            actualizarHeader();
        }
    }
    
    document.getElementById('chat-room-title').innerText = nombreContacto;
    cerrarModal('messages-modal');
    abrirModal('chat-room-modal');
}

// ==========================================
// INTERACTIVIDAD NUEVA (BOTONES SEGUIR)
// ==========================================
function toggleSeguir(btn, tipo) {
    if (btn.classList.contains('pendiente')) {
        btn.classList.remove('pendiente');
        btn.innerHTML = `<i class="fas fa-user-plus"></i> ${tipo}`;
        btn.style.background = 'transparent';
        btn.style.color = 'var(--accent-orange)';
        btn.style.borderColor = 'var(--accent-orange)';
    } else {
        btn.classList.add('pendiente');
        btn.innerHTML = `<i class="fas fa-clock"></i> Pendiente`;
        btn.style.background = '#eee';
        btn.style.color = '#888';
        btn.style.borderColor = '#ddd';
    }
}


// ==========================================
// SALIDA
// ==========================================
function cerrarSesion() { 
    location.reload(); 
}

// ==========================================
// Integración con Open Library API para Portadas
// ==========================================
async function cargarPortadasReales() {
    const contenedoresLibro = document.querySelectorAll('#global-libros .panel-box, #global-inicio .panel-box');
    
    for (let box of contenedoresLibro) {
        let img = box.querySelector('img');
        let tituloElement = box.querySelector('h3, h4');
        
        if (img && tituloElement && (img.src.includes('x120') || img.src.includes('x220'))) {
            let titulo = tituloElement.innerText.trim();
            try {
                let response = await fetch(`http://localhost:8000/api/libros/portada?titulo=${encodeURIComponent(titulo)}`);
                if (response.ok) {
                    let data = await response.json();
                    if (data.portada_url && !data.portada_url.includes('Error')) {
                        img.src = data.portada_url;
                        img.style.objectFit = 'cover';
                    }
                }
            } catch (error) {
                console.error("Fallo al conectar con la API de portadas de OpenLibrary para", titulo);
            }
        }
    }
}

// ==========================================
// RENDERIZADO CONDICIONAL DE CLUBES
// ==========================================
async function renderizarClubes() {
    const container = document.getElementById('lista-clubes-container');
    if (!container) return;

    container.innerHTML = '<p>Cargando clubes...</p>';
    const is_authenticated = usuarioActual !== null;

    let clubes = [];

    try {
        const response = await fetch("http://localhost:8000/api/clubes");
        if (response.ok) {
            clubes = await response.json();
        }
    } catch(err) {
        console.warn("Fallo API de clubes. Usando fallback local.");
    }

    // Aseguramos forzar la carga de los ejemplos estáticos (Mockup) si la Base de Datos está vacía
    // que es el comportamiento esperado en esta fase.
    if (!clubes || clubes.length === 0) {
        clubes = [
            { id: 1, nombre: "Clásicos Eternos", tematica: "Literatura del Siglo XIX", organizador: "Administración", sede: "Biblioteca Central", max_cupo: 15, es_online: false, img_mock: "Clasicos", horario: "Sábados 10:00 AM" },
            { id: 2, nombre: "Distopías y Café", tematica: "Ciencia Ficción y Futuro", organizador: "Administración", sede: "Café Literario 'El Péndulo'", max_cupo: 20, es_online: false, img_mock: "Distopias", horario: "Miércoles 6:00 PM" },
            { id: 3, nombre: "Letras Jóvenes", tematica: "Novela Contemporánea y YA", organizador: "Administración", sede: "Centro Cultural Comunitario", max_cupo: 25, es_online: false, img_mock: "Jovenes", horario: "Viernes 5:00 PM" },
            { id: 4, nombre: "Círculo de Poesía", tematica: "Verso Libre y Clásico", organizador: "Administración", sede: "Parque de los Escritores", max_cupo: 30, es_online: false, img_mock: "Poesia", horario: "Domingos 11:00 AM" }
        ];
    }

    container.innerHTML = '';
    
    if(clubes.length === 0) {
        container.innerHTML = '<p>No hay clubes disponibles por el momento.</p>';
        return;
    }

    clubes.forEach(club => {
        let botonesCTA = '';
        if (is_authenticated) {
            botonesCTA = `<button class="btn-submit" style="margin: 0; padding: 5px 15px; font-size: 0.85rem; width: auto;" onclick="mostrarAlerta('Has enviado tu solicitud para unirte al club ${club.nombre}.')">Unirme al Club</button>`;
        }

        const tipoImg = club.es_online ? 'fa-video' : 'fa-map-marker-alt';
        const imagenMock = club.img_mock || "Club";

        container.innerHTML += `
            <div class="panel-box" style="display: flex; flex-direction: column; padding: 0; overflow: hidden; margin-bottom: 0;">
                <img src="https://via.placeholder.com/400x200?text=${imagenMock}" alt="Club Portada" style="width:100%; height: 180px; object-fit:cover;">
                <div style="padding: 20px; flex: 1; display: flex; flex-direction: column;">
                    <h4 style="margin: 0 0 10px 0; color: var(--header-bg); font-size: 1.1rem;">${club.nombre}</h4>
                    <p style="margin: 5px 0; font-size: 0.85rem; color: #555;"><i class="fas fa-book-open"></i> Temática: <strong>${club.tematica || 'General'}</strong></p>
                    <p style="margin: 5px 0; font-size: 0.85rem; color: #555;"><i class="fas fa-user-tie"></i> Org: ${club.organizador}</p>
                    <p style="margin: 5px 0; font-size: 0.85rem; color: #555;"><i class="fas ${tipoImg}"></i> Sede: ${club.sede || 'Online'}</p>
                    <p style="margin: 5px 0; font-size: 0.85rem; color: #555;"><i class="fas fa-calendar-alt"></i> Horario: ${club.horario || 'Por definir'}</p>
                    <p style="margin: 5px 0; font-size: 0.85rem; color: var(--accent-orange); font-weight:bold;"><i class="fas fa-users"></i> Max cupo: ${club.max_cupo}</p>
                    
                    <div style="margin-top: auto; padding-top: 15px; border-top: 1px solid #eee; text-align: right;">
                        ${botonesCTA}
                    </div>
                </div>
            </div>
        `;
    });
}

// ==========================================
// RESTRICCIÓN GLOBAL DE ACCIONES
// ==========================================
function aplicarRestriccionGlobal() {
    const is_auth = usuarioActual !== null;
    const botonesRestringidos = document.querySelectorAll('.req-auth');
    
    botonesRestringidos.forEach(btn => {
        if (!is_auth) {
            btn.style.display = 'none'; // Desaparece del DOM para invitados
        } else {
            // Repone el display respetando su bloque o inline
            btn.style.display = btn.tagName.toLowerCase() === 'span' ? 'inline-block' : 'inline-block';
        }
    });
}

// Cargar portadas y clubes al abrir la app o poco después
window.addEventListener('DOMContentLoaded', () => {
    cargarPortadasReales();
    renderizarClubes();
    aplicarRestriccionGlobal();
});