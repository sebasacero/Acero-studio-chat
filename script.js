
/* ============================================================
   CONFIG — edita aquí el número de WhatsApp (código país + número, sin + ni espacios)
============================================================ */
const WHATSAPP_NUMBER = "573001234567";

/* ============================================================
   SCROLLYTELLING — activa cada paso al entrar en pantalla
   y actualiza los puntos de progreso (solo visibles en desktop)
============================================================ */
(function initStoryScroll(){
  const steps = document.querySelectorAll('.story-step');
  const dots = document.querySelectorAll('.p-dot');
  if(!steps.length) return;

  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        const n = entry.target.dataset.step;
        dots.forEach(d => d.classList.toggle('active', d.dataset.p === n));
      }
    });
  }, { threshold: 0.4 });

  steps.forEach(step => observer.observe(step));
})();

/* ============================================================
   SUPABASE (opcional) — ver README para el paso a paso.
   1. Agrega en index.html, antes de este script:
      <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   2. Descomenta estas 3 líneas y pon tus credenciales del proyecto:

   const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
   const SUPABASE_ANON_KEY = "TU-ANON-KEY";
   const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
============================================================ */

/* ============================================================
   ESTADO DE LA CONVERSACIÓN
   welcome -> waiting_photo -> waiting_style -> generating -> result -> whatsapp
============================================================ */
let state = "welcome";
let uploadedImageURL = null;
let uploadedFile = null;
let chosenStyle = null;

const chat = document.getElementById('chat');
const stateTag = document.getElementById('stateTag');

const STYLES = ["Minimalista", "Industrial", "Cálido / madera", "Escandinavo", "Tropical"];

function setState(s){
  state = s;
  stateTag.textContent = "estado: " + s;
}

function scrollBottom(){
  requestAnimationFrame(()=> chat.scrollTop = chat.scrollHeight);
}

function botBubble(html, figTag){
  const row = document.createElement('div');
  row.className = 'row bot';
  row.innerHTML = `<div class="bubble bot">${figTag ? `<span class="fig-tag">${figTag}</span>`:''}${html}</div>`;
  chat.appendChild(row);
  scrollBottom();
  return row;
}

function userBubble(html){
  const row = document.createElement('div');
  row.className = 'row user';
  row.innerHTML = `<div class="bubble user">${html}</div>`;
  chat.appendChild(row);
  scrollBottom();
  return row;
}

function typingBubble(){
  const row = document.createElement('div');
  row.className = 'row bot';
  row.innerHTML = `<div class="bubble bot"><div class="typing"><span></span><span></span><span></span></div></div>`;
  chat.appendChild(row);
  scrollBottom();
  return row;
}

function botDelay(fn, ms=650){
  const t = typingBubble();
  setTimeout(()=>{ t.remove(); fn(); }, ms);
}

/* ===== Flujo ===== */
function start(){
  botBubble(
    "Hola 👋 Soy el asistente de rediseño de <b>acero.studio</b>. Te ayudo a visualizar cómo se vería tu cafetería con un nuevo diseño de interior o fachada.<br><br>Para empezar, envíame una foto del espacio: puedes tomarla ahora o subirla de tu galería.",
    "FIG. 01 — INICIO"
  );
  setState("waiting_photo");
}

function onImageSelected(file){
  if(!file) return;
  uploadedFile = file;
  uploadedImageURL = URL.createObjectURL(file);
  userBubble(`<img src="${uploadedImageURL}" alt="Foto de la cafetería">`);

  botDelay(()=>{
    let chipsHtml = STYLES.map(s => `<button class="chip" data-style="${s}">${s}</button>`).join('');
    botBubble(
      `Buena foto. ¿Qué estilo te gustaría explorar para este espacio?<div class="chips">${chipsHtml}</div>`,
      "FIG. 02 — ESTILO"
    );
    document.querySelectorAll('.chip').forEach(chip=>{
      chip.addEventListener('click', ()=> onStyleChosen(chip.dataset.style));
    });
    setState("waiting_style");
  });
}

function onStyleChosen(style){
  chosenStyle = style;
  document.querySelectorAll('.chip').forEach(c => c.style.pointerEvents='none');
  userBubble(style);
  setState("generating");

  botDelay(()=>{
    const genRow = botBubble(
      `Generando propuesta en estilo <b>${style}</b>…<div class="scan-wrap"><img src="${uploadedImageURL}"><div class="scan-line"></div><div class="scan-label">renderizando · ControlNet activo</div></div>`,
      "FIG. 03 — GENERACIÓN"
    );
    scrollBottom();

    setTimeout(()=>{
      genRow.remove();
      showResult(style);
    }, 2200);
  }, 500);
}

