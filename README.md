# Veritrace — Plataforma de Due Diligence Digital

> Herramienta OSINT de análisis de huella pública en redes sociales, orientada a entornos
> de compliance, KYC, AML y verificación de identidad digital.

[![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)
[![Celery](https://img.shields.io/badge/Celery-Redis-37814A?logo=celery)](https://docs.celeryq.dev/)
[![Licencia](https://img.shields.io/badge/Licencia-No%20Comercial-lightgrey)](./LICENSE.txt)
[![Aviso Legal](https://img.shields.io/badge/⚖️_Uso_ético_y_legal-LEGAL.md-orange)](./LEGAL.md)

---

## ¿Qué es Veritrace?

Veritrace es una plataforma de **análisis OSINT** (*Open Source Intelligence*) que automatiza
la extracción y estructuración de información pública disponible en redes sociales. Está
diseñada para dar soporte a procesos de:

- **Due diligence digital** en operaciones corporativas o de inversión
- **KYC / AML**: verificación de identidad y detección de señales de riesgo
- **Compliance**: análisis de reputación y huella digital de contrapartes
- **Investigación legal**: consolidación de perfil público de personas o entidades

> ⚠️ Veritrace extrae **exclusivamente información pública**. No accede a APIs privadas,
> mensajes directos ni datos protegidos. Consulta [LEGAL.md](./LEGAL.md) para el marco
> normativo completo (RGPD art. 5 y 6, AMLD5/AMLD6, FATF/GAFI).

---

## ⚖️ Uso ético y legal

Este proyecto ha sido desarrollado con plena conciencia del marco normativo europeo en
materia de protección de datos y privacidad.

📄 **[Consulta el Aviso Legal completo → LEGAL.md](./LEGAL.md)**

Entre otros puntos, el documento cubre:
- Qué datos extrae y qué datos **nunca** extrae
- Base legitimadora bajo el RGPD (art. 6.1.f — interés legítimo)
- Responsabilidad del usuario final
- Relación con los ToS de las plataformas consultadas

---

## 🏗️ Arquitectura técnica

```
┌─────────────────────────────────────────────────────┐
│                     Cliente Web                      │
│              HTML + CSS + JavaScript                 │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP/REST
┌─────────────────────▼───────────────────────────────┐
│                  FastAPI (app.py)                    │
│         Routers por plataforma · OpenAPI /docs       │
└──────┬──────────────┬──────────────────┬────────────┘
       │              │                  │
┌──────▼──────┐ ┌─────▼──────┐ ┌────────▼───────┐
│  Playwright  │ │   Celery   │ │   Exportador   │
│  (scraping   │ │  Workers   │ │  Excel / CSV   │
│   async)     │ │  (tareas   │ │  (Pandas)      │
└──────┬──────┘ │  masivas)  │ └────────────────┘
       │        └─────┬──────┘
┌──────▼──────┐ ┌─────▼──────┐
│ Proxy Pool  │ │   Redis    │
│ (rotativo)  │ │  (broker + │
│             │ │  backend)  │
└─────────────┘ └────────────┘
```

### Stack completo

| Capa | Tecnología | Rol |
|------|-----------|-----|
| API | **FastAPI** + Uvicorn | Endpoints REST, documentación OpenAPI automática |
| Scraping | **Playwright** (async) | Navegador headless con soporte de proxies y evasión de bots |
| Cola de tareas | **Celery** + **Redis** | Scraping masivo asíncrono (seguidores, tweets, etc.) |
| Frontend | HTML5 + CSS3 + JS vanilla | Dashboard de búsqueda e historial |
| Exportación | **Pandas** | Generación de archivos `.xlsx` y `.csv` estructurados |
| Proxies | Pool rotativo propio | Gestión, validación y rotación automática de proxies |
| Contenedores | **Docker** + Docker Compose | Despliegue reproducible en cualquier entorno |
| Runtime | **Python 3.12** | Última versión estable con mejoras de rendimiento |

---

## 🧪 Plataformas soportadas

| Plataforma | Estado | Perfil individual | Análisis masivo |
|------------|--------|-------------------|-----------------|
| Instagram | ✅ Operativo | ✅ | ✅ Seguidores/seguidos (Celery) |
| TikTok | ✅ Operativo | ✅ | ✅ Seguidores/seguidos (Celery) |
| X (Twitter) | ✅ Operativo | ✅ | ✅ Tweets recientes (Celery) |
| YouTube | ✅ Operativo | ✅ Canal | — No aplica |
| Facebook | ✅ Operativo | ✅ | 🔜 En desarrollo |
| Telegram | ✅ Operativo | ✅ Canales públicos | — No aplica |

---

## 📦 Instalación rápida

**Requisitos previos:** Docker Desktop, Git

```bash
git clone https://github.com/TU-USUARIO/veritrace.git
cd veritrace
cp .env.example .env        # Edita .env con tus valores
docker-compose up --build
```

➡️ Abre [http://localhost:8000](http://localhost:8000)  
➡️ Documentación OpenAPI: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## ✨ Flujo de uso

1. Selecciona la plataforma objetivo
2. Introduce el nombre de usuario o perfil
3. Elige el tipo de análisis (perfil rápido o análisis masivo en segundo plano)
4. Activa la búsqueda cruzada web para ampliar la huella digital (opcional)
5. Visualiza los resultados estructurados en el dashboard
6. Exporta a `.xlsx` o `.csv` para su incorporación a informes

---

## 📤 Exportación de resultados

- Archivos generados en `exports/`
- Formatos: `.xlsx` (con cabeceras estructuradas) y `.csv`
- Accesibles desde la interfaz o directamente via `/download/`
- Preparados para integración con CRM, hojas de cálculo o herramientas de análisis

---

## 🛣️ Roadmap

- [ ] Risk Score visual (0–100) — coherencia de huella digital entre plataformas
- [ ] Generación de informe PDF descargable (due diligence report)
- [ ] Migración del historial de CSV a SQLite con SQLAlchemy
- [ ] Autenticación básica (FastAPI HTTP Basic Auth)
- [ ] Despliegue en Railway.app

---

## 🧑‍💻 Autor

**Javier Villaseñor García**  
Perfil híbrido técnico-legal | Finanzas · Compliance · Protección de datos · Legal-tech  
Técnico Superior en Desarrollo de Aplicaciones Web

---

## ⚖️ Licencia

Licencia de uso no comercial. Permitido uso académico, educativo y de investigación.  
Consulta [LICENSE.txt](./LICENSE.txt) para los términos completos.
