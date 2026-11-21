// Configuración de EJEMPLO para la portada DOBLE: una misma aplicación con DOS frontends (aquí, eShopContainers
// con WebMVC y WebSPA). Genera el hero con dos grupos, cada uno con su ventana de escritorio y su móvil:
//
//   node capturar.mjs hero-doble.config.mjs [carpeta-salida]      (o:  npm run hero-doble)
//
// Las dos aplicaciones tienen que estar YA en marcha. Adáptala a tu proyecto cambiando `heroDoble.grupos`
// (un grupo por frontend: título, URL y selector `listo` que indica que el catálogo ya se pintó).
//
// Qué tiene de distinto respecto a capturas.config.mjs (la de las capturas sueltas):
//  - `heroDoble` en lugar de `pantallas`/`principal`: cada grupo trae su propia `baseUrl`.
//  - `altoImpresion`: Chrome pasa a la página 2 el grid del catálogo (un contenedor que no sabe partir) y se
//    perdería. Se imprime en una página muy alta y el SVG se recorta después a la zona visible (w x h).
//  - `permitirImagenes`: las fotos de producto son bitmaps; en vez de fallar, se reconvierten a JPEG reducido
//    (`reducirImagenes`) para que el SVG no pese varios MB. El resto (texto, iconos, formas) sigue vectorial.
//  - `antesDeImprimir`: oculta las tarjetas que quedan fuera del encuadre para no incrustar imágenes que no se ven.

const MVC = process.env.MVC_URL ?? "http://localhost:5100";
const SPA = process.env.SPA_URL ?? "http://localhost:5104";
const CATALOGO = ".esh-catalog-item"; // selector de cada producto del catálogo (igual en MVC y SPA)
const TARJETAS_VISIBLES = { escritorio: 6, movil: 2 }; // las que caben en el encuadre de cada dispositivo

export default {
  locale: "en-US",
  dispositivos: {
    escritorio: { w: 1440, h: 900, altoImpresion: 2400 }, // 16:10, como la ventana del hero
    movil: { w: 390, h: 844, altoImpresion: 6000 },
  },
  permitirImagenes: true,
  esperarImagenes: true,
  reducirImagenes: { anchoMax: 700, calidad: 0.82 }, // opcional: son los valores por defecto
  antesDeImprimir: (page, dispositivo) =>
    page.evaluate(([selector, visibles]) => {
      document.querySelectorAll(selector).forEach((el, i) => { if (i >= visibles) el.style.display = "none"; });
    }, [CATALOGO, TARJETAS_VISIBLES[dispositivo]]),
  heroDoble: {
    fichero: "hero-eshopcontainers.svg",
    titulo: "eShopContainers: catalog with the WebMVC and WebSPA frontends on desktop and mobile",
    grupos: [
      { id: "mvc", titulo: "WebMVC", subtitulo: "ASP.NET Core · Razor", baseUrl: MVC, ruta: "/", url: new URL(MVC).host, listo: CATALOGO },
      { id: "spa", titulo: "WebSPA", subtitulo: "Angular", baseUrl: SPA, ruta: "/", url: new URL(SPA).host, listo: CATALOGO },
    ],
  },
};