function showResult(style){
  botBubble(
    `Listo — aquí tienes una primera propuesta en estilo <b>${style}</b>.
     <div class="scan-wrap" style="border-color:var(--accent)"><img src="${uploadedImageURL}"></div>
     <span class="result-tag">Propuesta preliminar · v1</span><br>
     <div style="margin-top:10px; font-size:.8rem; color:var(--ink-soft)">
       ¿Quieres afinar esta propuesta con un diseñador o cotizar la remodelación?
     </div>
     <button class="cta-btn" id="btnWA">💬 Continuar por WhatsApp</button>
     <button class="cta-btn ghost" id="btnRetry">Probar otro estilo</button>`,
    "FIG. 04 — RESULTADO"
  );
  document.getElementById('btnWA').addEventListener('click', goToWhatsapp);
  document.getElementById('btnRetry').addEventListener('click', ()=>{
    document.querySelectorAll('.chip').forEach(c => c.style.pointerEvents='auto');
    botBubble("Elige otro estilo para esta misma foto:" +
      `<div class="chips">${STYLES.map(s => `<button class="chip" data-style="${s}">${s}</button>`).join('')}</div>`,
      "FIG. 02 — ESTILO"
    );
    document.querySelectorAll('.chip').forEach(chip=>{
      chip.addEventListener('click', ()=> onStyleChosen(chip.dataset.style));
    });
  });
  setState("result");

  /* --- Punto de enganche para Supabase (ver README) ---
     saveLeadToSupabase({ style, imageFile: uploadedFile });
  */
}

function goToWhatsapp(){
  const msg = `Hola, quiero cotizar el rediseño de mi cafetería. Estilo elegido: ${chosenStyle}. Voy a adjuntar la foto y la propuesta generada en este chat.`;
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  botBubble(
    `Perfecto. Voy a abrir WhatsApp con el mensaje listo. <b>Recuerda adjuntar la foto y la propuesta</b> generada aquí — WhatsApp no permite enviarlas automáticamente desde la web por temas de privacidad.`,
    "FIG. 05 — CONTACTO"
  );
  setState("whatsapp");
  setTimeout(()=> window.open(url, '_blank'), 600);
}

/* ===== Texto libre — mantiene el foco solo en rediseño ===== */
function handleUserText(text){
  userBubble(text);
  const t = text.toLowerCase();

  botDelay(()=>{
    if(state === "waiting_photo"){
      botBubble("Para continuar necesito una foto del espacio — usa 📷 o 🖼️ abajo.");
      return;
    }
    if(t.includes("gracias") || t.includes("listo")){
      botBubble("¡Con gusto! Si quieres, podemos seguir explorando otro estilo o pasar directo a WhatsApp.");
      return;
    }
    const offTopic = ["receta","precio del café","tueste","molienda","factura","nómina","marketing"];
    if(offTopic.some(k => t.includes(k))){
      botBubble("Mi función aquí es ayudarte a visualizar el rediseño físico de tu cafetería 🏗️. Para otros temas, un asesor puede ayudarte por WhatsApp. ¿Seguimos con el diseño?");
      return;
    }
    botBubble("Entendido. Cuando quieras, envía una foto del espacio o elige un estilo para continuar con la propuesta visual.");
  }, 500);
}

/* ===== Listeners ===== */
document.getElementById('btnCamera').addEventListener('click', ()=> document.getElementById('fileCamera').click());
document.getElementById('btnGallery').addEventListener('click', ()=> document.getElementById('fileGallery').click());
document.getElementById('fileCamera').addEventListener('change', e => onImageSelected(e.target.files[0]));
document.getElementById('fileGallery').addEventListener('change', e => onImageSelected(e.target.files[0]));

document.getElementById('btnSend').addEventListener('click', sendText);
document.getElementById('textInput').addEventListener('keydown', e => { if(e.key === 'Enter') sendText(); });

function sendText(){
  const input = document.getElementById('textInput');
  const val = input.value.trim();
  if(!val) return;
  input.value = '';
  handleUserText(val);
}

start();
 ============================================================
   FUNCIÓN LISTA PARA SUPABASE — descomenta cuando tengas el
   cliente configurado arriba. Sube la imagen al Storage y
   guarda el lead en la tabla `leads`. Ver README para el SQL.
============================================================

async function saveLeadToSupabase({ style, imageFile }){
  try{
    const fileName = `lead-${Date.now()}.jpg`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('fotos-cafeterias')
      .upload(fileName, imageFile);

    if(uploadError) throw uploadError;

    const { data: urlData } = supabase
      .storage
      .from('fotos-cafeterias')
      .getPublicUrl(fileName);

    const { error: insertError } = await supabase
      .from('leads')
      .insert({
        estilo: style,
        imagen_url: urlData.publicUrl,
        creado_en: new Date().toISOString()
      });

    if(insertError) throw insertError;

  }catch(err){
    console.error('Error guardando en Supabase:', err);
  }
}




