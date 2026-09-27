# Scripts para generar las capturas (SVG)

Generan las capturas de pantalla de los README como **SVG vectorial**: nítidas a cualquier tamaño, con
texto e iconos como formas (se ven igual en cualquier equipo) y sin ningún bitmap incrustado.

```
Chrome (Playwright)  →  PDF  →  SVG (pdftocairo)
```

| Fichero | Para qué sirve |
|---|---|
| [`capturar.mjs`](capturar.mjs) | Abre la app en Chrome, recorre las pantallas definidas en la config y deja un SVG por pantalla y dispositivo en `../img/`. También compone la portada |
| [`capturas.config.mjs`](capturas.config.mjs) | **Lo que hay que adaptar**: URL, tamaños de ventana, sesión y lista de pantallas (con sus acciones) |
| [`componer.mjs`](componer.mjs) | Compone la portada (ventana de navegador + móvil) a partir de la pantalla principal |
| [`previsualizar.mjs`](previsualizar.mjs) | Opcional: convierte los SVG a PNG para revisarlos a ojo |

## Requisitos

- **Node.js 20+** y **Google Chrome** instalado (o la variable `CHROME_PATH` con la ruta a un Chromium).
- **`pdftocairo`** (herramienta de [Poppler](https://poppler.freedesktop.org/)) en el `PATH`, o su ruta en `PDFTOCAIRO`:
  - Windows: viene con MiKTeX, o `choco install poppler`
  - macOS: `brew install poppler`
  - Linux: `sudo apt install poppler-utils`
- La aplicación (y su backend) **ya arrancados**: el script no los levanta.

## Uso

```bash
cd src
npm install
npm run capturas                          # usa capturas.config.mjs y escribe en ../img
node capturar.mjs otra.config.mjs /ruta   # config y carpeta de salida alternativas
```

Con la configuración de ejemplo se generan, por cada pantalla, `captura-<id>-escritorio.svg` y
`captura-<id>-movil.svg`, además de `hero-bibliotech.svg` (la portada).

Las capturas del README están **en inglés**: es el idioma por defecto (`IDIOMA=en`). Con `IDIOMA=es` se generan
en español. La config cambia el idioma de la interfaz y el `locale` del navegador, pero los **datos** (títulos,
categorías...) los pone el backend, así que este debe estar arrancado con datos en ese mismo idioma.

## Para usarlo con tu aplicación

1. Copia `capturas.config.mjs` y cambia `baseUrl` (o usa `BASE_URL` / `AUTH_URL`).
2. Define en `pantallas` las que quieras mostrar: `id`, `ruta`, `titulo` y, si hace falta, una `accion(page)`
   (filtrar, pulsar un botón...) que prepare el estado antes de capturar.
3. Adapta `preparar()` a cómo guarda tu app la sesión, y `listo` al selector que indica que la vista ya se pintó.

## Trucos para que el SVG sea 100 % vectorial

- Chrome exporta a PDF como **bitmap** las sombras con desenfoque (`box-shadow`), los filtros y algunas
  transparencias. Por eso `capturar.mjs` anula las sombras de Bootstrap y **falla** si el SVG resultante lleva
  alguna imagen incrustada, en vez de dejarla pasar. Si tu app usa sombras propias, añádelas a `css` en la config.
- Si una acción modifica datos del backend (p. ej. solicitar un préstamo), pon esa pantalla la última y reinicia
  los datos en `antesDeDispositivo`, o escritorio y móvil mostrarán estados distintos.
