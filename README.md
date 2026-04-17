# BiblioRed - Proyecto Club de Lectura

Este es el proyecto para el club de lectura "BiblioRed". Consiste en un backend desarrollado con **FastAPI** y una base de datos **PostgreSQL** para manejar usuarios, clubes de lectura, foros y un chat privado. El frontend es estático (HTML, CSS, JS puro) y se conecta a la API.

A continuación, encontrarás los pasos para instalar y ejecutar todo el proyecto localmente.

## Requisitos Previos

Asegúrate de tener instalados los siguientes programas en tu computadora:

1. **Python 3.8** o superior.
2. **PostgreSQL** (configurado y en ejecución en el puerto 5432, que es el por defecto).
3. (Opcional pero muy recomendado) Ocasionalmente, puede ser útil usar un **entorno virtual** de Python (`venv`).

## Paso 1: Configurar la Base de Datos

1. Abre tu gestor de base de datos PostgreSQL (como pgAdmin, DBeaver, o desde la terminal `psql`).
2. Crea una nueva base de datos llamada **`club_lectura`**.
3. Revisa el archivo `club_lectura.py`. En las líneas 8 y 9 están configuradas las credenciales de la base de datos:
   ```python
   mi_usuario = "postgres"  # Usuario de tu base de datos
   mi_password = "1234"     # Contraseña de tu base de datos
   ```
   *Nota: Si tu usuario o contraseña de PostgreSQL son diferentes, asegúrate de actualizarlos en el archivo.*

## Paso 2: Crear un Entorno Virtual e Instalar Dependencias

Es recomendable usar un entorno virtual para no mezclar las dependencias de este proyecto con los paquetes globales de tu sistema.

1. Abre una terminal y navega a la carpeta principal del proyecto (`Proyecto`).
2. Crea el entorno virtual ejecutando:
   ```bash
   python -m venv venv
   ```
3. Activa el entorno virtual:
   - En **Windows**:
     ```bash
     venv\Scripts\activate
     ```
   - En **macOS / Linux**:
     ```bash
     source venv/bin/activate
     ```
4. Con el entorno activado, instala las dependencias desde el archivo `requirements.txt`:
   ```bash
   pip install -r requirements.txt
   ```
*(Nota: Hemos incluido `psycopg2-binary` para que SQLAlchemy pueda conectarse a PostgreSQL fácilmente).*

## Paso 3: Inicializar la Base de Datos (Crear Tablas)

Antes de levantar la aplicación por primera vez, necesitas crear todas las tablas en tu base de datos.
Para hacerlo, ejecuta el script de los modelos desde la terminal:

```bash
python club_lectura.py
```
Si todo salió bien, verás un mensaje en la consola diciendo: `"Tablas de BiblioRed creadas exitosamente en PostgreSQL."`

## Paso 4: Ejecutar el Servidor Backend (API)

Para iniciar la API y poder procesar búsquedas de libros, mensajes del foro y el chat, levanta el servidor uvicorn:

```bash
uvicorn api:app --reload
```
A partir de este momento, el backend estará escuchando peticiones en: `http://localhost:8000`

## Paso 5: Abrir el Frontend

Con el backend en ejecución, ahora puedes explorar la aplicación web.

1. Ve a la carpeta de tu proyecto.
2. Dale doble clic al archivo **`index.html`** para abrirlo en tu navegador favorito (Chrome, Firefox, Edge, etc.).

¡Listo! Ya puedes utilizar la interfaz web y esta se comunicará con tu base de datos mediante la API.

## Funcionalidades principales

- **Búsqueda de Libros:** Utiliza la API de OpenLibrary (a través de `openlibrary_service.py`) para buscar portadas e información de libros.
- **Foro y Chat:** Todos los mensajes de foros o mensajes privados entre usuarios se guardan permanentemente en la base de datos PostgreSQL y pueden mostrarse sin problema recargando el frontend.
