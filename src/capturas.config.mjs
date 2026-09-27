// Configuración de EJEMPLO: define qué pantallas capturar y cómo llegar a cada una.
// Es la que se usó para las capturas de este repositorio (app "BiblioTech Web"); cada equipo debe
// adaptarla a su propia aplicación: URL, rutas, sesión, selectores y pantallas.
//
// La aplicación (y su backend) tiene que estar YA en marcha en `baseUrl` antes de ejecutar el script.
//
// Idioma de las capturas: variable IDIOMA = "en" (por defecto, las del README) o "es".
// Cambia el idioma de la interfaz de la app, el `locale` del navegador, el filtro que se aplica
// (los datos del backend también deben estar en ese idioma) y los títulos accesibles de los SVG.

const APP = process.env.BASE_URL ?? "http://localhost:3000";
const AUTH = process.env.AUTH_URL ?? "http://localhost:9000";
const IDIOMA = process.env.IDIOMA === "es" ? "es" : "en";

// Textos que dependen del idioma: categoría por la que se filtra y títulos accesibles (<title>) de los SVG
const TXT = {
  en: {
    locale: "en-US",
    categoria: "Novel",
    portada: "BiblioTech: main screen on desktop and mobile",
    principal: "Main screen: catalogue",
    login: "Log in",
    catalogo: "Catalogue filtered by category",
    prestamos: "My loans",
    admin: "User administration",
    detalle: "Book detail and loan request",
  },
  es: {
    locale: "es-ES",
    categoria: "Novela",
    portada: "BiblioTech: pantalla principal en escritorio y en móvil",
    principal: "Pantalla principal: catálogo",
    login: "Inicio de sesión",
    catalogo: "Catálogo filtrado por categoría",
    prestamos: "Mis préstamos",
    admin: "Administración de usuarios",
    detalle: "Detalle de libro y solicitud de préstamo",
  },
}[IDIOMA];

// Cuentas de prueba (las del apartado "Datos de ejemplo" del README del backend)
const CUENTAS = {
  user1: { email: "user1@example.com", password: "user123!" },
  admin: { email: "admin@bibliotech.es", password: "admin123!" },
};

/** Inicia sesión contra el servicio de autenticación y devuelve el JWT. */
async function token(cuenta) {
  const r = await fetch(`${AUTH}/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(CUENTAS[cuenta]),
  });
  if (!r.ok) throw new Error(`Login de "${cuenta}" fallido (${r.status}): ¿está arrancado el servicio de autenticación?`);
  return (await r.json()).token;
}

export default {
  baseUrl: APP,
  locale: TXT.locale,

  // Selector que indica "la vista ya está pintada" (si falta, basta con que exista <body>).
  // En esta app el router pone data-listo en <body> al terminar de renderizar cada vista.
  listo: "body[data-listo]",

  // Tamaños de ventana. Se necesitan estos dos nombres si hay `principal` (portada).
  dispositivos: {
    escritorio: { w: 1280, h: 800 },
    movil: { w: 390, h: 844 },
  },

  // Antes de cada pantalla: se fija el idioma de la app y, si la pantalla lo pide, se deja la sesión
  // iniciada guardando el JWT donde lo busque la app (aquí, en localStorage).
  async preparar(contexto, pantalla) {
    await contexto.addInitScript((idioma) => localStorage.setItem("bibliotech.idioma", idioma), IDIOMA);
    if (!pantalla.cuenta) return;
    await contexto.addInitScript((t) => localStorage.setItem("bibliotech.token", t), await token(pantalla.cuenta));
  },

  // Antes de cada dispositivo. Si alguna acción modifica datos (p. ej. solicitar un préstamo),
  // reinicia aquí el backend para que escritorio y móvil muestren lo mismo.
  async antesDeDispositivo(_nombre) {},

  // Pantalla principal: solo se usa para componer la portada del README (no genera fichero suelto).
  principal: { id: "catalogo", ruta: "#/catalogo", cuenta: "user1", titulo: TXT.principal },
  portada: { fichero: "hero-bibliotech.svg", url: "localhost:3000/#/catalogo", titulo: TXT.portada },

  // Cada pantalla genera img/captura-<id>-escritorio.svg y img/captura-<id>-movil.svg.
  // `accion` (opcional) interactúa con la página antes de capturar.
  pantallas: [
    { id: "login", ruta: "#/login", cuenta: null, titulo: TXT.login },
    {
      id: "catalogo-filtros", ruta: "#/catalogo", cuenta: "user1", titulo: TXT.catalogo,
      async accion(page) {
        await page.selectOption("#filtro-categoria", TXT.categoria);
        await page.waitForSelector(`#lista-libros[data-estado="${TXT.categoria}||0"]`);
      },
    },
    { id: "mis-prestamos", ruta: "#/mis-prestamos", cuenta: "user1", titulo: TXT.prestamos },
    { id: "admin-usuarios", ruta: "#/admin/usuarios", cuenta: "admin", titulo: TXT.admin },
    {
      // Esta acción escribe datos en el backend: va la última de la lista.
      id: "detalle-prestamo", ruta: "#/libro/4", cuenta: "user1", titulo: TXT.detalle,
      async accion(page) {
        await page.click("#btnSolicitar");
        await page.waitForSelector("#mensaje .alert-success");
      },
    },
  ],
};
