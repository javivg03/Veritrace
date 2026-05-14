/* ================================================================
   main.js — Orquestación principal de Veritrace
   Gestiona navegación, selección de plataforma y flujo de scraping.
   Depende de: api.js, ui.js (cargados antes en el HTML)
   ================================================================ */

let tareaActivaId  = null;
let plataformaActual = "instagram";
let tipoActual       = "perfil";

/* ---- Configuración ---- */

const TIPOS_POR_PLATAFORMA = {
  instagram: ["perfil", "seguidores", "seguidos"],
  tiktok:    ["perfil", "seguidores", "seguidos"],
  x:         ["perfil", "tweets"],
  youtube:   ["canal"],
  telegram:  ["canal"],
  facebook:  ["perfil"],
  web:       ["perfil", "buscar"]
};

const ETIQUETAS_TIPO = {
  perfil:    "Perfil",
  seguidores: "Seguidores",
  seguidos:  "Seguidos",
  tweets:    "Tweets",
  canal:     "Canal",
  buscar:    "Palabra clave"
};

const ENDPOINT_MAP = {
  instagram: { perfil: "/instagram/perfil", seguidores: "/instagram/seguidores", seguidos: "/instagram/seguidos" },
  tiktok:    { perfil: "/tiktok/perfil",    seguidores: "/tiktok/seguidores",    seguidos: "/tiktok/seguidos"    },
  x:         { perfil: "/x/perfil",         tweets: "/x/tweets"                                                  },
  youtube:   { canal:  "/youtube/canal"                                                                           },
  telegram:  { canal:  "/telegram/canal"                                                                          },
  facebook:  { perfil: "/facebook/perfil"                                                                         },
  web:       { perfil: "/web/perfil",        buscar: "/web/buscar"                                               }
};

const TIPOS_DIRECTOS = new Set(["perfil", "canal", "buscar"]);
const TIPOS_CELERY   = new Set(["seguidores", "seguidos", "tweets"]);

/* ================================================================
   NAVEGACIÓN
================================================================ */

function initNav() {
  const PAGE_TITLES = {
    search:  "Búsqueda",
    history: "Historial",
    proxies: "Proxies",
    legal:   "Marco Legal"
  };

  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", e => {
      e.preventDefault();
      const section = item.dataset.section;

      // Actualizar nav activo
      document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
      item.classList.add("active");

      // Mostrar sección correspondiente
      document.querySelectorAll(".content-section").forEach(s => s.classList.add("hidden"));
      document.getElementById(`section-${section}`).classList.remove("hidden");

      // Título del topbar
      document.getElementById("page-title").textContent = PAGE_TITLES[section] || section;

      // Auto-cargar historial al entrar
      if (section === "history") cargarHistorial();
    });
  });
}

/* ================================================================
   SELECCIÓN DE PLATAFORMA Y TIPO
================================================================ */

function initPlatforms() {
  document.querySelectorAll(".platform-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".platform-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      plataformaActual = btn.dataset.platform;
      renderTypeTabs();
      resetResultArea();
    });
  });
}

