from app.core.config import settings

print("API KEY PREFIX:", settings.OPENAI_API_KEY[:8])
print("MODEL:", settings.OPENAI_MODEL)