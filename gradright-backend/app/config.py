from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment / .env (PYTHON_SETUP Step 6)."""

    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    database_url: str
    anthropic_api_key: str
    redis_url: str = "redis://localhost:6379"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "ap-south-1"
    aws_textract_bucket: str = ""
    resend_api_key: str = ""
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    frontend_url: str = "http://localhost:3000"
    environment: str = "development"
    secret_key: str = "changeme"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
