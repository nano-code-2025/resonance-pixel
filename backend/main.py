from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from api import auth, profile, pool, approaches, sessions, offers, pipeline

load_dotenv()

app = FastAPI(
    title="Resonance API",
    description="找到同频的人 — 八字·MBTI·星座·三观匹配",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # 生产环境替换为具体域名
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,    prefix="/api/auth",    tags=["Auth"])
app.include_router(profile.router, prefix="/api/profile", tags=["画像"])
app.include_router(pool.router,    prefix="/api/pool",    tags=["Pool"])
app.include_router(approaches.router, prefix="/api/approaches", tags=["Approaches"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
app.include_router(offers.router, prefix="/api/offers", tags=["Offers"])
app.include_router(pipeline.router, prefix="/api/pipeline", tags=["Pipeline"])


@app.get("/health")
def health():
    return {"status": "ok", "version": "0.1.0"}
