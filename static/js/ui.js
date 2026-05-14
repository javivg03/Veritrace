/* ================================================================
   ui.js — Renderizado y manipulación del DOM
   Toda la lógica de presentación está centralizada aquí.
   ================================================================ */

const PLATFORM_LABELS = {
  instagram: "Instagram",
  tiktok:    "TikTok",
  x:         "X / Twitter",
  youtube:   "YouTube",
  telegram:  "Telegram",
  facebook:  "Facebook",
  web:       "Web"
};

// Etiquetas legibles para los campos del resultado
const FIELD_LABELS = {
  usuario:        "Usuario",
  nombre:         "Nombre",
  email:          "Email",
  telefono:       "Teléfono",
  origen:         "Fuente",
  seguidores:     "Seguidores",
  seguidos:       "Seguidos",
  bio:            "Biografía",
  publicaciones:  "Publicaciones",
  verificado:     "Verificado",
  url:            "URL",
  fecha_creacion: "Fecha creación",
  tweets:         "Tweets",
  descripcion:    "Descripción",
  suscriptores:   "Suscriptores",
  videos:         "Vídeos",
  vistas:         "Vistas totales",
  miembros:       "Miembros",
  tipo:           "Tipo",
  likes:          "Likes",
  comentarios:    "Comentarios"
};

// Campos que nunca se muestran en la tarjeta (rutas internas)
const HIDDEN_FIELDS = new Set(["excel_path", "csv_path"]);

/* ----------------------------------------------------------------
   Resultado de scraping
---------------------------------------------------------------- */
function mostrarResultado(data, plataforma) {
  const contenedor = document.getElementById("resultado");
  contenedor.innerHTML = "";

  const lista = Array.isArray(data) ? data : (data ? [data] : []);

  if (lista.length === 0) {
    contenedor.innerHTML = `<div class="empty-result">No se encontraron resultados.</div>`;
    mostrarAreaResultados();
    return;
  }

  lista.forEach(r => {
    const card = document.createElement("div");
    card.className = "result-card";

    // Header
    const header = document.createElement("div");
    header.className = "result-card-header";
    header.innerHTML = `
      <span class="result-platform-badge">${PLATFORM_LABELS[plataforma] || plataforma}</span>
      <span class="result-username">${r.usuario || r.nombre || "—"}</span>
    `;

    // Body — grid de campos
    const body = document.createElement("div");
    body.className = "result-card-body";

    const entries = Object.entries(r).filter(
      ([k, v]) => !HIDDEN_FIELDS.has(k) && v !== null && v !== undefined && String(v).trim() !== ""
    );

    if (entries.length === 0) {
      body.innerHTML = `<p class="empty-result">Sin datos disponibles.</p>`;
    } else {
      entries.forEach(([key, val]) => {
        const displayVal = String(val);
        const isEmpty    = displayVal === "-" || displayVal.trim() === "";
        const field      = document.createElement("div");
        field.className  = "result-field";
        field.innerHTML  = `
          <span class="result-field-label">${FIELD_LABELS[key] || key}</span>
          <span class="result-field-value ${isEmpty ? "empty" : ""}">${isEmpty ? "—" : displayVal}</span>
        `;
        body.appendChild(field);
      });
    }

    card.appendChild(header);
    card.appendChild(body);
    contenedor.appendChild(card);
  });

  mostrarAreaResultados();
}

function mostrarError(msg) {
  document.getElementById("resultado").innerHTML =
    `<div class="status-message error">❌ ${msg}</div>`;
  mostrarAreaResultados();
}

function mostrarWarning(msg) {
  document.getElementById("resultado").innerHTML =
    `<div class="status-message warning">⚠️ ${msg}</div>`;
  mostrarAreaResultados();
}

function mostrarAreaResultados() {
  document.getElementById("result-area").classList.remove("hidden");
}

