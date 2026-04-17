import requests
import logging
from typing import Dict, Optional, Any

logger = logging.getLogger(__name__)

if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class BookNotFoundException(Exception):
    pass

class OpenLibraryAPIError(Exception):
    pass

def buscar_libro(termino_de_busqueda: str) -> Dict[str, Any]:
    url = "https://openlibrary.org/search.json"
    params = {
        "q": termino_de_busqueda
    }
    
    PLACEHOLDER_COVER_URL = "https://via.placeholder.com/400x600.png?text=Portada+No+Disponible"
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
    except requests.exceptions.Timeout:
        logger.error(f"Timeout: La API tardó demasiado para '{termino_de_busqueda}'.")
        raise OpenLibraryAPIError("El servidor no respondió a tiempo.")
    except requests.exceptions.HTTPError as http_err:
        logger.error(f"Error HTTP (Status {response.status_code}) para '{termino_de_busqueda}': {http_err}")
        raise OpenLibraryAPIError(f"Ocurrió un error (HTTP {response.status_code}) en la petición.")
    except requests.exceptions.RequestException as req_err:
        logger.error(f"Error de red/conexión para '{termino_de_busqueda}': {req_err}")
        raise OpenLibraryAPIError("Error al intentar conectarse a la API.")
        
    try:
        data = response.json()
    except ValueError:
        logger.error("Error al decodificar la respuesta JSON.")
        raise OpenLibraryAPIError("La respuesta no tiene el formato JSON esperado.")
        
    docs = data.get("docs", [])
    if not docs:
        logger.warning(f"No se encontraron libros para '{termino_de_busqueda}'.")
        raise BookNotFoundException("No se encontró ningún libro.")
        
    primer_resultado = docs[0]
    
    titulo = primer_resultado.get("title", "Título Desconocido")
    
    autores = primer_resultado.get("author_name", [])
    autor = autores[0] if isinstance(autores, list) and autores else "Autor Desconocido"
    
    fecha_publicacion = primer_resultado.get("first_publish_year", "Desconocida")
    
    cover_i = primer_resultado.get("cover_i")
    if cover_i is not None:
        portada_url = f"https://covers.openlibrary.org/b/id/{cover_i}-L.jpg"
    else:
        portada_url = PLACEHOLDER_COVER_URL
        
    libro_estructurado = {
        "titulo": titulo,
        "autor": autor,
        "fecha_publicacion": fecha_publicacion,
        "portada": portada_url
    }
    
    return libro_estructurado

if __name__ == "__main__":
    termino = "The Pragmatic Programmer"
    try:
        resultado = buscar_libro(termino)
        for clave, valor in resultado.items():
            print(f"- {clave.capitalize()}: {valor}")
    except (BookNotFoundException, OpenLibraryAPIError) as error:
        print(f"\n[Error] {error}")
