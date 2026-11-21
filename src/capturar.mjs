// Genera capturas de pantalla VECTORIALES (SVG) de una aplicación web que ya esté en marcha.
//
//   Chrome (Playwright) --> PDF (texto, iconos y formas siguen siendo vectores) --> SVG (pdftocairo)
//
// Uso:  node capturar.mjs [config] [carpeta-salida]
//   config           por defecto, ./capturas.config.mjs (ver ese fichero: define las pantallas)
//   carpeta-salida   por defecto, ../img
//
// Si la config define `principal`, además compone la portada (hero-bibliotech.svg) con la pantalla
// principal en escritorio y en móvil. Si define `heroDoble`, compone además la portada doble (dos frontends,
// cada uno con su ventana de escritorio y su móvil). Requisitos y detalles: ver README.md de esta carpeta.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import { componer } from "./componer.mjs";
import { componerDoble } from "./componer-doble.mjs";

const AQUI = fileURLToPath(new URL(".", import.meta.url));
const [rutaConfig, rutaSalida] = process.argv.slice(2);
const config = (await import(pathToFileURL(rutaConfig ? resolve(rutaConfig) : join(AQUI, "capturas.config.mjs")).href)).default;
const SALIDA = rutaSalida ? resolve(rutaSalida) : join(AQUI, "..", "img");
const PREFIJO = config.prefijo ?? "captura-";

// Chrome exporta a PDF las sombras con desenfoque (box-shadow) como bitmap, y el SVG dejaría de ser
// 100 % vectorial. Se anulan (las clases de Bootstrap usan !important, por eso se nombran una a una).
const SIN_SOMBRAS = ".shadow-sm, .shadow, .shadow-lg, .card, .btn, .form-control { box-shadow: none !important; }";

/**
 * PDF de la primera página -> SVG con tamaño en px, título accesible y comprobación anti-bitmap.
 * Si el PDF se imprimió en una página más alta que la ventana (`altoImpresion`), el SVG se recorta a la
 * zona visible (w x h); `permitirImagenes` desactiva la comprobación anti-bitmap.
 */
function pdfASvg(pdf, destino, { w, h, titulo, altoImpresion = h, permitirImagenes = false }) {
  execFileSync(process.env.PDFTOCAIRO ?? "pdftocairo", ["-svg", "-f", "1", "-l", "1", pdf, destino]);
  let svg = readFileSync(destino, "utf8");
  if (altoImpresion !== h) {
    svg = svg.replace(/(<svg [^>]*?viewBox=")([^"]+)(")/, (m, antes, vb, despues) => {
      const [x, y, vw, vh] = vb.trim().split(/\s+/).map(Number);
      return `${antes}${x} ${y} ${vw} ${+((vh * h) / altoImpresion).toFixed(2)}${despues}`;
    });
  }
  svg = svg.replace(/<svg ([^>]*?)width="[^"]*" height="[^"]*"/, `<svg role="img" aria-label="${titulo}" $1width="${w}" height="${h}"`);
  svg = svg.replace(/(<svg [^>]*>)/, `$1\n<title>${titulo}</title>`);
  if (!permitirImagenes && /<image\b|data:image/.test(svg)) {
    throw new Error(`El SVG contiene imágenes rasterizadas (¿sombras, filtros u opacidades?): ${destino}`);
  }
  writeFileSync(destino, svg);
}

/**
 * pdftocairo guarda los bitmaps como PNG sin pérdida y el SVG se hincha. Se reconvierten a JPEG (y se reducen)
 * los PNG grandes y opacos, usando el propio Chrome (canvas); los pequeños o con transparencia no se tocan.
 * Los atributos width/height de <image> no cambian, así que el SVG se ve igual.
 */
