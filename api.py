from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime

# Importamos los modelos y la sesión de la base de datos que ya existen
from club_lectura import SessionLocal, MensajePrivado, MensajeForo, engine, Base

# Asegurarnos de que las tablas existan al levantar la API
Base.metadata.create_all(bind=engine)

app = FastAPI(title="BiblioRed API")

# Configurar CORS para que el frontend desde cualquier origen pueda conectarse sin problemas
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite que el HTML abierto local (file:// o localhost) acceda
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependencia para obtener la sesión de la DB en cada request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Esquemas (Pydantic Models) para validar los datos de entrada/salida ---

class MensajePrivadoCreate(BaseModel):
    remitente_username: str  # Usamos username para que sea fácil conectar con script.js
    destinatario_username: str
    contenido: str

class MensajePrivadoResponse(BaseModel):
    id: int
    remitente_id: int
    destinatario_id: int
    contenido: str
    fecha_envio: datetime

    class Config:
        from_attributes = True

class MensajeForoCreate(BaseModel):
    club_id: int
    usuario_username: str
    titulo_tema: str = ""
    contenido: str

# Como el script.js simula el login con nombres de usuario (ej. "juanlector"),
# creamos una función auxiliar para obtener el ID real de la base de datos a partir del username.
def obtener_usuario_id(db: Session, username: str) -> int:
    from club_lectura import Usuario
    user = db.query(Usuario).filter(Usuario.username == username).first()
    if not user:
        # En un sistema real retornaríamos 404, pero para el prototipo si no existe lo podemos insertar o lanzar error
        raise HTTPException(status_code=404, detail=f"Usuario {username} no encontrado en la DB postgres.")
    return user.id


# --- Endpoints de Mensajes Privados (Chat 1 a 1) ---

@app.post("/api/chat", response_model=MensajePrivadoResponse)
def enviar_mensaje_chat(mensaje: MensajePrivadoCreate, db: Session = Depends(get_db)):
    remitente_id = obtener_usuario_id(db, mensaje.remitente_username)
    destinatario_id = obtener_usuario_id(db, mensaje.destinatario_username)

    nuevo_mensaje = MensajePrivado(
        remitente_id=remitente_id,
        destinatario_id=destinatario_id,
        contenido=mensaje.contenido,
        fecha_envio=datetime.utcnow()
    )
    db.add(nuevo_mensaje)
    db.commit()
    db.refresh(nuevo_mensaje)
    return nuevo_mensaje

@app.get("/api/chat")
def obtener_chat(remitente: str, destinatario: str, db: Session = Depends(get_db)):
    remitente_id = obtener_usuario_id(db, remitente)
    destinatario_id = obtener_usuario_id(db, destinatario)

    mensajes = db.query(MensajePrivado).filter(
        ((MensajePrivado.remitente_id == remitente_id) & (MensajePrivado.destinatario_id == destinatario_id)) |
        ((MensajePrivado.remitente_id == destinatario_id) & (MensajePrivado.destinatario_id == remitente_id))
    ).order_by(MensajePrivado.fecha_envio.asc()).all()
    
    return mensajes


# --- Endpoints de Mensajes de Foro (Club de lectura) ---

@app.post("/api/foro")
def publicar_mensaje_foro(mensaje: MensajeForoCreate, db: Session = Depends(get_db)):
    usuario_id = obtener_usuario_id(db, mensaje.usuario_username)
    
    nuevo_comentario = MensajeForo(
        club_id=mensaje.club_id,
        usuario_id=usuario_id,
        titulo_tema=mensaje.titulo_tema,
        contenido=mensaje.contenido,
        fecha_publicacion=datetime.utcnow()
    )
    db.add(nuevo_comentario)
    db.commit()
    db.refresh(nuevo_comentario)
    return {"status": "success", "id": nuevo_comentario.id, "contenido": nuevo_comentario.contenido}

# --- Endpoints de Biblioteca (Open Library) ---

from openlibrary_service import buscar_libro, BookNotFoundException, OpenLibraryAPIError

@app.get("/api/libros/portada")
def obtener_portada_libro(titulo: str):
    try:
        resultado = buscar_libro(titulo)
        return {"portada_url": resultado["portada"], "titulo": resultado["titulo"]}
    except BookNotFoundException:
        # Placeholder por defecto si no lo encuentra o no tiene cover
        return {"portada_url": "https://via.placeholder.com/400x600.png?text=Portada+No+Disponible", "titulo": titulo}
    except OpenLibraryAPIError:
        # En caso de error de red, devolvemos un placeholder también
        return {"portada_url": "https://via.placeholder.com/400x600.png?text=Error+de+Conexion", "titulo": titulo}


# --- Endpoints de Clubes ---

@app.get("/api/clubes")
def obtener_clubes(db: Session = Depends(get_db)):
    from club_lectura import Club, Usuario
    # Traemos los clubes activos
    clubes = (
        db.query(Club)
        .filter(Club.estado_activo == True)
        .all()
    )
    
    # Formateamos la respuesta para adaptarla al frontend
    resultado = []
    for c in clubes:
        resultado.append({
            "id": c.id,
            "nombre": c.nombre,
            "organizador": c.organizador.nombre_completo if c.organizador else "Desconocido",
            "sede": c.sede.nombre_completo if c.sede else "Online",
            "max_cupo": c.cupo_maximo,
            "es_online": c.sede_id is None,
            "horario": c.horario_texto,
            # Simulamos las imágenes como están en el mock para la visualización
            "img_mock": "Club-" + str(c.id)
        })
        
    return resultado

