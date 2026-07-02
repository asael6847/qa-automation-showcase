"""Configuración central de la aplicación.

Usamos pydantic-settings para que toda la configuración entre por variables de
entorno (o un archivo .env), sin credenciales hardcodeadas. Validar aquí, en un
solo lugar, evita esparcir `os.getenv` por todo el código.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Conexión async a PostgreSQL. En tests se sobreescribe con SQLite async.
    database_url: str = "postgresql+asyncpg://qa:qa_password@localhost:5432/qa_showcase"

    # CORS: lista separada por comas en la env, parseada a lista.
    cors_origins: str = "http://localhost:3000,http://localhost:8088"

    # Runner de la suite Playwright (streaming). Ambos corren headless dentro del
    # contenedor.
    #  - run_tests_cmd: suite completa de regresión.
    #  - evidence_cmd: flujo de compra con pasos numerados que genera el PDF de
    #    evidencia en `evidencias/`.
    run_tests_cmd: str = "pnpm --filter tests test"
    evidence_cmd: str = "pnpm --filter tests evidence"
    monorepo_root: str = ".."

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    """Settings cacheadas: se construyen una sola vez por proceso."""
    return Settings()