/* ----------------------------------------------------------------
   Descarga
---------------------------------------------------------------- */
function activarDescarga(excelPath, csvPath) {
  const bar       = document.getElementById("descarga");
  const excelLink = document.getElementById("link-descarga-excel");
  const csvLink   = document.getElementById("link-descarga-csv");
  let mostrar     = false;

  if (excelPath) {
    excelLink.href     = excelPath;
    excelLink.download = excelPath.split("/").pop();
    excelLink.classList.remove("hidden");
    mostrar = true;
  } else {
    excelLink.classList.add("hidden");
  }

  if (csvPath) {
    csvLink.href     = csvPath;
    csvLink.download = csvPath.split("/").pop();
    csvLink.classList.remove("hidden");
    mostrar = true;
  } else {
    csvLink.classList.add("hidden");
  }

  mostrar ? bar.classList.remove("hidden") : bar.classList.add("hidden");
}

/* ----------------------------------------------------------------
   Terminal de log
---------------------------------------------------------------- */
function initTerminal() {
  const panel  = document.getElementById("terminal-panel");
  const output = document.getElementById("terminal-output");
  panel.classList.remove("hidden");
  output.innerHTML = "";
  mostrarAreaResultados();
}

function logLine(msg, type = "info") {
  const output = document.getElementById("terminal-output");
  const palette = { info: "#7ee787", warn: "#d29922", error: "#f85149", dim: "#6e7681" };
  const prefix  = { info: "›", warn: "⚠", error: "✗", dim: "#" };
  const line    = document.createElement("div");
  line.style.color = palette[type] || palette.info;
  const time = new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
  line.textContent = `[${time}]  ${prefix[type] || "›"}  ${msg}`;
  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

function closeTerminal() {
  document.getElementById("terminal-panel").classList.add("hidden");
  document.getElementById("terminal-output").innerHTML = "";
}

/* ----------------------------------------------------------------
   Loader (spinner perfil rápido)
---------------------------------------------------------------- */
function showLoader() {
  closeTerminal();
  document.getElementById("loader").classList.remove("hidden");
  mostrarAreaResultados();
}

function hideLoader() {
  document.getElementById("loader").classList.add("hidden");
}

/* ----------------------------------------------------------------
   Botón cancelar
---------------------------------------------------------------- */
function showCancelBtn() { document.getElementById("btn-cancel").classList.remove("hidden"); }
function hideCancelBtn()  { document.getElementById("btn-cancel").classList.add("hidden"); }

/* ----------------------------------------------------------------
   Reset completo del área de resultados
---------------------------------------------------------------- */
function resetResultArea() {
  document.getElementById("resultado").innerHTML = "";
  document.getElementById("result-area").classList.add("hidden");
  document.getElementById("descarga").classList.add("hidden");
  document.getElementById("link-descarga-excel").classList.add("hidden");
  document.getElementById("link-descarga-csv").classList.add("hidden");
  closeTerminal();
  hideLoader();
  hideCancelBtn();
}

/* ----------------------------------------------------------------
   Tabla de historial
---------------------------------------------------------------- */
function renderHistorial(historial) {
  const contenedor = document.getElementById("historial-container");

  if (!historial || historial.length === 0) {
    contenedor.innerHTML = `<p class="empty-state">No hay registros en el historial.</p>`;
    return;
  }

  let html = `
    <table class="history-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Plataforma</th>
          <th>Usuario</th>
          <th>Resultado</th>
          <th>Archivo</th>
        </tr>
      </thead>
      <tbody>`;

  historial.forEach(reg => {
    const ext = reg.archivo?.endsWith(".csv")  ? "CSV"   :
                reg.archivo?.endsWith(".xlsx") ? "Excel" : null;
    html += `
      <tr>
        <td>${reg.fecha    || "—"}</td>
        <td><span class="platform-pill">${reg.plataforma || "—"}</span></td>
        <td style="font-family:var(--font-mono)">${reg.usuario  || "—"}</td>
        <td>${reg.resultado || "—"}</td>
        <td>${ext
          ? `<button class="btn-outline" onclick="window.open('/descargar/${reg.archivo}','_blank')">↓ ${ext}</button>`
          : "—"}</td>
      </tr>`;
  });

  html += `</tbody></table>`;
  contenedor.innerHTML = html;
}

/* ----------------------------------------------------------------
   Feedback proxies
---------------------------------------------------------------- */
function setProxyFeedback(msg, type = "info") {
  const el = document.getElementById("proxies_mensaje");
  const colors = { ok: "var(--success)", error: "var(--danger)", info: "var(--text-secondary)" };
  el.style.color = colors[type] || colors.info;
  el.textContent = msg;
}
