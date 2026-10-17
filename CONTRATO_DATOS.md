## 1. Propósito y Reglas de Gobernanza
Este documento define la estructura de cada entidad compartida (**Usuario**, **Local**, **Producto**, **Pedido**, **Valoración**), con sus campos, tipos de datos, enumeraciones y valores admitidos.
- **Inmutabilidad sin consenso:** Ningún integrante puede modificar unilateralmente los campos ni tipos de las entidades compartidas. Cualquier cambio debe ser acordado por el equipo.
- **Autonomía por historia:** Cada integrante implementa su propia historia (HU-1 a HU-7) consumiendo estas estructuras estandarizadas.
- **Ciclo de vida:** En la **Entrega 1**, los datos se leen y persisten en memoria / `localStorage` vía `datos-semilla.json` y la capa de servicios. En la **Entrega 2**, esta misma estructura define el esquema de la base de datos y la API REST en Node.js + Express.

---

## 2. Entidades Compartidas

### 2.1. Entidad: `Usuario` (HU-1, HU-5)
Representa a cualquier usuario del sistema (comensal, local, administrador).

| Campo | Tipo | Requerido | Descripción / Valores permitidos |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Sí | Identificador único (UUID o formato `usr-xxx`) |
| `rol` | `enum` | Sí | `'visitante'` \| `'comensal'` \| `'local'` \| `'administrador'` |
| `correo` | `string` | Sí | Formato email. Para comensales debe terminar en `@aloe.ulima.edu.pe` o `@ulima.edu.pe` |
| `contrasenaHash` | `string` | Sí | Almacena el hash cifrado de la contraseña (simulado en front para E1) |
| `telefono` | `string` | Sí | Número telefónico de 9 dígitos |
| `nombres` | `string` | Cond. | Nombres del comensal o administrador (requerido si rol es comensal/admin) |
| `apellidos` | `string` | Cond. | Apellidos del comensal o administrador (requerido si rol es comensal/admin) |
| `localId` | `string \| null` | Cond. | ID del local vinculado (requerido si rol es `'local'`) |
| `estadoCuenta` | `enum` | Sí | `'activo'` \| `'bloqueado'` |
| `motivoBloqueo` | `string \| null` | No | Motivo obligatorio registrado cuando el administrador bloquea una cuenta |
| `fechaRegistro` | `string` | Sí | Fecha ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`) |

---

### 2.2. Entidad: `Local` (HU-2, HU-3, HU-5)
Representa a una cafetería o concesionario del campus.

| Campo | Tipo | Requerido | Descripción / Valores permitidos |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Sí | Identificador único (ej. `'loc-central'`, `'loc-jardin'`) |
| `nombreComercial` | `string` | Sí | Nombre de la cafetería (ej. `"Cafetería Central"`) |
| `ruc` | `string` | Sí | RUC de 11 dígitos numéricos |
| `sede` | `string` | Sí | Sede del campus (ej. `"Monterrico"`) |
| `ubicacionCampus` | `string` | Sí | Ubicación física (ej. `"Edificio F2 · piso 1"`) |
| `correo` | `string` | Sí | Correo de contacto del local |
| `telefono` | `string` | Sí | Teléfono o anexo del local |
| `descripcion` | `string` | Sí | Descripción corta de la carta o propuesta gastronómica |
| `logotipo` | `string` | Sí | URL o ruta de imagen del logo |
| `fotografias` | `string[]` | Sí | Galería de fotos del local y ambiente |
| `tiempoEstimadoMin` | `number` | Sí | Tiempo estimado de preparación en minutos (ej. `15`) |
| `estado` | `enum` | Sí | `'abierto'` \| `'suspendido'` \| `'cerrado'` |
| `motivoSuspension` | `string \| null` | No | Razón si el local suspendió recepción de pedidos |
| `horarioAtencion` | `HorarioDia[]` | Sí | Horario por cada día de la semana (Lunes a Domingo) |

#### Estructura: `HorarioDia`
```json
{
  "dia": "lunes", // "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo"
  "abierto": true,
  "horaApertura": "07:30",
  "horaCierre": "19:00"
}
```

---

### 2.3. Entidad: `Categoria` y `Producto` (HU-2, HU-3)
Organización de la carta del local y productos ofertados.

#### Estructura: `Categoria`
| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Sí | ID de la categoría (ej. `'cat-cafes'`) |
| `localId` | `string` | Sí | ID del local al que pertenece |
| `nombre` | `string` | Sí | Nombre (ej. `"Bebidas calientes"`, `"Sándwiches"`) |
| `orden` | `number` | Sí | Posición ordinal para visualización en la carta |

#### Estructura: `Producto`
| Campo | Tipo | Requerido | Descripción / Valores permitidos |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Sí | Identificador del producto (ej. `'prod-001'`) |
| `localId` | `string` | Sí | ID del local propietario |
| `categoriaId` | `string` | Sí | ID de la categoría a la que pertenece |
| `nombre` | `string` | Sí | Nombre del producto (ej. `"Empanada de carne"`) |
| `descripcion` | `string` | Sí | Descripción de ingredientes |
| `precio` | `number` | Sí | Precio en Soles (PEN), flotante positivo (ej. `5.00`) |
| `fotografia` | `string` | Sí | URL de la imagen del producto |
| `tiempoPreparacionMin`| `number` | Sí | Tiempo individual en minutos (ej. `10`) |
| `disponibilidad` | `enum` | Sí | `'disponible'` \| `'agotado_dia'` \| `'retirado'` *(Agotado se atenúa al 50 %)* |
| `gruposOpciones` | `GrupoOpcion[]` | No | Lista de grupos de opciones o agregados configurados |

#### Estructura: `GrupoOpcion` y `OpcionItem`
```json
{
  "id": "grp-pan",
  "nombre": "Tipo de pan",
  "obligatorio": true,
  "tipo": "unica", // "unica" | "multiple"
  "maxSeleccion": 1,
  "opciones": [
    { "id": "opt-frances", "nombre": "Pan francés", "precioAdicional": 0.00 },
    { "id": "opt-ciabatta", "nombre": "Pan ciabatta", "precioAdicional": 0.50 },
    { "id": "opt-integral", "nombre": "Pan integral", "precioAdicional": 0.50 }
  ]
}
```

---

### 2.4. Entidad: `Carrito` (Front-end State / HU-3)
Estado en cliente de la orden antes de ser confirmada.

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :---: | :--- |
| `localId` | `string \| null` | Sí | ID del local activo. Todos los ítems deben pertenecer al mismo local |
| `items` | `CarritoItem[]` | Sí | Lista de ítems seleccionados |
| `subtotal` | `number` | Sí | Sumatoria total de (precio + extras) × cantidad |

#### Estructura: `CarritoItem`
```json
{
  "itemCarritoId": "item-uuid-1",
  "productoId": "prod-001",
  "nombre": "Empanada de carne",
  "precioBase": 5.00,
  "cantidad": 2,
  "opcionesSeleccionadas": [
    { "grupoId": "grp-salsa", "opcionId": "opt-aji", "nombre": "Ají de la casa", "precioAdicional": 0.00 }
  ],
  "nota": "Bien caliente por favor",
  "subtotal": 10.00
}
```

---

### 2.5. Entidad: `Pedido` (HU-4, HU-5)
Representa la orden generada tras la confirmación del comensal.

| Campo | Tipo | Requerido | Descripción / Valores permitidos |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Sí | Identificador interno (UUID) |
| `codigoPedido` | `string` | Sí | Código público visible en tamaño grande (ej. `"PED-4712"`) |
| `comensalId` | `string` | Sí | ID del comensal autenticado |
| `comensalNombre` | `string` | Sí | Nombre y apellido para agilizar entrega en bandeja |
| `localId` | `string` | Sí | ID del local que atiende el pedido |
| `items` | `CarritoItem[]` | Sí | Copia congelada de los productos solicitados con sus opciones |
| `total` | `number` | Sí | Total a pagar en mostrador al recoger |
| `horaRecojo` | `string` | Sí | Franja horaria acordada (formato `"HH:mm"`, ej. `"12:30"`) |
| `fechaPedido` | `string` | Sí | Fecha del pedido (`"YYYY-MM-DD"`) |
| `fechaHoraCreacion` | `string` | Sí | Timestamp ISO 8601 |
| `estado` | `enum` | Sí | Transiciones descritas a continuación |
| `motivoRechazo` | `string \| null` | Cond. | Obligatorio si el local rechaza el pedido |
| `motivoCancelacion`| `string \| null` | Cond. | Registrado si el comensal cancela el pedido |
| `horaEntrega` | `string \| null` | No | Hora en que el local validó el código de entrega |
| `calificado` | `boolean` | Sí | Indica si el comensal ya envió su reseña |

#### Transición de Estados del Pedido:
```
[recibido] ──(local acepta)──> [en_preparacion] ──(local finaliza)──> [listo] ──(contra código)──> [entregado]
    │                                │
    ├──(local rechaza c/motivo)──────┴───────────────> [rechazado]
    │
    └──(comensal cancela dentro de ventana permitida)──> [cancelado]
```
- **Estados válidos:** `'recibido'`, `'en_preparacion'`, `'listo'`, `'entregado'`, `'cancelado'`, `'rechazado'`.

---

## 3. Códigos de Estado y Casos Límite Específicos
1. **Franjas de recojo fuera de horario:** El selector no debe permitir horas posteriores a la hora de cierre del local menos el tiempo de preparación.
2. **Local con recepción suspendida:** Si el local cambia a `'suspendido'`, el comensal no puede confirmar pedidos; el carrito se guarda intacto.
3. **Producto agotado durante compra:** Si un producto del carrito se marca `'agotado_dia'`, el comensal recibe un modal de aviso antes de confirmar para decidir si retira el ítem.
4. **Alerta de pedidos vencidos:** En la bandeja del local (HU-5), un pedido en estado `'listo'` o `'recibido'` cuya `horaRecojo` haya pasado por más de 15 minutos se marca con alerta visual de pedido vencido.
