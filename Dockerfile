FROM node:22-bookworm

# Install build tools for native modules (like sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
# Install dependencies
RUN npm install

COPY . .
# Ensure SQLite directory exists
RUN mkdir -p data
EXPOSE 5175
CMD ["node", "server.js"]
