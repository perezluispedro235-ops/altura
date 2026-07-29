# Calendario · Altura Athletics

Sitio web estático con el calendario de eventos del club: entrenamientos, carreras y salidas sociales. Vista de calendario mensual + lista de próximos eventos, filtros por tipo, y botón para agregar cada evento al calendario personal (Google Calendar, Apple Calendar, Outlook, etc. vía archivo `.ics`).

No requiere backend, base de datos ni proceso de build.

## Ver el sitio en local

Solo abrí `index.html` en el navegador, o serví la carpeta con cualquier servidor estático, por ejemplo:

```bash
python3 -m http.server 8000
```

y visitá `http://localhost:8000`.

## Cómo agregar o editar eventos

Todos los eventos viven en [`data/events.json`](data/events.json). Es una lista de objetos con esta forma:

```json
{
  "id": "2026-08-16-carrera-antigua",
  "title": "Carrera 10K Antigua Colonial",
  "type": "carrera",
  "date": "2026-08-16",
  "time": "07:00",
  "location": "Salida: Arco de Santa Catalina",
  "locationUrl": "https://maps.google.com/?q=Arco+de+Santa+Catalina+Antigua+Guatemala",
  "distance": "10 km",
  "description": "Carrera oficial por las calles empedradas del centro histórico.",
  "link": ""
}
```

Campos:

- **id**: identificador único del evento (usá algo tipo `fecha-nombre-corto`, sin espacios).
- **title**: nombre del evento.
- **type**: uno de `entrenamiento`, `carrera` o `social` (define el color y el filtro).
- **date**: fecha en formato `AAAA-MM-DD`.
- **time**: hora de inicio en formato `HH:MM` (24 horas).
- **location**: texto del lugar de encuentro.
- **locationUrl** *(opcional)*: link a Google Maps u otro mapa.
- **distance** *(opcional)*: distancia estimada, ej. `"8 km"`.
- **description** *(opcional)*: detalles adicionales.
- **link** *(opcional)*: URL con más información (página de inscripción, etc.).

Para agregar un evento nuevo, copiá uno de los bloques existentes, editá los datos y agregalo a la lista (recordá las comas entre objetos). Guardá el archivo y hacé commit + push — no hace falta tocar HTML, CSS ni JS.

## Publicar el sitio gratis (GitHub Pages)

1. En GitHub, entrá a **Settings → Pages** del repositorio.
2. En "Build and deployment", elegí **Deploy from a branch**.
3. Seleccioná la rama principal (`main`) y la carpeta `/ (root)`.
4. Guardá. GitHub te va a dar una URL tipo `https://<usuario>.github.io/<repo>/` para compartir con el club.

Cada vez que editen `data/events.json` y hagan push a esa rama, el sitio se actualiza solo (puede tardar uno o dos minutos).

## Estructura del proyecto

```
index.html          Página principal
css/style.css        Estilos (con modo claro/oscuro automático)
js/app.js             Lógica del calendario, filtros y exportación .ics
data/events.json      Datos de los eventos — el único archivo que hay que editar
```
