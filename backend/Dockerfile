FROM node:20-bullseye-slim
WORKDIR /app
# Install a few lightweight packages used by some sqlite3 builds and for health checks
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates tini && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
# Install production dependencies (including sqlite3 native bindings compatible with debian base)
RUN npm ci --production --silent

COPY . .
VOLUME ["/app/data"]
EXPOSE 4000
# Use tini as init to reap processes; start the app
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "index.js"]
