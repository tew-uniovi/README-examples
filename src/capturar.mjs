// Genera capturas de pantalla VECTORIALES (SVG) de una aplicación web que ya esté en marcha.
//
//   Chrome (Playwright) --> PDF (texto, iconos y formas siguen siendo vectores) --> SVG (pdftocairo)
//
// Uso:  node capturar.mjs [config] [carpeta-salida]
//   config           por defecto, ./capturas.config.mjs (ver ese fichero: define las pantallas)
//   carpeta-salida   por defecto, ../img
//
// Si la config define `principal`, además compone la portada (hero-bibliotech.svg) con la pantalla
// principal en escritorio y en móvil. Requisitos y detalles: ver README.md de esta carpeta.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import { componer } from "./componer.mjs";

const AQUI = fileURLToPath(new URL(".", import.meta.url));
const [rutaConfig, rutaSalida] = process.argv.slice(2);
const config = (await import(pathToFileURL(rutaConfig ? resolve(rutaConfig) : join(AQUI, "capturas.config.mjs")).href)).default;
const SALIDA = rutaSalida ? resolve(rutaSalida) : join(AQUI, "..", "img");
const PREFIJO = config.prefijo ?? "captura-";

// Chrome exporta a PDF las sombras con desenfoque (box-shadow) como bitmap, y el SVG dejaría de ser
// 100 % vectorial. Se anulan (las clases de Bootstrap usan !important, por eso se nombran una a una).
const SIN_SOMBRAS = ".shadow-sm, .shadow, .shadow-lg, .card, .btn, .form-control { box-shadow: none !important; }";

/** PDF de la primera página -> SVG con tamaño en px, título accesible y comprobación anti-bitmap. */
function pdfASvg(pdf, destino, { w, h, titulo }) {
  execFileSync(process.env.PDFTOCAIRO ?? "pdftocairo", ["-svg", "-f", "1", "-l", "1", pdf, destino]);
  let svg = readFileSync(destino, "utf8");
  svg = svg.replace(/<svg ([^>]*?)width="[^"]*" height="[^"]*"/, `<svg role="img" aria-label="${titulo}" $1width="${w}" height="${h}"`);
  svg = svg.replace(/(<svg [^>]*>)/, `$1\n<title>${titulo}</title>`);
  if (/<image\b|data:image/.test(svg)) {
    throw new Error(`El SVG contiene imágenes rasterizadas (¿sombras, filtros u opacidades?): ${destino}`);
  }
  writeFileSync(destino, svg);
}

async function capturar(browser, tmp, pantalla, nombreDispositivo, { w, h }, destino) {
  const contexto = await browser.newContext({ viewport: { width: w, height: h }, locale: config.locale ?? "es-ES" });
  await config.preparar?.(contexto, pantalla); // p. ej. iniciar sesión (token en localStorage)
  const page = await contexto.newPage();
  await page.goto(new URL(pantalla.ruta, config.baseUrl).href);
  await page.waitForSelector(config.listo ?? "body");
  await pantalla.accion?.(page); // interacciones: filtrar, pulsar un botón...
  await page.evaluate(() => { document.activeElement?.blur(); return document.fonts.ready; });
  await page.waitForTimeout(150);
  await page.addStyleTag({ content: SIN_SOMBRAS + (config.css ?? "") });
  await page.emulateMedia({ media: "screen" });
  const pdf = join(tmp, `${pantalla.id}-${nombreDispositivo}.pdf`);
  await page.pdf({ path: pdf, width: `${w}px`, height: `${h}px`, printBackground: true, pageRanges: "1",
    margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  pdfASvg(pdf, destino, { w, h, titulo: `${pantalla.titulo} (${nombreDispositivo})` });
  await contexto.close();
  console.log("✔", destino);
}

mkdirSync(SALIDA, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), "capturas-"));
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" });
try {
  for (const [nombre, dispositivo] of Object.entries(config.dispositivos)) {
    await config.antesDeDispositivo?.(nombre); // p. ej. reiniciar los datos si alguna acción los modifica
    if (config.principal) {
      await capturar(browser, tmp, config.principal, nombre, dispositivo, join(tmp, `principal-${nombre}.svg`));
    }
    for (const pantalla of config.pantallas) {
      await capturar(browser, tmp, pantalla, nombre, dispositivo, join(SALIDA, `${PREFIJO}${pantalla.id}-${nombre}.svg`));
    }
  }
  if (config.principal) {
    componer({
      escritorio: join(tmp, "principal-escritorio.svg"),
      movil: join(tmp, "principal-movil.svg"),
      salida: join(SALIDA, config.portada?.fichero ?? "hero-bibliotech.svg"),
      url: config.portada?.url,
      titulo: config.portada?.titulo,
    });
  }
} finally {
  await browser.close();
  rmSync(tmp, { recursive: true, force: true });
}
