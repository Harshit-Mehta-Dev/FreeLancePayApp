# Stage 1: Build the Frontend (Minimal Alpine for better security)
FROM node:22-alpine AS build-stage
WORKDIR /app
COPY client/package*.json ./client/
RUN cd client && npm install --ignore-scripts
COPY client/ ./client/
RUN cd client && npm run build

# Stage 2: Prepare the Backend
FROM node:22-bookworm-slim AS setup-stage
WORKDIR /app

# Install build tools for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev --build-from-source

# Stage 3: Final Production Image (Distroless)
FROM gcr.io/distroless/nodejs22-debian12
WORKDIR /app

# Copy the built frontend and backend node_modules
COPY --from=build-stage /app/client/dist ./client/dist
COPY --from=setup-stage /app/server/node_modules ./server/node_modules

# Copy the server source code
COPY server/ ./server/

# CRITICAL: Create the data directory and set permissions AFTER copying the code.
# Since Distroless doesn't have a shell/chown, we rely on the fact that
# the setup-stage has already prepared the node_modules.
# However, we need a writable directory for SQLite.
# In Distroless, we can use /tmp for temporary files, but for persistence 
# we need /app/server/data to be writable by UID 65532.

# Let's use a small trick: use an intermediate stage to set permissions
# OR just ensure the host directory has correct permissions.

# Actually, the best way in Distroless is to perform the chown in a helper stage.

FROM node:22-bookworm-slim AS permission-stage
WORKDIR /app
COPY --from=setup-stage /app/server/node_modules ./server/node_modules
COPY server/ ./server/
RUN mkdir -p /app/server/data && chown -R 65532:65532 /app/server/data && chmod 777 /app/server/data

# Final Stage
FROM gcr.io/distroless/nodejs22-debian12
WORKDIR /app
COPY --from=build-stage /app/client/dist ./client/dist
COPY --from=permission-stage /app/server ./server

# Switch to non-root user
USER nonroot

ENV NODE_ENV=production
ENV PORT=5175

EXPOSE 5175

CMD ["node", "--watch", "server/server.js"]