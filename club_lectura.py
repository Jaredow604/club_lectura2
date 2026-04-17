import urllib.parse
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, DateTime, Enum, Float, Boolean, Table
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import enum

# 1. Escribe aquí tu usuario y tu contraseña con acentos
mi_usuario = "postgres"  # Cámbialo por tu usuario
mi_password = "Jk9oe"

# 2. Python convierte el acento a un formato que la base de datos sí entiende
password_codificada = urllib.parse.quote_plus(mi_password)

# 3. Armamos la URL. ¡Nota que la arroba @ está justo antes de localhost!
DATABASE_URL = f'postgresql://{mi_usuario}:{password_codificada}@localhost:5432/club_lectura'

# Creamos el motor
engine = create_engine(DATABASE_URL)
Base = declarative_base()

class RolUsuario(enum.Enum):
    LECTOR = "lector"
    AUTOR = "autor"
    ORGANIZADOR = "organizador"
    SEDE = "sede"

class EstadoReserva(enum.Enum):
    PENDIENTE = "pendiente"
    APROBADA = "aprobada"
    PAGADA = "pagada"
    RECHAZADA = "rechazada"

seguidores_asociacion = Table(
    'seguidores', Base.metadata,
    Column('seguidor_id', Integer, ForeignKey('usuarios.id', ondelete="CASCADE"), primary_key=True),
    Column('seguido_id', Integer, ForeignKey('usuarios.id', ondelete="CASCADE"), primary_key=True)
)

miembros_club_asociacion = Table(
    'miembros_club', Base.metadata,
    Column('usuario_id', Integer, ForeignKey('usuarios.id', ondelete="CASCADE"), primary_key=True),
    Column('club_id', Integer, ForeignKey('clubes.id', ondelete="CASCADE"), primary_key=True),
    Column('fecha_union', DateTime, default=datetime.utcnow)
)

lista_lectura_asociacion = Table(
    'lista_lectura', Base.metadata,
    Column('usuario_id', Integer, ForeignKey('usuarios.id', ondelete="CASCADE"), primary_key=True),
    Column('libro_id', Integer, ForeignKey('libros.id', ondelete="CASCADE"), primary_key=True),
    Column('progreso_porcentaje', Float, default=0.0)
)

class Usuario(Base):
    __tablename__ = 'usuarios'

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    rol = Column(Enum(RolUsuario, name="rol_usuario_enum", create_type=True), nullable=False)
    
    nombre_completo = Column(String(100), nullable=False)
    telefono = Column(String(20))
    ciudad = Column(String(50))
    bio = Column(Text)
    foto_url = Column(String(255))
    fecha_registro = Column(DateTime, default=datetime.utcnow)

    capacidad_maxima = Column(Integer)
    direccion = Column(String(255))
    amenidades = Column(String(255))

    clubes_organizados = relationship("Club", foreign_keys="[Club.organizador_id]", back_populates="organizador")
    clubes_alojados = relationship("Club", foreign_keys="[Club.sede_id]", back_populates="sede")
    
    seguidos = relationship(
        "Usuario",
        secondary=seguidores_asociacion,
        primaryjoin=id==seguidores_asociacion.c.seguidor_id,
        secondaryjoin=id==seguidores_asociacion.c.seguido_id,
        backref="seguidores"
    )
    libros_por_leer = relationship("Libro", secondary=lista_lectura_asociacion, back_populates="lectores_interesados")


class Libro(Base):
    __tablename__ = 'libros'

    id = Column(Integer, primary_key=True, autoincrement=True)
    titulo = Column(String(150), nullable=False, index=True)
    sinopsis = Column(Text, nullable=False)
    paginas = Column(Integer)
    calificacion_promedio = Column(Float, default=0.0)
    portada_url = Column(String(255))
    
    autor_id = Column(Integer, ForeignKey('usuarios.id', ondelete="SET NULL"))
    autor_nombre = Column(String(100), nullable=False)

    clubes = relationship("Club", back_populates="libro")
    lectores_interesados = relationship("Usuario", secondary=lista_lectura_asociacion, back_populates="libros_por_leer")


class Club(Base):
    __tablename__ = 'clubes'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
    es_privado = Column(Boolean, default=False)
    cupo_maximo = Column(Integer, nullable=False)
    horario_texto = Column(String(100))
    estado_activo = Column(Boolean, default=True)

    organizador_id = Column(Integer, ForeignKey('usuarios.id', ondelete="CASCADE"), nullable=False)
    sede_id = Column(Integer, ForeignKey('usuarios.id', ondelete="SET NULL"))
    libro_id = Column(Integer, ForeignKey('libros.id', ondelete="CASCADE"), nullable=False)

    organizador = relationship("Usuario", foreign_keys=[organizador_id], back_populates="clubes_organizados")
    sede = relationship("Usuario", foreign_keys=[sede_id], back_populates="clubes_alojados")
    libro = relationship("Libro", back_populates="clubes")
    
    miembros = relationship("Usuario", secondary=miembros_club_asociacion, backref="clubes_suscritos")
    foros = relationship("MensajeForo", back_populates="club", cascade="all, delete-orphan")


class Reserva(Base):
    __tablename__ = 'reservas'

    id = Column(Integer, primary_key=True, autoincrement=True)
    club_id = Column(Integer, ForeignKey('clubes.id', ondelete="CASCADE"), nullable=False)
    sede_id = Column(Integer, ForeignKey('usuarios.id', ondelete="CASCADE"), nullable=False)
    organizador_id = Column(Integer, ForeignKey('usuarios.id', ondelete="CASCADE"), nullable=False)
    
    fecha_evento = Column(DateTime, nullable=False)
    asistentes_estimados = Column(Integer)
    costo_acordado = Column(Float, default=0.0)
    estado = Column(Enum(EstadoReserva, name="estado_reserva_enum", create_type=True), default=EstadoReserva.PENDIENTE)

    club = relationship("Club")


class MensajeForo(Base):
    __tablename__ = 'mensajes_foro'

    id = Column(Integer, primary_key=True, autoincrement=True)
    club_id = Column(Integer, ForeignKey('clubes.id', ondelete="CASCADE"), nullable=False)
    usuario_id = Column(Integer, ForeignKey('usuarios.id', ondelete="CASCADE"), nullable=False)
    
    titulo_tema = Column(String(150))
    contenido = Column(Text, nullable=False)
    fecha_publicacion = Column(DateTime, default=datetime.utcnow)

    club = relationship("Club", back_populates="foros")
    autor_mensaje = relationship("Usuario")


class MensajePrivado(Base):
    __tablename__ = 'mensajes_privados'

    id = Column(Integer, primary_key=True, autoincrement=True)
    remitente_id = Column(Integer, ForeignKey('usuarios.id', ondelete="CASCADE"), nullable=False)
    destinatario_id = Column(Integer, ForeignKey('usuarios.id', ondelete="CASCADE"), nullable=False)
    
    contenido = Column(Text, nullable=False)
    fecha_envio = Column(DateTime, default=datetime.utcnow)

    remitente = relationship("Usuario", foreign_keys=[remitente_id])
    destinatario = relationship("Usuario", foreign_keys=[destinatario_id])


# Para permitir manejar la sesión fuera de este archivo
from sqlalchemy.orm import sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

if __name__ == "__main__":
    Base.metadata.create_all(engine)
    print("Tablas de BiblioRed creadas exitosamente en PostgreSQL.")