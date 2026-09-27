<p align="center">
  <img src="/img/26-27-logo.svg" alt="Logo de BiblioTech API" width="320"/>
</p>

<p align="center"><i>Práctica de Tecnologías de Servidor — Sistema de gestión de biblioteca</i></p>

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-b07219?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java 21"/>
  <img src="https://img.shields.io/badge/Spring%20Boot-4.1-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" alt="Spring Boot 4.1"/>
  <img src="https://img.shields.io/badge/Rust-auth%20service-DEA584?style=for-the-badge&logo=rust&logoColor=black" alt="Rust"/>
  <img src="https://img.shields.io/badge/OpenAPI-3-6BA539?style=for-the-badge&logo=openapiinitiative&logoColor=white" alt="OpenAPI 3"/>
  <img src="https://img.shields.io/badge/Maven-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white" alt="Maven"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License"/>
</p>

<p align="center">
  <a href="#arquitectura"><img src="https://img.shields.io/badge/-Arquitectura%20%2F%20Despliegue-4e6eac?style=flat-square"/></a>
  <a href="#modelo-de-datos"><img src="https://img.shields.io/badge/-Modelo%20de%20Datos-4e6eac?style=flat-square"/></a>
  <a href="#instalación-y-puesta-en-marcha"><img src="https://img.shields.io/badge/-Instalación-4e6eac?style=flat-square"/></a>
  <a href="#endpoints-de-ejemplo"><img src="https://img.shields.io/badge/-Endpoints-4e6eac?style=flat-square"/></a>
  <a href="#documentación-de-la-api-openapi--swagger"><img src="https://img.shields.io/badge/-OpenAPI%2FSwagger-4e6eac?style=flat-square"/></a>
  <a href="#seguridad-y-roles"><img src="https://img.shields.io/badge/-Seguridad-4e6eac?style=flat-square"/></a>
  <a href="#pruebas"><img src="https://img.shields.io/badge/-Pruebas-4e6eac?style=flat-square"/></a>
</p>

## Equipo TEW1-01

