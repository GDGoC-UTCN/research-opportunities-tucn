#!/usr/bin/env bash
set -euo pipefail

# start.sh - convenience script to build, migrate, seed and run the Docker Compose stack
# Usage: ./start.sh [start|stop|update|logs|backup|restore|status|migrate|seed]

APP_NAME="tucn-research-portal"
API_VOLUME_NAME="tucn_api_data"
BACKUP_DIR="$(cd "$(dirname "$0")" >/dev/null 2>&1 && pwd)/docker-backups"

ROOT_DIR="$(cd "$(dirname "$0")" >/dev/null 2>&1 && pwd)"
COMPOSE_DIR="$(cd "$ROOT_DIR/.." >/dev/null 2>&1 && pwd)"
COMPOSE_FILE="$COMPOSE_DIR/docker-compose.yml"

function die() { echo "$*" >&2; exit 1; }

function dc_cmd() {
  # prefer modern `docker compose` if available, fall back to docker-compose
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    docker compose -f "$COMPOSE_FILE" "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f "$COMPOSE_FILE" "$@"
  else
    die "Neither 'docker compose' nor 'docker-compose' is available. Install Docker Compose."
  fi
}

function ensure_volume() {
  if ! docker volume inspect "$API_VOLUME_NAME" >/dev/null 2>&1; then
    echo "Creating Docker volume: $API_VOLUME_NAME"
    docker volume create "$API_VOLUME_NAME"
  fi
}

function start() {
  echo "Starting stack from $COMPOSE_FILE"
  ensure_volume
  cd "$COMPOSE_DIR"

  echo "Building images... (this may take a while)"
  dc_cmd build --parallel

  echo "Bringing services up..."
  dc_cmd up -d --remove-orphans

  echo "Running migrations (if migrations service available)"
  # run migrations service if present, otherwise attempt to run knex via api service
  if dc_cmd ps --services | grep -q migrations >/dev/null 2>&1; then
    dc_cmd run --rm migrations || true
  else
    # fallback: run npm migrate inside api service container
    if dc_cmd ps --services | grep -q api >/dev/null 2>&1; then
      dc_cmd run --rm api npm run migrate || true
    fi
  fi

  echo "Seeding admin user (if seed-admin script present)"
  # Use the DB_PATH-aware node seed script. It creates the users table if
  # missing and is idempotent, so it is safe to run on a fresh volume.
  if dc_cmd ps --services | grep -q api >/dev/null 2>&1; then
    dc_cmd run --rm api npm run seed-admin || true
  fi

  echo "Stack started. Access frontend at http://localhost:8080/ (unless overridden)"
}

function stop() {
  echo "Stopping stack (docker compose down)..."
  cd "$COMPOSE_DIR"
  dc_cmd down
}

function update() {
  echo "Updating stack images and restarting..."
  cd "$COMPOSE_DIR"
  dc_cmd pull || true
  dc_cmd build --parallel
  dc_cmd up -d --remove-orphans
  echo "Update complete."
}

function logs() {
  cd "$COMPOSE_DIR"
  dc_cmd logs -f --tail=200
}

function migrate() {
  cd "$COMPOSE_DIR"
  echo "Running migrations..."
  if dc_cmd ps --services | grep -q migrations >/dev/null 2>&1; then
    dc_cmd run --rm migrations
  else
    dc_cmd run --rm api npm run migrate
  fi
}

function seed() {
  cd "$COMPOSE_DIR"
  echo "Seeding admin user..."
  dc_cmd run --rm api npm run seed-admin
}

function backup() {
  mkdir -p "$BACKUP_DIR"
  ts=$(date -u +"%Y%m%dT%H%M%SZ")
  archive="$BACKUP_DIR/${APP_NAME}-api-data-${ts}.tar.gz"
  echo "Backing up volume $API_VOLUME_NAME to $archive"
  docker run --rm -v "${API_VOLUME_NAME}:/data:ro" -v "$BACKUP_DIR:/backup" alpine sh -c "cd /data && tar czf /backup/$(basename $archive) ."
  echo "Backup done: $archive"
}

function restore() {
  if [ "$#" -ne 1 ]; then
    die "Usage: $0 restore <backup-tar.gz>"
  fi
  archive_path="$1"
  if [ ! -f "$archive_path" ]; then
    die "Backup file not found: $archive_path"
  fi
  echo "Restoring $archive_path into volume $API_VOLUME_NAME"
  docker run --rm -v "${API_VOLUME_NAME}:/data" -v "$(cd $(dirname "$archive_path") && pwd):/backup" alpine sh -c "cd /data && tar xzf /backup/$(basename $archive_path)"
  echo "Restore completed"
}

function status() {
  cd "$COMPOSE_DIR"
  echo "Docker Compose file: $COMPOSE_FILE"
  docker --version || true
  dc_cmd ps
  echo
  echo "Volume: $API_VOLUME_NAME"
  docker volume inspect "$API_VOLUME_NAME" || true
}

case ${1:-start} in
  start)
    start
    ;;
  stop)
    stop
    ;;
  update)
    update
    ;;
  logs)
    logs
    ;;
  backup)
    backup
    ;;
  restore)
    restore "$2"
    ;;
  status)
    status
    ;;
  migrate)
    migrate
    ;;
  seed)
    seed
    ;;
  *)
    echo "Usage: $0 {start|stop|update|logs|backup|restore <file>|status|migrate|seed}"
    exit 1
    ;;
esac

