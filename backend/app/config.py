from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./data/app.db"
    anthropic_api_key: str = ""
    frontend_url: str = "http://localhost:5173"
    parent_pin: str = ""
    generation_model: str = "claude-sonnet-4-6"

    class Config:
        env_file = ".env"


settings = Settings()
