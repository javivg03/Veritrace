/* ================================================================
   api.js — Capa de acceso a la API de Veritrace
   Todas las llamadas fetch están centralizadas aquí.
   ================================================================ */

async function apiScrapearPerfil(endpoint, body) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  return { ok: res.ok, json };
}

async function apiIniciarTarea(endpoint, payload) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  return { ok: res.ok, json };
}

async function apiEstadoTarea(tareaId) {
  const res = await fetch(`/resultado-tarea/${tareaId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

async function apiCancelarTarea(tareaId) {
  const res = await fetch(`/cancelar-tarea/${tareaId}`, { method: "POST" });
  return await res.json();
}

async function apiHistorial() {
  const res = await fetch("/historial");
  if (!res.ok) throw new Error("Error al cargar historial");
  return await res.json();
}

async function apiBorrarHistorial() {
  const res = await fetch("/historial", { method: "DELETE" });
  return res.ok;
}

async function apiContarProxies() {
  const res = await fetch("/proxies/contar");
  return await res.json();
}

async function apiSubirProxies(proxies, modo) {
  const res = await fetch("/proxies/subir_proxies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proxies, modo })
  });
  const json = await res.json();
  return { ok: res.ok, json };
}
