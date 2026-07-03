# Acero.studio — Asistente de rediseño 

Prototipo de chat web para visualizar el rediseño de interior y fachada de cafeterías. El usuario sube una foto (cámara o galería), elige un estilo, ve una propuesta generada y puede continuar la cotización por WhatsApp.

**Demo en vivo:** `https://TU-USUARIO.github.io/TU-REPO/` *(actualiza este link cuando actives GitHub Pages)*

---

## 📁 Estructura del proyecto

```
├── index.html      → estructura del chat
├── style.css       → estilos (tema blueprint / marca acero.studio)
├── script.js       → lógica del flujo de conversación + integración opcional con Supabase
└── README.md
```

No hay build ni dependencias de instalación: es HTML/CSS/JS plano. Se puede abrir directo con doble clic o servirlo desde cualquier hosting estático.

---

## ▶️ Probarlo localmente

Abre `index.html` en el navegador. Para que la cámara funcione en el celular necesitas HTTPS o `localhost` — abrir el archivo directo (`file://`) puede bloquear el acceso a la cámara en algunos navegadores. Alternativa rápida con Python:

```bash
python3 -m http.server 8000
```

Y entra a `http://localhost:8000`.

---

## 🚀 Publicar en GitHub Pages

1. Crea un repositorio nuevo y sube los 3 archivos (`index.html`, `style.css`, `script.js`) a la raíz.
2. Ve a **Settings → Pages**.
3. En **Source**, selecciona la rama `main` y la carpeta `/root`.
4. Guarda. En 1-2 minutos el sitio queda disponible en:
   `https://tu-usuario.github.io/nombre-del-repo/`

GitHub Pages sirve por HTTPS por defecto, así que el acceso a cámara funcionará correctamente en móvil.

---

## ⚙️ Configuración obligatoria

### Número de WhatsApp
En `script.js`, línea 4:
```javascript
const WHATSAPP_NUMBER = "573001234567"; // código país + número, sin + ni espacios
```

---

## 🧠 Estado actual vs. pendiente

| Función | Estado |
|---|---|
| Subir foto (cámara/galería) | ✅ Funcional |
| Flujo de chat con estados | ✅ Funcional |
| Selección de estilo | ✅ Funcional |
| Redirección a WhatsApp con mensaje precargado | ✅ Funcional |
| Generación real de la propuesta visual (IA) | 🔶 Simulada — hoy solo muestra la misma foto con un efecto de escaneo |
| Guardado de leads en base de datos | 🔶 Preparado, requiere conectar Supabase (ver abajo) |

### Conectar generación real de imágenes
En `script.js`, dentro de `onStyleChosen()`, el `setTimeout` que simula la espera es el lugar donde debe ir la llamada real a tu proveedor de generación (ej. Replicate, Stability AI, o tu propio backend con Stable Diffusion + ControlNet), enviando la imagen subida y el estilo elegido, y reemplazando `uploadedImageURL` con la imagen resultante antes de llamar a `showResult()`.

---

## 🗄️ Conectar Supabase (base de datos + storage)

### 1. Crea el proyecto
En [supabase.com](https://supabase.com) → **New Project**. Del panel guarda:
- **Project URL**
- **anon public key**
(están en **Settings → API**)

### 2. Crea el bucket de Storage
**Storage → New bucket** → nombre: `fotos-cafeterias` → márcalo como **público**.

### 3. Crea la tabla `leads`
En **SQL Editor**, ejecuta:

```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  estilo text not null,
  imagen_url text,
  telefono text,
  nombre_cafeteria text,
  ciudad text,
  notas text,
  estado text default 'nuevo', -- nuevo | contactado | cotizado | cerrado
  creado_en timestamp with time zone default now()
);

alter table leads enable row level security;

create policy "Cualquiera puede crear un lead"
on leads for insert
to anon
with check (true);
```

> La policy de `select` no está incluida a propósito: sin ella, nadie puede leer los leads desde el frontend público, solo desde el panel de Supabase (con tu login) o desde un backend con la `service_role key`. Si más adelante haces un dashboard con autenticación, ahí agregas una policy de `select` restringida a usuarios logueados.

### 4. Conecta el frontend

En `index.html`, agrega esta línea **antes** de `<script src="script.js">`:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

En `script.js`, busca el bloque comentado al inicio del archivo (`SUPABASE (opcional)`) y descomenta/completa:
```javascript
const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
const SUPABASE_ANON_KEY = "TU-ANON-KEY";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

Luego, al final del archivo, descomenta la función `saveLeadToSupabase(...)`, y en la función `showResult()` descomenta la línea:
```javascript
saveLeadToSupabase({ style, imageFile: uploadedFile });
```

Con esto, cada vez que un usuario termine el flujo (foto + estilo elegido), la foto se sube al bucket y el lead se guarda en la tabla `leads`, visible desde **Table Editor** en el panel de Supabase.

---

## 🔒 Nota de privacidad

No es posible adjuntar automáticamente la foto o la propuesta al chat de WhatsApp desde una página web — es una restricción de WhatsApp, no de este proyecto. El botón abre WhatsApp con el mensaje de texto ya escrito; la persona debe adjuntar la imagen manualmente dentro de la conversación.

---

## 🎨 Personalización rápida

- **Estilos disponibles:** array `STYLES` en `script.js`
- **Colores/tipografías:** variables CSS en la parte superior de `style.css` (`:root`)
- **Textos del asistente:** directamente en las funciones `start()`, `onImageSelected()`, `onStyleChosen()`, `showResult()` en `script.js`
