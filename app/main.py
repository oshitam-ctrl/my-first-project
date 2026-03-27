from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.database import Base, engine
import app.models  # noqa: F401 — register all models with Base
from app.templating import BASE_DIR


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="パン屋予約システム", lifespan=lifespan)

app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

from app.routes.auth import router as auth_router  # noqa: E402
from app.routes.products import router as products_router  # noqa: E402
from app.routes.reservations import router as reservations_router  # noqa: E402
from app.routes.admin import router as admin_router  # noqa: E402

app.include_router(auth_router)
app.include_router(products_router)
app.include_router(reservations_router)
app.include_router(admin_router)
