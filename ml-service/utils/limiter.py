import os
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

redis_url = os.getenv("REDIS_URL", "")
if not redis_url or os.getenv("TESTING", "").lower() == "true" or os.getenv("FLASK_ENV") == "testing":
    redis_url = "memory://"

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=redis_url,
    strategy="fixed-window"
)
