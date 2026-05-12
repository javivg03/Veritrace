from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from routes.instagram import router_instagram
from routes.tiktok import router_tiktok
from routes.telegram import router_telegram
from routes.youtube import router_youtube
from routes.x import router_x
from routes.facebook import router_facebook
from routes.web import router_web
from routes.resultados import router_resultados
from routes.proxies import router_proxies

# ========== FASTAPI APP SETUP ==========
app = FastAPI(
    title="Veritrace API",
    description="Plataforma de Due Diligence Digital. Análisis de huella pública en redes sociales para entornos de compliance, legal y finanzas.",
    version="2.0.0"
)

app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/download", StaticFiles(directory="exports"), name="exports")

# ========== HTML RAÍZ ==========
@app.get("/", response_class=FileResponse)
def root():
    return "static/index.html"

# ========== INCLUIMOS ROUTERS ==========
app.include_router(router_instagram)
app.include_router(router_tiktok)
app.include_router(router_telegram)
app.include_router(router_youtube)
app.include_router(router_x)
app.include_router(router_facebook)
app.include_router(router_web)
app.include_router(router_resultados)
app.include_router(router_proxies)
