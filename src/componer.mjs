// Compone la portada del README: ventana de navegador (escritorio) + teléfono (móvil), incrustando
// los dos SVG de la pantalla principal como vectores (sin bitmaps). Lo usa capturar.mjs, pero
// también se puede ejecutar a mano:
//   node componer.mjs <principal-escritorio.svg> <principal-movil.svg> <salida.svg> ["localhost:3000/#/catalogo"]
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const FUENTE = "system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Tamaño en px (atributos width/height de la raíz) de un SVG generado por capturar.mjs. */
const tamano = (svg) => {
  const [, w, h] = /<svg [^>]*?width="([\d.]+)" height="([\d.]+)"/.exec(svg);
  return { w: Number(w), h: Number(h) };
};

/** Contenido de un SVG con sus id prefijados (para que no choquen al juntar varios en uno). */
export function incrustar(svg, prefijo, x, y, ancho, alto) {
  const viewBox = /viewBox="([^"]+)"/.exec(svg)[1];
  const cuerpo = svg
    .replace(/^[\s\S]*?<svg [^>]*>/, "")
    .replace(/<\/svg>\s*$/, "")
    .replace(/<title>[\s\S]*?<\/title>/, "");
  const ids = new Set([...cuerpo.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]));
  const unico = cuerpo.replace(/( id="|href="#|url\(#)([^"')]+)/g, (m, pre, id) => (ids.has(id) ? pre + prefijo + id : m));
  return `<svg x="${x}" y="${y}" width="${ancho}" height="${alto}" viewBox="${viewBox}">${unico}</svg>`;
}

export function componer({ escritorio, movil, salida, url = "localhost:3000/", titulo = "Pantalla principal en escritorio y en móvil" }) {
  const svgE = readFileSync(escritorio, "utf8");
  const svgM = readFileSync(movil, "utf8");
  const e = tamano(svgE), m = tamano(svgM);

  const W = 1200, H = 700;
  const S = 0.66; // escala de las capturas dentro de la composición
  const vx = 56, vy = 56, vw = e.w * S, vh = e.h * S, barra = 40; // ventana de navegador
  const marco = 12, tw = m.w * S, th = m.h * S, tx = 860, ty = 66; // teléfono

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
  <clipPath id="recorte-ventana"><rect x="${vx}" y="${vy}" width="${vw}" height="${vh + barra}" rx="12"/></clipPath>
  <clipPath id="recorte-pantalla"><rect x="${tx + marco}" y="${ty + marco}" width="${tw}" height="${th}" rx="28"/></clipPath>
</defs>

<rect width="${W}" height="${H}" rx="28" fill="url(#fondo)"/>

<!-- Ventana de navegador -->
<rect x="${vx}" y="${vy}" width="${vw}" height="${vh + barra}" rx="12" fill="#ffffff" filter="url(#sombra)"/>
<g clip-path="url(#recorte-ventana)">
  <rect x="${vx}" y="${vy}" width="${vw}" height="${barra}" fill="#e9edf5"/>
  <circle cx="${vx + 22}" cy="${vy + barra / 2}" r="6" fill="#ff5f57"/>
  <circle cx="${vx + 42}" cy="${vy + barra / 2}" r="6" fill="#febc2e"/>
  <circle cx="${vx + 62}" cy="${vy + barra / 2}" r="6" fill="#28c840"/>
  <rect x="${vx + 92}" y="${vy + 8}" width="${vw - 92 - 24}" height="${barra - 16}" rx="12" fill="#ffffff"/>
  <text x="${vx + 112}" y="${vy + barra / 2 + 4.5}" font-family="${FUENTE}" font-size="13" fill="#5b6577">${url}</text>
  ${incrustar(svgE, "e-", vx, vy + barra, vw, vh)}
</g>
<rect x="${vx}" y="${vy}" width="${vw}" height="${vh + barra}" rx="12" fill="none" stroke="#c3cde2"/>

<!-- Teléfono -->
<rect x="${tx}" y="${ty}" width="${tw + marco * 2}" height="${th + marco * 2}" rx="40" fill="#1d2433" filter="url(#sombra)"/>
<g clip-path="url(#recorte-pantalla)">
  ${incrustar(svgM, "m-", tx + marco, ty + marco, tw, th)}
</g>
</svg>
`;
  writeFileSync(salida, svg);
  console.log("✔", salida);
}

// Ejecución directa por línea de comandos
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [escritorio, movil, salida, url] = process.argv.slice(2);
  if (!salida) throw new Error("Uso: node componer.mjs <escritorio.svg> <movil.svg> <salida.svg> [url]");
  componer({ escritorio, movil, salida, url });
}