function renderTypeTabs() {
  const tipos     = TIPOS_POR_PLATAFORMA[plataformaActual] || [];
  const container = document.getElementById("type-tabs");
  container.innerHTML = "";

  tipos.forEach((tipo, i) => {
    const tab      = document.createElement("button");
    tab.className  = "type-tab" + (i === 0 ? " active" : "");
    tab.dataset.tipo = tipo;
    tab.textContent  = ETIQUETAS_TIPO[tipo] || tipo;

    tab.addEventListener("click", () => {
      document.querySelectorAll(".type-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      tipoActual = tipo;
      toggleMaxGroup();
    });

    container.appendChild(tab);
  });

  tipoActual = tipos[0] || "perfil";
  toggleMaxGroup();
}

function toggleMaxGroup() {
  const grupo  = document.getElementById("grupo-max-seguidores");
  const label  = document.getElementById("label-max");
  const esMasivo = TIPOS_CELERY.has(tipoActual);

  grupo.classList.toggle("hidden", !esMasivo);

  if (esMasivo) {
    label.textContent =
      tipoActual === "tweets"     ? "Máximo de tweets:" :
      tipoActual === "seguidores" ? "Máximo de seguidores:" :
                                    "Máximo de seguidos:";
  }
}

/* ================================================================
   SCRAPING PRINCIPAL
================================================================ */

async function scrapear() {
  const username = document.getElementById("username").value.trim();
  if (!username) {
    document.getElementById("username").focus();
    return;
  }

  const maxCount = parseInt(document.getElementById("max_seguidores").value) || 3;
  const endpoint = ENDPOINT_MAP[plataformaActual]?.[tipoActual];
  if (!endpoint) return;

  resetResultArea();

  const btnSearch = document.getElementById("btn-search");
  btnSearch.disabled = true;

  try {
    if (TIPOS_DIRECTOS.has(tipoActual)) {
      await _scrapearDirecto(endpoint, username, tipoActual);
    } else {
      await _scrapearCelery(endpoint, username, tipoActual, maxCount);
    }
  } finally {
    btnSearch.disabled = false;
  }
}

async function _scrapearDirecto(endpoint, username, tipo) {
  showLoader();

  const body = tipo === "buscar"
    ? { query: username }
    : { username, habilitar_busqueda_web: false };

  try {
    const { ok, json } = await apiScrapearPerfil(endpoint, body);
    hideLoader();

    if (!ok) {
      json.estado === "duplicado"
        ? mostrarWarning(json.mensaje || "Este perfil ya fue analizado recientemente.")
        : mostrarError(json.error   || "Error al analizar el perfil.");
      return;
    }

    mostrarResultado(json, plataformaActual);
    activarDescarga(json.excel_path, json.csv_path);

  } catch {
    hideLoader();
    mostrarError("No se pudo conectar con el servidor.");
  }
}

async function _scrapearCelery(endpoint, username, tipo, maxCount) {
  initTerminal();
  logLine(`Iniciando análisis de ${tipo} para @${username}...`);
  logLine(`Límite configurado: ${maxCount} registros`, "dim");

  const payload = { username };
  if (tipo === "seguidores") payload.max_seguidores = maxCount;
  if (tipo === "seguidos")   payload.max_seguidos   = maxCount;
  if (tipo === "tweets")     payload.max_tweets     = maxCount;

  try {
    const { ok, json } = await apiIniciarTarea(endpoint, payload);

    if (!ok) {
      logLine(
        json.estado === "duplicado"
          ? (json.mensaje || "Tarea ya realizada recientemente.")
          : (json.error   || "Error al iniciar la tarea."),
        "error"
      );
      return;
    }

    const { tarea_id } = json;
    if (!tarea_id) { logLine("No se recibió ID de tarea.", "error"); return; }

    tareaActivaId = tarea_id;
    showCancelBtn();
    logLine(`Tarea encolada — ID: ${tarea_id}`, "dim");
    logLine("Procesando en segundo plano...");

    _esperarResultado(tarea_id);

  } catch {
    logLine("Error inesperado al iniciar la tarea.", "error");
  }
}

/* ================================================================
   POLLING DE TAREA CELERY
================================================================ */

async function _esperarResultado(tareaId) {
  let intentos   = 0;
  const MAX_INTENTOS = 120; // 4 min máximo

  const check = async () => {
    try {
      const json = await apiEstadoTarea(tareaId);
      intentos++;

      if (json.estado === "pendiente") {
        if (intentos % 5 === 0) logLine(`En proceso... (${intentos * 2}s)`, "dim");
        if (intentos < MAX_INTENTOS) setTimeout(check, 2000);
        else { logLine("Tiempo de espera agotado. Inténtalo de nuevo.", "warn"); hideCancelBtn(); }
        return;
      }

      hideCancelBtn();
      tareaActivaId = null;

      if (json.estado === "error") {
        logLine(json.mensaje || "Error en la tarea de scraping.", "error");
      } else {
        const n = Array.isArray(json.data) ? json.data.length : 1;
        logLine(`✓ Completado — ${n} registro${n !== 1 ? "s" : ""} obtenido${n !== 1 ? "s" : ""}.`);
        setTimeout(() => {
          closeTerminal();
          mostrarResultado(json.data, plataformaActual);
          activarDescarga(json.excel_path, json.csv_path);
        }, 700);
      }

    } catch {
      hideCancelBtn();
      logLine("Error al consultar el estado de la tarea.", "error");
    }
  };

  check();
}

/* ================================================================
   CANCELAR TAREA
================================================================ */

async function cancelarScraping() {
  if (!tareaActivaId) return;
  try {
    const json = await apiCancelarTarea(tareaActivaId);
    logLine(json.mensaje || "Scraping cancelado.", "warn");
    hideCancelBtn();
    tareaActivaId = null;
  } catch {
    logLine("No se pudo cancelar la tarea.", "error");
  }
}

/* ================================================================
   HISTORIAL
================================================================ */

async function cargarHistorial() {
  const contenedor = document.getElementById("historial-container");
  contenedor.innerHTML = `<p class="empty-state skeleton" style="height:36px;width:100%"></p>`;
  try {
    const historial = await apiHistorial();
    renderHistorial(historial);
  } catch {
    contenedor.innerHTML = `<p class="empty-state">Error al cargar el historial.</p>`;
  }
}

async function borrarHistorial() {
  if (!confirm("¿Borrar todo el historial? Esta acción no se puede deshacer.")) return;
  const ok = await apiBorrarHistorial();
  if (ok)  renderHistorial([]);
  else     alert("Error al borrar el historial.");
}

/* ================================================================
   PROXIES
================================================================ */

async function cargarProxies() {
  const textarea = document.getElementById("proxies_input");
  const modo     = document.getElementById("modo_proxies").value;
  const proxies  = textarea.value.trim().split("\n").filter(p => p.trim());

  if (proxies.length === 0) {
    setProxyFeedback("⚠️ Debes pegar al menos un proxy.", "error");
    return;
  }

  if (modo === "replace") {
    try {
      const { total } = await apiContarProxies();
      if (total > 0 && !confirm(`Ya hay ${total} proxy(s) cargado(s). ¿Sobrescribir?`)) return;
    } catch { /* ignorar si el endpoint no responde */ }
  }

  const { ok, json } = await apiSubirProxies(proxies, modo);
  if (ok) setProxyFeedback("✅ " + (json.mensaje || "Proxies cargados correctamente."), "ok");
  else    setProxyFeedback("❌ " + (json.error   || "No se pudo cargar la lista."),    "error");
}

/* ================================================================
   INIT
================================================================ */

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initPlatforms();
  renderTypeTabs();

  // Enter para buscar
  document.getElementById("username").addEventListener("keydown", e => {
    if (e.key === "Enter") scrapear();
  });
});
