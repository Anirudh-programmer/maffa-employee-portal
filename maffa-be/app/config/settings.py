"""Settings — load env, build DATABASE_URL from DB_CON_STR or DATABASE_URL."""
import os
import re
import urllib.parse
from dotenv import load_dotenv
from .app_config import APP_NAME, APP_VERSION, DEBUG, PORT

load_dotenv()

DB_CON_STR = os.getenv("DB_CON_STR")
DB_SCHEMA = "maffa"


def _parse_kv_string(s: str) -> dict:
    """Parse 'key1=val1 key2='quoted val' key3=val3' into a dict.
    Handles single- and double-quoted values that may contain spaces."""
    pairs = re.findall(r"(\w+)\s*=\s*(\"[^\"]*\"|'[^']*'|\S+)", s)
    parts = {}
    for k, v in pairs:
        if (v.startswith("'") and v.endswith("'")) or (v.startswith('"') and v.endswith('"')):
            v = v[1:-1]
        parts[k.strip()] = v.strip()
    return parts


if DB_CON_STR:
    if DB_CON_STR.startswith("postgresql://") or DB_CON_STR.startswith("postgres://"):
        DATABASE_URL = DB_CON_STR
    else:
        parts = _parse_kv_string(DB_CON_STR)
        db_name = parts.get("dbname")
        db_user = parts.get("user")
        db_pass = parts.get("password")
        db_host = parts.get("host")
        db_port = parts.get("port", "5432")
        DB_SCHEMA = parts.get("db_schema", "maffa")
        ssl = parts.get("sslmode", "require")

        if db_name and db_user and db_pass and db_host:
            encoded_pass = urllib.parse.quote(db_pass, safe="")
            DATABASE_URL = (
                f"postgresql://{db_user}:{encoded_pass}@{db_host}:{db_port}/{db_name}"
                f"?sslmode={ssl}"
            )
        else:
            DATABASE_URL = os.getenv("DATABASE_URL")
            if not DATABASE_URL:
                missing = [k for k, v in [("dbname", db_name), ("user", db_user),
                                          ("password", db_pass), ("host", db_host)] if not v]
                raise RuntimeError(f"Missing required DB_CON_STR fields: {', '.join(missing)}")
else:
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise RuntimeError("Set DATABASE_URL or DB_CON_STR in .env")

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5001")
API_V1_STR = "/maffa"
