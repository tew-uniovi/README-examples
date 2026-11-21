// Compone la portada DOBLE del README: dos grupos (p. ej. dos frontends de la misma aplicación) y cada
// grupo con su ventana de navegador (escritorio) + teléfono (móvil), incrustando los SVG como vectores.
// Lo usa capturar.mjs cuando la config define `heroDoble`, pero también se puede ejecutar a mano:
//   node componer-doble.mjs <salida.svg> <grupos.json>
// donde grupos.json es [{ "titulo": "WebMVC", "subtitulo": "ASP.NET Core", "url": "localhost:5100",
//                         "escritorio": "mvc-escritorio.svg", "movil": "mvc-movil.svg" }, ...]
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { FUENTE, incrustar } from "./componer.mjs";

// Geometría (px del lienzo). La ventana mantiene la proporción de la captura de escritorio (16:10) y la
// pantalla del móvil la de la captura móvil (390x844), para que las capturas encajen sin deformarse.
const VENTANA = { ancho: 600, barra: 40, alto: 375 };
const MOVIL = { pantallaAlto: 420, marco: 12, ratio: 390 / 844, solape: 56, desnivel: 60 };
const ESPACIO_ENTRE_GRUPOS = 40, MARGEN = 48, ARRIBA = 72;

export function componerDoble({ grupos, salida, titulo = "Dos versiones de la aplicación en escritorio y en móvil" }) {
  const altoVentana = VENTANA.barra + VENTANA.alto;
  const pantallaAncho = +(MOVIL.pantallaAlto * MOVIL.ratio).toFixed(2);
  const cuerpoAncho = pantallaAncho + MOVIL.marco * 2, cuerpoAlto = MOVIL.pantallaAlto + MOVIL.marco * 2;
  const anchoGrupo = VENTANA.ancho + cuerpoAncho - MOVIL.solape;
  const W = MARGEN * 2 + anchoGrupo * grupos.length + ESPACIO_ENTRE_GRUPOS * (grupos.length - 1);
  const yMovil = ARRIBA + MOVIL.desnivel;
  const H = yMovil + cuerpoAlto + 54;

  const recortes = [], bloques = [];
  grupos.forEach((g, i) => {
    const id = g.id ?? `g${i}`;
    const x0 = MARGEN + i * (anchoGrupo + ESPACIO_ENTRE_GRUPOS);
    const xMovil = x0 + VENTANA.ancho - MOVIL.solape;
    const svgE = readFileSync(g.escritorio, "utf8"), svgM = readFileSync(g.movil, "utf8");
    recortes.push(
      `<clipPath id="ventana-${id}"><rect x="${x0}" y="${ARRIBA}" width="${VENTANA.ancho}" height="${altoVentana}" rx="12"/></clipPath>`,
      `<clipPath id="pantalla-${id}"><rect x="${xMovil + MOVIL.marco}" y="${yMovil + MOVIL.marco}" width="${pantallaAncho}" height="${MOVIL.pantallaAlto}" rx="26"/></clipPath>`);
    bloques.push(`
<!-- ${g.titulo} -->
<text x="${x0 + 4}" y="48" font-family="${FUENTE}" font-size="22" font-weight="700" fill="#1b2a4a">${g.titulo}${g.subtitulo ? `<tspan font-size="14" font-weight="400" fill="#5b6577" dx="10">${g.subtitulo}</tspan>` : ""}</text>
<rect x="${x0}" y="${ARRIBA}" width="${VENTANA.ancho}" height="${altoVentana}" rx="12" fill="#ffffff" filter="url(#sombra)"/>
<g clip-path="url(#ventana-${id})">
  <rect x="${x0}" y="${ARRIBA}" width="${VENTANA.ancho}" height="${VENTANA.barra}" fill="#e9edf5"/>
  <circle cx="${x0 + 22}" cy="${ARRIBA + 20}" r="6" fill="#ff5f57"/>
  <circle cx="${x0 + 42}" cy="${ARRIBA + 20}" r="6" fill="#febc2e"/>
  <circle cx="${x0 + 62}" cy="${ARRIBA + 20}" r="6" fill="#28c840"/>
  <rect x="${x0 + 92}" y="${ARRIBA + 8}" width="${VENTANA.ancho - 92 - 20}" height="24" rx="12" fill="#ffffff"/>
  <text x="${x0 + 112}" y="${ARRIBA + 24.5}" font-family="${FUENTE}" font-size="13" fill="#5b6577">${g.url ?? ""}</text>
  ${incrustar(svgE, `${id}-e-`, x0, ARRIBA + VENTANA.barra, VENTANA.ancho, VENTANA.alto)}
</g>
<rect x="${x0}" y="${ARRIBA}" width="${VENTANA.ancho}" height="${altoVentana}" rx="12" fill="none" stroke="#c3cde2"/>
<rect x="${xMovil}" y="${yMovil}" width="${cuerpoAncho}" height="${cuerpoAlto}" rx="38" fill="#1d2433" filter="url(#sombra)"/>
<g clip-path="url(#pantalla-${id})">
  <rect x="${xMovil + MOVIL.marco}" y="${yMovil + MOVIL.marco}" width="${pantallaAncho}" height="${MOVIL.pantallaAlto}" fill="#ffffff"/>
  ${incrustar(svgM, `${id}-m-`, xMovil + MOVIL.marco, yMovil + MOVIL.marco, pantallaAncho, MOVIL.pantallaAlto)}
</g>`);
  });

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" role="img" aria-label="${titulo}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<title>${titulo}</title>
<defs>
  <linearGradient id="fondo" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#e6ecf8"/><stop offset="1" stop-color="#c7d4ee"/>
  </linearGradient>
  <filter id="sombra" x="-10%" y="-10%" width="120%" height="125%">
    <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#1b2a4a" flood-opacity="0.28"/>
  </filter>
  ${recortes.join("\n  ")}
</defs>

<rect width="${W}" height="${H}" rx="28" fill="url(#fondo)"/>
${bloques.join("")}
</svg>
`;
  writeFileSync(salida, svg);
  console.log("✔", salida);
}

// Ejecución directa por línea de comandos
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [salida, rutaGrupos] = process.argv.slice(2);
  if (!rutaGrupos) throw new Error("Uso: node componer-doble.mjs <salida.svg> <grupos.json>");
  componerDoble({ grupos: JSON.parse(readFileSync(rutaGrupos, "utf8")), salida });
}
