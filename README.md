# Docker Compose
POSTGRES_USER=seesweet
POSTGRES_PASSWORD=WhatIsDeadMayNeverDie8024
POSTGRES_DB=seesweet

# Prisma loads this via dotenv in prisma.config.ts
DATABASE_URL="postgresql://seesweet:WhatIsDeadMayNeverDie8024@localhost:5432/seesweet"

# Better Auth
BETTER_AUTH_SECRET="29npTmO7i1VgOWVXTWglBptZH9l93ynd"
BETTER_AUTH_URL="http://localhost:3000"



# Ollama (local dev only)
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="qwen3.5:4b"

OLLAMA_EMBED_MODEL=qwen3-embedding:8b
EMBED_DIMENSIONS=4096

# Default admin account
DEFAULT_ADMIN_EMAIL="admin@seesweet.com"
DEFAULT_ADMIN_PASSWORD="Admin123$"
DEFAULT_ADMIN_NAME="Administrator"
DEFAULT_ADMIN_TIER="premium"
