from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    secret_key: str = "change-me-to-a-random-string"
    database_url: str = "sqlite:///./bakery.db"
    admin_email: str = "admin@bakery.local"
    admin_password: str = "admin123"
    debug: bool = False

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
