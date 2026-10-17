# Flujo de Trabajo y Control de Versiones con Git
**Asignatura:** Programación Web · Universidad de Lima · Ciclo 2026-2  
**Tema 8:** Pedidos anticipados en cafeterías del campus

---

## 1. Lineamientos Generales (Sección 9 del PDF)
> *"Repositorio: Uno solo, con una rama por integrante e integración mediante pull requests revisados por otro miembro. El historial de contribuciones es evidencia de participación individual y se considera en la evaluación."*

Para asegurar la trazabilidad y la evaluación individual de cada miembro del equipo:
1. **Nunca hacer push directo a la rama `main`**.
2. Toda nueva funcionalidad o corrección se realiza en su propia rama de trabajo (`feature/...`).
3. La integración a `main` se realiza **únicamente mediante Pull Requests (PR)**, los cuales deben ser revisados y aprobados por al menos otro integrante del equipo.
4. **No subir credenciales ni claves privadas:** Todas las variables sensibles se gestionan en `.env` (el archivo `.gitignore` ya está configurado).

---

## 2. Convención de Ramas por Integrante e Historia
Cada integrante trabajará en una rama nombrada según la historia que le fue asignada:

| Historia | Responsable sugerido | Nombre de rama recomendado |
| :--- | :--- | :--- |
| **HU-1** | Integrante 1 | `feature/hu1-cuenta-y-acceso` |
| **HU-2** | Integrante 2 | `feature/hu2-local-y-carta` |
| **HU-3** | Integrante 3 | `feature/hu3-catalogo-y-carrito` |
| **HU-4** | Integrante 4 | `feature/hu4-pedidos-comensal` |
| **HU-5** | Integrante 5 | `feature/hu5-bandeja-del-local` |

---

## 3. Flujo Paso a Paso para Desarrollar una Historia

### Paso 1: Actualizar la rama `main`
Antes de comenzar a trabajar o crear una rama, asegúrate de tener los últimos cambios integrados:
```bash
git checkout main
git pull origin main
```

### Paso 2: Crear tu rama de trabajo
```bash
git checkout -b feature/hu1-cuenta-y-acceso
```

### Paso 3: Realizar commits frecuentes y atómicos
Usa mensajes de commit claros y descriptivos en español:
```bash
git add .
git commit -m "feat(hu1): implementar formulario de registro de comensal con validacion de correo institucional"
```

### Paso 4: Subir tu rama al repositorio remoto
```bash
git push -u origin feature/hu1-cuenta-y-acceso
```

### Paso 5: Abrir un Pull Request (PR) en GitHub
1. Entra a GitHub y presiona **"Compare & pull request"**.
2. Asigna como revisor (*Reviewer*) a otro miembro del equipo.
3. Describe los cambios realizados, las vistas agregadas y las pruebas hechas.
4. Una vez aprobado, realizar **Squash & Merge** o **Merge Pull Request**.

---

## 4. Requerimientos No Funcionales Clave a Verificar en Cada PR
- [ ] La interfaz es responsive y los estilos usan las variables de `design-tokens.css`.
- [ ] Los formularios validan lo ingresado y muestran el error junto al campo correspondiente.
- [ ] Toda acción destructiva (ej. cancelar pedido, rechazar) solicita confirmación mediante `ConfirmModal`.
- [ ] Toda operación de escritura notifica su resultado al usuario (`NotificationToast`).
- [ ] Toda vista que pueda quedar sin elementos incluye su estado vacío (`EmptyState`).
- [ ] No hay llamadas directas ni consultas de base de datos dentro de los componentes visuales (usar la capa de servicios en `src/services/`).
