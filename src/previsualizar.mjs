// Utilidad opcional: renderiza SVG a PNG para revisarlos a ojo antes de subirlos.
// Uso: node previsualizar.mjs <carpeta-destino> <fichero.svg>...
import { readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const [destino, ...svgs] = process.argv.slice(2);
if (!destino || svgs.length === 0) throw new Error("Uso: node previsualizar.mjs <carpeta-destino> <fichero.svg>...");

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" });
for (const svg of svgs) {
  const [, w, h] = /<svg [^>]*?width="([\d.]+)" height="([\d.]+)"/.exec(readFileSync(svg, "utf8"));
  const page = await browser.newPage({ viewport: { width: Math.ceil(w), height: Math.ceil(h) } });
  await page.goto(pathToFileURL(resolve(svg)).href);
  await page.screenshot({ path: join(destino, basename(svg, ".svg") + ".png") });
  await page.close();
}
await browser.close();