- [Cristian Augusto](https://github.com/augustocristian) - UO237600@uniovi.es
- [Diego Martin Fernandez](https://github.com/DiegoMfer) - martinfdiego@uniovi.es

## Índice

- [Descripción del proyecto](#descripción-del-proyecto)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Arquitectura](#arquitectura)
- [Modelo de datos](#modelo-de-datos)
- [Requisitos previos](#requisitos-previos)
- [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
- [Endpoints de ejemplo](#endpoints-de-ejemplo)
- [Documentación de la API (OpenAPI / Swagger)](#documentación-de-la-api-openapi--swagger)
- [Seguridad y roles](#seguridad-y-roles)
- [Pruebas](#pruebas)
- [Decisiones de implementación](#decisiones-de-implementación)
- [Licencia](#licencia)

## Descripción del proyecto

> ⚠️ Este README es un **ejemplo** de plantilla para la parte de servidor de la práctica. La arquitectura y el
> modelo de datos que se muestran a continuación son **ficticios** (dominio de una biblioteca), pensados solo para
> ilustrar cómo documentar estas secciones. Cada equipo debe sustituirlos por los reales de su propio proyecto.

**BiblioTech API** es un sistema de gestión de biblioteca que permite administrar usuarios, libros, ejemplares y
préstamos. Se implementa como un conjunto de microservicios (autenticación, usuarios y libros) detrás de un único
punto de entrada (BFF), y expone una API REST documentada con OpenAPI.

- **Registro y login** de usuarios, con emisión de JWT.
- **Consulta del catálogo**: listado y búsqueda de libros por categoría, autor o título, con paginación.
- **Gestión de préstamos**: un usuario puede solicitar el préstamo de un ejemplar disponible y devolverlo.
- **Gestión de ejemplares**: el bibliotecario da de alta ejemplares de un libro y actualiza su estado
  (disponible, prestado, en reparación).
- **Gestión de incidencias**: registro y seguimiento de incidencias sobre un ejemplar (deterioro, pérdida...).
- **Administración de usuarios y categorías**: alta, baja y edición, reservada al rol `ADMIN`.
- **Documentación interactiva** de todos los endpoints vía Swagger UI / OpenAPI.

## Estructura del proyecto

> El backend está repartido en varios módulos independientes: dos microservicios de dominio (`usuarios`,
> `libros`), un Backend For Frontend (`bff`) y el servicio de autenticación (`auth`). Se separan por dominio
> porque el catálogo cambia poco y se lee mucho, mientras que los préstamos se escriben constantemente. Ver
> [Decisiones de implementación](#decisiones-de-implementación) para el porqué del BFF y de `auth`.

```
📁 bibliotech-usuarios/
├── 📦 src/main/java/es/uniovi/bibliotech/usuarios/
│   ├── 📦 controller/
│   ├── 📦 service/
│   ├── 📦 repository/
│   ├── 📦 model/
│   ├── 📦 dto/
│   ├── 📦 config/
│   └── 📦 error/
├── 📦 src/test/java/es/uniovi/bibliotech/usuarios/
│   └── 📦 integration/
└── 📄 pom.xml

📁 bibliotech-libros/            # misma estructura que bibliotech-usuarios
└── 📦 src/main/java/es/uniovi/bibliotech/libros/...

📁 bibliotech-bff/
├── 📦 src/main/java/es/uniovi/bibliotech/bff/
│   ├── 📦 controller/
│   ├── 📦 client/
│   └── 📦 config/
└── 📄 pom.xml

📁 bibliotech-auth/
└── 🦀 src/main.rs
```

- 📦 `controller/` — Controladores REST (capa de presentación)
- 📦 `service/` — Interfaces + `service/impl` con la lógica de negocio (`usuarios` y `libros`)
- 📦 `repository/` — Interfaces Spring Data JPA (`usuarios` y `libros`)
- 📦 `model/` — Entidades JPA (`usuarios` y `libros`)
- 📦 `dto/` — DTOs de entrada/salida por dominio
- 📦 `config/` — Seguridad, configuración de OpenAPI, datos iniciales
- 📦 `error/` — Excepciones de negocio + manejador global (RFC 7807)
- 📦 `client/` — Clientes HTTP del BFF hacia `usuarios` y `libros` (solo en `bibliotech-bff`)
- 📦 `integration/` — Tests de integración (MockMvc / RestTestClient)
- 📄 `pom.xml` — Definición y dependencias Maven (uno por servicio Java)
- 🦀 `main.rs` — Microservicio de autenticación (Rust)

## Arquitectura

Diagrama de arquitectura **de ejemplo**: dos microservicios de dominio (`usuarios`, `libros`, cada uno con su
propia base de datos), un BFF como único punto de entrada para el cliente, y un servicio de autenticación
independiente que emite los JWT.

```mermaid
flowchart TB
    U["🧑 Cliente web / app externa"]

    subgraph AUTH["bibliotech-auth · Rust (Axum)"]
        LOGIN["POST /login · POST /register"]
    end

    subgraph BFFS["bibliotech-bff · Spring Boot"]
        BFF["Enruta y agrega peticiones<br/>Valida el JWT"]
    end

    subgraph USR["bibliotech-usuarios · Spring Boot"]
        direction TB
        CTRLU["Controllers"]
        SERVU["Services"]
        REPOU["Repositories"]
        CTRLU --> SERVU --> REPOU
    end

    subgraph LIB["bibliotech-libros · Spring Boot"]
        direction TB
        CTRLL["Controllers"]
        SERVL["Services"]
        REPOL["Repositories"]
        CTRLL --> SERVL --> REPOL
    end

    DBU[("DB usuarios<br/>H2 en memoria")]
    DBL[("DB libros<br/>H2 en memoria")]

    U -- "1. credenciales" --> LOGIN
    LOGIN -- "2. JWT firmado" --> U
    U -- "3. Authorization: Bearer JWT" --> BFF
    BFF -- "usuarios / préstamos" --> CTRLU
    BFF -- "catálogo / ejemplares" --> CTRLL
    REPOU -- "SQL" --> DBU
    REPOL -- "SQL" --> DBL
```

### Diagrama de despliegue

Diagrama de despliegue **de ejemplo**, sin Docker: cada microservicio Spring Boot se despliega como un `.jar`
autocontenido con su propio contenedor web embebido (Tomcat) y su propia base de datos **H2 en memoria**;
`bibliotech-auth` es un binario Rust independiente. Todos los procesos se ejecutan directamente sobre el mismo
host.

```mermaid
flowchart TB
    CLIENTE["🧑 Cliente web / app externa"]

    subgraph HOST["🖥️ Host de despliegue"]
        AUTH["⚙️ bibliotech-auth<br/>Binario Rust · puerto 9000"]

        subgraph BFFT["🐈 Tomcat embebido"]
            BFF["bibliotech-bff<br/>puerto 8080"]
        end
        subgraph USRT["🐈 Tomcat embebido"]
            USR["bibliotech-usuarios<br/>puerto 8081 (interno)"]
            DBU[("H2 en memoria")]
            USR --- DBU
        end
        subgraph LIBT["🐈 Tomcat embebido"]
            LIB["bibliotech-libros<br/>puerto 8082 (interno)"]
            DBL[("H2 en memoria")]
            LIB --- DBL
        end
    end

    CLIENTE -- "HTTPS :9000<br/>credenciales" --> AUTH
    AUTH -- "JWT" --> CLIENTE
    CLIENTE -- "HTTPS :8080" --> BFF
    BFF --> USR
    BFF --> LIB
    AUTH <-. "X-Internal-Secret" .-> USR
```

- Cada `.jar` de Spring Boot (`bibliotech-usuarios`, `bibliotech-libros`, `bibliotech-bff`) lleva su propio
  contenedor web embebido (Tomcat): no hace falta instalar un servidor de aplicaciones aparte ni desplegar un
  `.war` en él.
- `bibliotech-auth` no usa contenedor web: es un binario Rust que escucha directamente en su puerto.
- `bibliotech-usuarios` y `bibliotech-libros` usan cada uno su propia base de datos **H2 en memoria**: vive
  dentro del mismo proceso Java, así que no hay que instalar ni desplegar ningún gestor de base de datos aparte.
  Al reiniciar el servicio, sus datos se pierden y se vuelven a sembrar (ver
  [Datos de ejemplo](#instalación-y-puesta-en-marcha)).
- Solo los puertos `8080` (BFF) y `9000` (auth) deberían exponerse fuera del host; `bibliotech-usuarios` y
  `bibliotech-libros` deberían quedar accesibles solo desde el propio host (p. ej. mediante el firewall), ya que
  al no usar contenedores Docker no hay aislamiento de red real entre procesos.

## Modelo de datos

Diagrama entidad-relación **de ejemplo** para el dominio de la biblioteca. Al estar repartido en dos
microservicios, cada entidad vive en la base de datos de su servicio: `USUARIO` y `PRESTAMO` en
`bibliotech_usuarios`; `CATEGORIA`, `LIBRO` y `EJEMPLAR` en `bibliotech_libros`. `PRESTAMO` guarda el
`ejemplar_id` como referencia *lógica* (no hay una FK real entre bases de datos distintas).

```mermaid
erDiagram
    USUARIO ||--o{ PRESTAMO : realiza
    CATEGORIA ||--o{ LIBRO : clasifica
    LIBRO ||--o{ EJEMPLAR : tiene
    EJEMPLAR ||--o{ PRESTAMO : "involucra (ref. lógica)"

    USUARIO {
        int id PK
        string nombre
        string email
        string rol
        date fecha_alta
    }
    CATEGORIA {
        int id PK
        string nombre
    }
    LIBRO {
        int id PK
        string titulo
        string autor
        string isbn
        int categoria_id FK
    }
    EJEMPLAR {
        int id PK
        int libro_id FK
        string estado
        string ubicacion
    }
    PRESTAMO {
        int id PK
        int usuario_id FK
        int ejemplar_id "ref. lógica a bibliotech-libros"
        date fecha_prestamo
        date fecha_devolucion
        string estado
    }
```

## Requisitos previos

| Herramienta | Versión | Necesaria para |
|---|---|---|
| JDK | 21+ | Compilar y ejecutar `bibliotech-usuarios`, `bibliotech-libros` y `bibliotech-bff` |
| Maven | 3.9+ | Construir los servicios Java (`mvn`) |
| Rust (`cargo`) | estable | Compilar y ejecutar `bibliotech-auth` |
| PostgreSQL | 17 | Solo si se ejecuta con el perfil `prod` (en `dev` se usa H2 en memoria) |

### Variables de entorno

> ⚠️ Los valores de ejemplo de esta tabla son **solo para desarrollo local**. En un despliegue real se inyectan
> desde el entorno o un gestor de secretos y nunca se versionan.

| Variable | Servicio(s) | Ejemplo (dev) | Descripción |
|---|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `usuarios`, `libros`, `bff` | `dev` | Perfil activo (`dev` → H2 en memoria, `prod` → PostgreSQL) |
| `DB_URL` | `usuarios` | `jdbc:postgresql://localhost:5432/bibliotech_usuarios` | Cadena de conexión a su base de datos |
| `DB_URL` | `libros` | `jdbc:postgresql://localhost:5433/bibliotech_libros` | Cadena de conexión a su base de datos (puerto distinto: misma máquina) |
| `DB_USER` / `DB_PASSWORD` | `usuarios`, `libros` | `bibliotech` / `bibliotech` | Credenciales de la base de datos |
| `JWT_SECRET` | `bff`, `auth` | `secreto-compartido-de-ejemplo` | Clave HS256 compartida para firmar/validar el JWT |
| `INTERNAL_SECRET` | `usuarios`, `auth` | `secreto-interno-de-ejemplo` | Cabecera `X-Internal-Secret` para las llamadas internas de `auth` a `usuarios` |
| `USUARIOS_URL` | `bff` | `http://localhost:8081` | URL del microservicio de usuarios |
| `LIBROS_URL` | `bff` | `http://localhost:8082` | URL del microservicio de libros |
| `BACKEND_URL` | `auth` | `http://localhost:8081` | URL a la que `auth` reenvía las credenciales a validar |

## Instalación y puesta en marcha

### Desarrollo

```bash
git clone https://github.com/usuario/bibliotech-api.git
cd bibliotech-api

# Microservicios de dominio (perfil "dev", con H2 en memoria)
cd bibliotech-usuarios && mvn spring-boot:run
cd bibliotech-libros   && mvn spring-boot:run

# BFF (en otra terminal)
cd bibliotech-bff && mvn spring-boot:run

# Servicio de autenticación, Rust (en otra terminal)
cd bibliotech-auth && cargo run
```

### Empaquetado y despliegue

```bash
# Spring Boot: generar el .jar ejecutable de cada servicio y arrancarlo
cd bibliotech-usuarios && mvn clean package && java -jar target/bibliotech-usuarios-*.jar
cd bibliotech-libros   && mvn clean package && java -jar target/bibliotech-libros-*.jar
cd bibliotech-bff      && mvn clean package && java -jar target/bibliotech-bff-*.jar

# Rust: compilar en modo release y ejecutar el binario
cd bibliotech-auth && cargo build --release && ./target/release/bibliotech-auth
```

El BFF queda disponible en `http://localhost:8080/bibliotech/api/...` y el servicio de autenticación en
`http://localhost:9000`. `bibliotech-usuarios` y `bibliotech-libros` no se exponen directamente: solo el BFF los
consume (ver [Diagrama de despliegue](#diagrama-de-despliegue)).

### Datos de ejemplo

Cada base de datos se siembra automáticamente al arrancar en desarrollo. Credenciales de prueba (**ficticias**):

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | `admin@bibliotech.es` | `admin123!` |
| Bibliotecario | `biblio1@bibliotech.es` | `biblio123!` |
| Usuario | `user1@example.com` … `user5@example.com` | `user123!` |

### Endpoints de ejemplo

Todos los recursos cuelgan de `/bibliotech/api/` y se acceden **a través del BFF** (puerto `8080`), que enruta
internamente a `bibliotech-usuarios` o `bibliotech-libros`. Los endpoints `/login` y `/register` viven en el
servicio de autenticación (puerto `9000`) y no pasan por el BFF.

#### Jerarquía de la API

El diagrama muestra cómo se organizan los recursos, del punto de entrada hacia abajo: cada nivel es un recurso que
**pertenece** al anterior. El color indica el servicio interno que atiende cada ruta (el BFF enruta por prefijo).

```mermaid
flowchart TD
    AUTH["bibliotech-auth<br/>:9000"]
    AUTH --> LOGIN["POST /login"]
    AUTH --> REG["POST /register"]

    API["/bibliotech/api<br/>BFF · :8080"]

    API --> LIBROS["/libros<br/>GET (paginado)"]
    LIBROS --> LIBRO["/libros/{id}<br/>GET"]
    LIBRO --> LIBEJ["/libros/{id}/ejemplares<br/>GET · POST"]

    API --> EJEM["/ejemplares/{id}<br/>GET · PATCH (estado)"]
    EJEM --> INC["/ejemplares/{id}/incidencias<br/>GET · POST"]

    API --> PREST["/prestamos<br/>GET (propios) · POST"]
    PREST --> DEV["/prestamos/{id}/devolucion<br/>POST"]

    API --> USUS["/usuarios<br/>GET · POST"]
    USUS --> USU["/usuarios/{id}<br/>GET · PUT · DELETE"]

    API --> CATS["/categorias<br/>GET · POST · PUT · DELETE"]

    classDef auth fill:#fde7c8,stroke:#d98a1c,color:#3d2a07
    classDef bff fill:#e3e7ee,stroke:#5b6577,color:#1d2433
    classDef libros fill:#d9f0de,stroke:#3f9a55,color:#14301b
    classDef usuarios fill:#dbe6f7,stroke:#4e6eac,color:#14233f
    class AUTH,LOGIN,REG auth
    class API bff
    class LIBROS,LIBRO,LIBEJ,EJEM,INC,CATS libros
    class PREST,DEV,USUS,USU usuarios
```

🟧 `auth` · ⬜ BFF · 🟩 `libros` · 🟦 `usuarios` (un préstamo toca también `libros`: reserva el ejemplar).

Cómo leerlo:

- **Dos raíces independientes.** `/login` y `/register` cuelgan del servicio de autenticación; todo lo demás cuelga
  de `/bibliotech/api` (BFF).
- **Anidar significa "pertenece a"**, igual que en el [modelo de datos](#modelo-de-datos): un libro tiene
  ejemplares (`/libros/{id}/ejemplares`) y un ejemplar tiene incidencias (`/ejemplares/{id}/incidencias`).
- **Como mucho dos niveles de anidamiento.** Para trabajar con un ejemplar concreto se usa su propio recurso
  (`/ejemplares/{id}`) en vez de `/libros/{id}/ejemplares/{id}`, que alargaría la URL sin aportar información.
- **Sustantivos para los recursos, verbo HTTP para la acción.** Incluso la devolución se modela como un
  sub-recurso (`POST /prestamos/{id}/devolucion`) y no como un verbo en la URL (`/devolver`).
- **Qué rol puede usar cada nodo** se explica en [Seguridad y roles](#seguridad-y-roles).

A modo de resumen, algunos de los endpoints del diagrama:

| Método | Endpoint                              | Auth requerida | Servicio interno       | Descripción                             |
|--------|-----------------------------------------|:--------------:|--------------------------|-------------------------------------------|
| POST   | `/login`                                | No             | `auth`                   | Autentica al usuario y devuelve un JWT     |
| GET    | `/bibliotech/api/libros`                | No             | `libros`                 | Lista los libros, con paginación (`?page=&size=&sort=`) |
| POST   | `/bibliotech/api/prestamos`             | Sí (`USUARIO`) | `usuarios` + `libros`    | Registra un préstamo (reserva ejemplar en `libros`, lo anota en `usuarios`) |

El detalle del resto de endpoints del diagrama (parámetros, cuerpos y códigos de respuesta) está en el propio
[Swagger UI](#documentación-de-la-api-openapi--swagger), no aquí.

Las peticiones autenticadas se envían con la cabecera `Authorization: Bearer <token>`, donde `<token>` es el JWT
devuelto por `/login`; el BFF lo valida una vez y lo reenvía a los microservicios internos.

## Documentación de la API (OpenAPI / Swagger)

El BFF documenta automáticamente la API pública a partir de las anotaciones de sus controladores gracias a
[`springdoc-openapi`](https://springdoc.org/), sin necesidad de mantener el contrato a mano:

- **Swagger UI** (interfaz interactiva para probar los endpoints): `http://localhost:8080/swagger-ui.html`
- **Especificación OpenAPI en JSON** (para importar en Postman/Insomnia u otras herramientas):
  `http://localhost:8080/v3/api-docs`

Ambas rutas son públicas y viven en el BFF. `bibliotech-usuarios` y `bibliotech-libros` exponen también su propio
`springdoc-openapi` internamente, útil en desarrollo, pero no se publica al no estar accesibles fuera de la red
interna. Desde Swagger UI se puede pulsar en **Authorize** e introducir el JWT obtenido en `/login` (esquema
`bearer-jwt`) para probar directamente los endpoints protegidos.

## Seguridad y roles

La autenticación se basa en JWT (HS256), firmado por `bibliotech-auth` y validado por `bibliotech-bff` como
recurso OAuth2; el BFF reenvía el JWT (o la identidad ya resuelta) a los microservicios internos en cada llamada.

**Claims del JWT (ejemplo):**

| Claim | Contenido |
|---|---|
| `sub` | Email del usuario |
| `uid` | Id numérico del usuario |
| `roles` | Uno de `USUARIO`, `BIBLIOTECARIO`, `ADMIN` |
| `exp` | Expiración (1 hora) |

**Roles y permisos (ejemplo):**

| Rol | Puede... |
|---|---|
| `USUARIO` | Consultar el catálogo, pedir y devolver préstamos propios |
| `BIBLIOTECARIO` | Gestionar ejemplares, marcar préstamos como devueltos, ver incidencias |
| `ADMIN` | Todo lo anterior + gestionar usuarios y categorías |

## Pruebas

```bash
cd bibliotech-usuarios && mvn verify   # unitarias + integración + cobertura (JaCoCo)
cd ../bibliotech-libros && mvn verify
cd ../bibliotech-bff && mvn verify
```

El informe de cobertura de cada servicio se genera en `<módulo>/target/site/jacoco/index.html`. Las pruebas de
integración (`src/test/java/.../integration`) levantan el contexto de Spring de cada microservicio con una base
H2 en memoria y firman sus propios JWT de prueba con el mismo secreto de desarrollo, sin depender de
`bibliotech-auth` ni del resto de servicios.

## Decisiones de implementación

> Solo se documenta lo que **no** es obvio: el problema, la alternativa descartada y el porqué de la elegida. Lo
> explicado en clase (capas `controller`/`service`/`repository`, JPA + H2, DTOs...) no se repite aquí. A
> continuación, dos decisiones **de ejemplo**.

### 1. Diseño de la API

- **Un único punto de entrada (BFF) bajo `/bibliotech/api/`.** El cliente no conoce `usuarios` ni `libros`: el BFF
  valida el JWT una sola vez, agrega datos de ambos (p. ej. un préstamo con el nombre del usuario y el título del
  libro) y oculta la topología interna. Coste: un salto de red más por petición.
- **URLs que siguen la jerarquía del modelo de datos** (ver [Jerarquía de la API](#jerarquía-de-la-api)): se anida
  solo lo que *pertenece* al recurso padre y, como mucho, a dos niveles; un hijo concreto tiene su propia ruta raíz.
- **Versionado por cabecera** (`X-API-Version`, por defecto `1.0`) en vez de `/v1/...` en la URL: la URL identifica
  el recurso y no cambia nunca; una v2 es un segundo mapping `version = "2.0"` junto al antiguo, sin tocarlo.
- **DTOs, nunca entidades.** El contrato público no depende del modelo JPA: se puede cambiar el esquema (o la
  referencia *lógica* `ejemplar_id` entre bases de datos) sin romper a los clientes.
- **Errores RFC 7807** (`ProblemDetail`): un único formato para todos los servicios; el BFF propaga los cuerpos
  de error tal cual, sin inventar los suyos.
- **Colecciones paginadas** (`?page=&size=&sort=`) desde el principio: añadirlas después rompería el contrato.

| Situación | Código HTTP |
|---|---|
| Recurso inexistente | `404 Not Found` |
| Conflicto (duplicado, estado inválido) | `409 Conflict` |
| Regla de negocio incumplida (p. ej. sin ejemplares disponibles) | `422 Unprocessable Entity` |
| Credenciales inválidas | `401 Unauthorized` |
| Rol insuficiente o recurso ajeno | `403 Forbidden` |

### 2. Servicio de autenticación independiente (Rust)

- **Separado de la API de negocio.** Hace una sola cosa (emitir JWT) con dos endpoints, `/login` y `/register`,
  así que se puede auditar, endurecer y escalar aparte. Por eso queda **fuera** del BFF y de `/bibliotech/api/`:
  las credenciales no atraviesan más servicios de los necesarios.
- **No guarda usuarios.** Reenvía las credenciales a `usuarios` (`BACKEND_URL`) con la cabecera
  `X-Internal-Secret`, de modo que hay una única fuente de verdad. Las contraseñas se almacenan con **Argon2**
  (hash con sal aleatoria), nunca en claro ni en logs, y un fallo de login devuelve siempre un `401` genérico
  (no revela si el usuario existe).
- **JWT HS256 con secreto compartido** (`JWT_SECRET`) entre `auth` y `bff`: lo más simple para el alcance de la
  práctica. Contrapartida: quien valida también podría firmar; en producción se usaría una firma asimétrica
  (RS256/EdDSA) con clave pública en el BFF.
- **El token es un contrato entre servicios.** Los nombres de los *claims* (`sub`, `uid`, `roles`) y el secreto deben
  coincidir en `auth` y `bff`: si se cambian en uno solo, no falla la compilación, simplemente todas las
  peticiones autenticadas pasan a devolver `401`.
- **Caducidad de 1 hora y sin *refresh token***: menos piezas que mantener, a costa de que el usuario deba volver
  a iniciar sesión.

## Licencia

Este proyecto de ejemplo se distribuye bajo licencia [MIT](https://opensource.org/licenses/MIT).

---

<p align="center">
  <img src="/img/logo-epigijon.png" alt="Logo EPI Gijón" width="32" style="vertical-align: middle;"/>
  &nbsp;Tecnologías Web - Grado en Ingeniería Informática de Tecnologías de la Información
</p>