async function reducirImagenes(browser, ruta, { anchoMax = 700, calidad = 0.82, minPixeles = 40000 } = {}) {
  let svg = readFileSync(ruta, "utf8");
  const uris = [...new Set(svg.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/g) ?? [])];
  if (!uris.length) return;
  const page = await browser.newPage();
  const nuevas = await page.evaluate(async ({ uris, anchoMax, calidad, minPixeles }) => {
    const salida = [];
    for (const uri of uris) {
      const img = new Image();
      img.src = uri;
      await img.decode();
      if (img.width * img.height < minPixeles) { salida.push(uri); continue; }
      const k = Math.min(1, anchoMax / img.width);
      const lienzo = document.createElement("canvas");
      lienzo.width = Math.round(img.width * k);
      lienzo.height = Math.round(img.height * k);
      const ctx = lienzo.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);
      const px = ctx.getImageData(0, 0, lienzo.width, lienzo.height).data;
      let opaca = true;
      for (let i = 3; i < px.length; i += 4) if (px[i] < 255) { opaca = false; break; }
      const jpg = opaca ? lienzo.toDataURL("image/jpeg", calidad) : uri;
      salida.push(jpg.length < uri.length ? jpg : uri);
    }
    return salida;
  }, { uris, anchoMax, calidad, minPixeles });
  await page.close();
  uris.forEach((uri, i) => { svg = svg.split(uri).join(nuevas[i]); });
  writeFileSync(ruta, svg);
}

async function capturar(browser, tmp, pantalla, nombreDispositivo, dispositivo, destino) {
  const { w, h } = dispositivo;
  // `opcionesContexto` se pasa tal cual a Playwright: p. ej. { ignoreHTTPSErrors: true } para certificados autofirmados
  const contexto = await browser.newContext({ viewport: { width: w, height: h }, locale: config.locale ?? "es-ES", ...config.opcionesContexto });
  await config.preparar?.(contexto, pantalla); // p. ej. iniciar sesión (token en localStorage)
  const page = await contexto.newPage();
  await page.goto(new URL(pantalla.ruta, pantalla.baseUrl ?? config.baseUrl).href); // `baseUrl` por pantalla: p. ej. dos frontends
  await page.waitForSelector(pantalla.listo ?? config.listo ?? "body");
  if (config.esperarImagenes) await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  await pantalla.accion?.(page); // interacciones: filtrar, pulsar un botón...
  await page.evaluate(() => { document.activeElement?.blur(); return document.fonts.ready; });
  await page.waitForTimeout(150);
  await config.antesDeImprimir?.(page, nombreDispositivo, pantalla); // p. ej. ocultar lo que queda fuera del encuadre
  await page.addStyleTag({ content: SIN_SOMBRAS + (config.css ?? "") });
  await page.emulateMedia({ media: "screen" });
  const pdf = join(tmp, `${pantalla.id}-${nombreDispositivo}.pdf`);
  // Chrome no sabe partir ciertos contenedores (flex/grid): los pasa a la página 2 y se perderían. Con
  // `altoImpresion` se imprime en una página más alta que la ventana y el SVG se recorta a la zona visible.
  const altoImpresion = dispositivo.altoImpresion ?? h;
  await page.pdf({ path: pdf, width: `${w}px`, height: `${altoImpresion}px`, printBackground: true, pageRanges: "1",
    margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  pdfASvg(pdf, destino, { w, h, titulo: `${pantalla.titulo} (${nombreDispositivo})`, altoImpresion, permitirImagenes: config.permitirImagenes });
  if (config.permitirImagenes) await reducirImagenes(browser, destino, config.reducirImagenes);
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
    for (const pantalla of config.pantallas ?? []) {
      await capturar(browser, tmp, pantalla, nombre, dispositivo, join(SALIDA, `${PREFIJO}${pantalla.id}-${nombre}.svg`));
    }
    for (const g of config.heroDoble?.grupos ?? []) {
      const pantalla = { id: g.id, ruta: g.ruta ?? "/", titulo: g.titulo, baseUrl: g.baseUrl, listo: g.listo };
      await capturar(browser, tmp, pantalla, nombre, dispositivo, join(tmp, `${g.id}-${nombre}.svg`));
    }
  }
  if (config.heroDoble) {
    componerDoble({
      grupos: config.heroDoble.grupos.map((g) => ({ ...g, escritorio: join(tmp, `${g.id}-escritorio.svg`), movil: join(tmp, `${g.id}-movil.svg`) })),
      salida: join(SALIDA, config.heroDoble.fichero ?? "hero-doble.svg"),
      titulo: config.heroDoble.titulo,
    });
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
