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
| [`componer-doble.mjs`](componer-doble.mjs) | Compone la portada **doble**: dos grupos (p. ej. dos frontends de la misma app), cada uno con su ventana de navegador y su móvil |
| [`hero-doble.config.mjs`](hero-doble.config.mjs) | Config de ejemplo de la portada doble (eShopContainers: WebMVC + WebSPA) |
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
4. Si tu app usa HTTPS con un certificado autofirmado, o necesitas otras opciones del navegador (permisos, zona
   horaria...), ponlas en `opcionesContexto`, p. ej. `opcionesContexto: { ignoreHTTPSErrors: true }`.

## Portada doble (dos frontends)

Si tu aplicación tiene **dos frontends** (por ejemplo, uno servido por el servidor y otro SPA), la portada puede
mostrar los dos: cada uno con su ventana de escritorio y su móvil, con su nombre y su URL encima.

```bash
cd src
npm run hero-doble                                        # usa hero-doble.config.mjs y escribe en ../img
node capturar.mjs hero-doble.config.mjs /ruta/de/salida   # carpeta de salida alternativa
MVC_URL=http://localhost:5100 SPA_URL=http://localhost:5104 npm run hero-doble   # otras URLs
```

La config de ejemplo es la de [eShopContainers](https://github.com/giis-uniovi/retorch-st-eShopContainers)
(`WebMVC` en el 5100 y `WebSPA` en el 5104; ambos tienen que estar arrancados) y genera `hero-eshopcontainers.svg`.
Para adaptarla a tu proyecto, cambia `heroDoble.grupos` (un grupo por frontend: `titulo`, `subtitulo`, `baseUrl`,
`ruta`, `url` que se ve en la barra del navegador y el selector `listo` de cada vista).

Las capturas se hacen igual que las sueltas, pero con estas opciones de la config, **todas opcionales** (si no
las pones, `capturar.mjs` se comporta como siempre):

| Opción | Para qué sirve |
|---|---|
| `heroDoble` | `{ fichero, titulo, grupos: [...] }`: activa la portada doble. Cada grupo lleva su propia `baseUrl` (también se admite `baseUrl` y `listo` por pantalla en `pantallas`) |
| `dispositivos.*.altoImpresion` | Alto (px) de la página del PDF, mayor que el de la ventana. Chrome pasa a la página 2 los contenedores que no sabe partir (grids o flex), y se perdería el catálogo. El SVG se **recorta** después a la zona visible |
| `permitirImagenes` | Las fotos de producto son bitmaps. En vez de fallar, se incrustan reconvertidas a JPEG reducido (`reducirImagenes: { anchoMax, calidad }`), con el propio Chrome, para que el SVG no pese varios MB. El texto, los iconos y las formas siguen siendo vectoriales |
| `esperarImagenes` | Espera a que todas las `<img>` terminen de cargar antes de imprimir |
| `antesDeImprimir(page, dispositivo)` | Gancho para preparar la vista antes de imprimir; en el ejemplo oculta las tarjetas que quedan fuera del encuadre, para no incrustar imágenes que no se ven |

> Con `permitirImagenes` el SVG deja de ser 100 % vectorial: úsalo solo cuando la propia aplicación muestre
> fotos. Con el catálogo de eShopContainers el resultado ronda 1,6 MB.

## Trucos para que el SVG sea 100 % vectorial

- Chrome exporta a PDF como **bitmap** las sombras con desenfoque (`box-shadow`), los filtros y algunas
  transparencias. Por eso `capturar.mjs` anula las sombras de Bootstrap y **falla** si el SVG resultante lleva
  alguna imagen incrustada, en vez de dejarla pasar (salvo que actives `permitirImagenes`, ver arriba). Si tu app usa sombras propias, añádelas a `css` en la config.
- Si una acción modifica datos del backend (p. ej. solicitar un préstamo), pon esa pantalla la última y reinicia
  los datos en `antesDeDispositivo`, o escritorio y móvil mostrarán estados distintos.
