#!/usr/bin/env bash
set -euo pipefail

# start.sh - manage Docker deployment for the UTCN Research Portal
# Usage: ./start.sh [start|stop|update|logs|backup|restore|status]

APP_NAME="tucn-research-portal"
IMAGE_NAME="${APP_NAME}:latest"
CONTAINER_NAME="${APP_NAME}-ctr"
VOLUME_NAME="${APP_NAME}-data"
HOST_PORT=${HOST_PORT:-8080}

ROOT_DIR="$(cd "$(dirname "$0")" >/dev/null 2>&1 && pwd)"

function build_image() {
  echo "Building Docker image: ${IMAGE_NAME}..."
  docker build -t "${IMAGE_NAME}" "${ROOT_DIR}"
}

function ensure_volume() {
  if ! docker volume inspect "${VOLUME_NAME}" >/dev/null 2>&1; then
    echo "Creating named volume ${VOLUME_NAME}..."
    docker volume create "${VOLUME_NAME}"
  else
    echo "Volume ${VOLUME_NAME} already exists"
  fi
}

function start_container() {
  build_image
  ensure_volume

  if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Stopping and removing existing container ${CONTAINER_NAME}..."
    docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
  fi

  echo "Starting container ${CONTAINER_NAME} on host port ${HOST_PORT}..."
  # Mount the named volume to nginx html dir so site files persist across restarts
  docker run -d \
    --name "${CONTAINER_NAME}" \
    --restart unless-stopped \
    -p "${HOST_PORT}:80" \
    -v "${VOLUME_NAME}:/usr/share/nginx/html" \
    "${IMAGE_NAME}"

  echo "Container started. Access the app at http://localhost:${HOST_PORT}/"
}

function stop_container() {
  if docker ps -q -f name="^/${CONTAINER_NAME}$" | grep -q .; then
    echo "Stopping container ${CONTAINER_NAME}..."
    docker stop "${CONTAINER_NAME}"
  fi
  if docker ps -a -q -f name="^/${CONTAINER_NAME}$" | grep -q .; then
    echo "Removing container ${CONTAINER_NAME}..."
    docker rm -f "${CONTAINER_NAME}"
  fi
}

function update_container() {
  echo "Updating container with latest image..."
  build_image
  stop_container
  start_container
}

function show_logs() {
  docker logs -f --tail 200 "${CONTAINER_NAME}"
}

function backup_volume() {
  local out_dir="${ROOT_DIR}/docker-backups"
  mkdir -p "${out_dir}"
  local ts
  ts=$(date -u +"%Y%m%dT%H%M%SZ")
  local archive="${out_dir}/${APP_NAME}-data-${ts}.tar.gz"
  echo "Backing up volume ${VOLUME_NAME} to ${archive}..."
  docker run --rm -v "${VOLUME_NAME}:/data:ro" -v "${out_dir}:/backup" alpine sh -c "cd /data && tar czf /backup/$(basename ${archive}) ."
  echo "Backup completed: ${archive}"
}

function restore_volume() {
  if [ "$#" -ne 1 ]; then
    echo "Usage: $0 restore <backup-tar.gz>" >&2
    exit 2
  fi
  local archive_path="$1"
  if [ ! -f "${archive_path}" ]; then
    echo "Backup file not found: ${archive_path}" >&2
    exit 1
  fi
  echo "Restoring ${archive_path} into volume ${VOLUME_NAME}..."
  docker run --rm -v "${VOLUME_NAME}:/data" -v "$(pwd):/backup" alpine sh -c "cd /data && tar xzf /backup/$(basename ${archive_path})"
  echo "Restore completed."
}

function status() {
  echo "Container: ${CONTAINER_NAME}"
  docker ps -a --filter name="${CONTAINER_NAME}"
  echo
  echo "Volume: ${VOLUME_NAME}"
  docker volume inspect "${VOLUME_NAME}" || true
}

case ${1:-start} in
  start)
    start_container
    ;;
  stop)
    stop_container
    ;;
  update)
    update_container
    ;;
  logs)
    show_logs
    ;;
  backup)
    backup_volume
    ;;
  restore)
    restore_volume "$2"
    ;;
  status)
    status
    ;;
  *)
    echo "Usage: $0 {start|stop|update|logs|backup|restore <file>|status}"
    exit 1
    ;;
esac
