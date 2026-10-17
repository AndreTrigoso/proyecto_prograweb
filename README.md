# Sistema de Pedidos Anticipados en Cafeterías del Campus (Tema 8)
**Asignatura:** Programación Web · Universidad de Lima  
**Periodo Académico:** 2026-2  
**Tecnologías:** React, Hooks, Context API, CSS Propio (Design Tokens), Vite, Node.js + Express (E2).

---

## Estado de los Prerrequisitos del Proyecto (Sección 9 del PDF)

Conforme a lo especificado en la sección **"Cómo evitar bloquearse entre ustedes"** del documento oficial de especificaciones y en los **Mockups de Alta Fidelidad**, se han establecido todos los prerrequisitos:

1. **Contrato de Datos (`CONTRATO_DATOS.md`):**
   - Especificación formal y acordada de las entidades compartidas: `Usuario`, `Local`, `Categoria`, `Producto`, `Carrito`, `Pedido` y `Valoracion`.
   - Incluye tipos de datos, enumeraciones, estados permitidos y reglas de negocio (ej. un solo local por pedido, motivo obligatorio en rechazos/bloqueos, atenuación al 50% de productos agotados).

2. **Datos Semilla (`datos-semilla.json` y `src/data/seeds.json`):**
   - Archivo JSON con datos completos de prueba para todos los roles (visitante, comensales, concesionarios y administrador).
   - Casos límite cubiertos: locales abiertos, cerrados y suspendidos; productos disponibles, agotados del día y retirados; pedidos recibidos, en preparación, listos, entregados, cancelados por comensal, rechazados con motivo por local y pedidos vencidos (>15 min).

3. **Sistema de Diseño (Tokens CSS según Mockup):**
   - Paleta oficial: Primary (`#D6402F`), Accent (`#5B9B2E`), Surface (`#FFFFFF`), Bg (`#FFFBF8`), Danger (`#B4322B`), etc.
   - Tipografía: **Poppins** (títulos y precios) + **Inter** (cuerpo de texto, ayudas y etiquetas).
   - Medidas estándar: Botones de altura mínima 44px, radios 12px/16px/999px (chips), sombra cálida `0 2px 12px rgba(38,25,21,.10)`.

4. **Componentes Comunes Compartidos (`src/components/common/`):**
   - `Header`: Adaptable por rol (visitante, comensal con selector de local y carrito, local y admin en cabecera oscura con conmutador de estado).
   - `Navigation` / `ComensalTabs`: Pestañas comensal (*Locales*, *Mis pedidos*, *Mis calificaciones*) con soporte para migas de pan.
   - `Sidebar`: Panel lateral fijo de 280px con los 3 grupos requeridos por el Mockup para Local y Admin.
   - `ProductCard`: Tarjeta con fotografía a sangre, precio grande en Poppins 600, badge de disponibilidad y atenuación automática al 50% para productos agotados.
   - `CartSummary` & `CartDrawer`: Resumen con edición de cantidades (+/-), notas por ítem, subtotal en tiempo real y detección de conflictos entre locales.
   - `StatusBadge`: Chips circulares de estado para pedidos, locales y disponibilidad.
   - `ConfirmModal`: Modal para acciones destructivas y recolección de motivos obligatorios.
   - `EmptyState`: Componente para estados vacíos en cualquier vista sin datos.
   - `NotificationToast`: Feedback visual de confirmación para toda operación de escritura.

5. **Capa de Abstracción de Datos / Servicios (`src/services/storageService.js`):**
   - Inicializa y sincroniza con `localStorage`.
   - Separa la capa de almacenamiento de los componentes React, garantizando que en la Entrega 2 el cambio a endpoints REST de Node.js + Express sea directo sin tocar la interfaz.

6. **Guía de Ramas y Git (`GIT_WORKFLOW.md`):**
   - Estándares de trabajo colaborativo, ramas por historia (`feature/hu...`) y revisión por Pull Requests.

---

## Cómo Ejecutar el Proyecto Localmente

### 1. Clonar el repositorio y acceder a la carpeta:
```bash
git clone https://github.com/AndreTrigoso/proyecto_prograweb.git
cd proyecto_prograweb
```

### 2. Instalar dependencias:
```bash
npm install
```

### 3. Iniciar el servidor de desarrollo Vite:
```bash
npm run dev
```
La aplicación abrirá automáticamente en tu navegador en `http://localhost:3000`.

### 4. Compilar para producción:
```bash
npm run build
```

---

## Historias de Usuario Asignadas por Integrante

| Historia | Rol | Alcance | Responsable |
| :--- | :--- | :--- | :--- |
| **HU-1** | Visitante / Comensal | Cuenta y acceso (registro comensal/local, login, cambio contraseña) | Integrante 1 |
| **HU-2** | Local | Perfil del local, horario y mantenimiento de la carta de productos | Integrante 2 |
| **HU-3** | Comensal | Catálogo, carta de locales, filtros, detalle con agregados y carrito | Integrante 3 |
| **HU-4** | Comensal | Confirmación de pedido, hora de recojo, código PED-XXXX y Mis pedidos | Integrante 4 |
| **HU-5** | Local | Bandeja de pedidos por hora, cambio de estado, entrega y rechazo | Integrante 5 |


---

## Estructura del Proyecto

```
proyecto_prograweb/
├── CONTRATO_DATOS.md          # Especificación formal de entidades compartidas
├── GIT_WORKFLOW.md            # Guía de ramas y Pull Requests
├── datos-semilla.json         # Datos iniciales para pruebas locales
├── .env.example               # Plantilla de variables de entorno
├── index.html                 # HTML raíz con fuentes Poppins e Inter
├── package.json               # Dependencias (React, Vite, Lucide-react)
├── vite.config.js             # Configuración del empaquetador Vite
└── src/
    ├── main.jsx               # Punto de entrada de la aplicación React
    ├── App.jsx                # Layout principal y orquestación de contextos
    ├── data/
    │   └── seeds.json         # Copia de datos semilla para importación directa
    ├── styles/
    │   ├── design-tokens.css  # Variables CSS oficiales del Mockup
    │   └── global.css         # Reset, layout, formularios y utilidades
    ├── services/
    │   └── storageService.js  # Capa de acceso a datos desacoplada (localStorage)
    ├── context/
    │   ├── AuthContext.jsx    # Manejo de sesión y roles (visitante, comensal, local, admin)
    │   ├── CartContext.jsx    # Estado del carrito, cantidades, notas y validaciones
    │   └── DataContext.jsx    # Estado reactivo global de entidades
    └── components/
        ├── common/            # Módulo de componentes comunes obligatorios (Sección 9)
        │   ├── Header.jsx
        │   ├── Navigation.jsx
        │   ├── Sidebar.jsx
        │   ├── ProductCard.jsx
        │   ├── CartSummary.jsx
        │   ├── CartDrawer.jsx
        │   ├── StatusBadge.jsx
        │   ├── ConfirmModal.jsx
        │   ├── EmptyState.jsx
        │   ├── NotificationToast.jsx
        │   ├── Footer.jsx
        │   └── index.js
        └── dev/
            └── PrerequisitesShowcase.jsx  # Panel interactivo de verificación
```
