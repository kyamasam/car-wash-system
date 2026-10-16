#!/bin/sh
set -e

ROLE_NAME="${ROLE:-web}"
CURRENT_STEP="init"

log() {
    echo "[entrypoint][${ROLE_NAME}] $(date -u '+%Y-%m-%dT%H:%M:%SZ') $*"
}

# Report which step was running if the script exits with an error
on_exit() {
    status=$?
    if [ "$status" -ne 0 ]; then
        log "FAILED during step '${CURRENT_STEP}' (exit code ${status})"
    fi
}
trap on_exit EXIT

log "Starting container (python: $(python --version 2>&1))"

CURRENT_STEP="wait-for-postgres"
log "Waiting for PostgreSQL at ${PG_HOST}:${PG_PORT:-5432}/${PG_NAME}..."
until python -c "
import psycopg2, os, sys
try:
    psycopg2.connect(
        dbname=os.environ['PG_NAME'],
        user=os.environ['PG_USER'],
        password=os.environ['PG_PASSWORD'],
        host=os.environ['PG_HOST'],
        port=os.environ.get('PG_PORT', '5432'),
    )
    sys.exit(0)
except Exception as e:
    print(f'  -> {type(e).__name__}: {e}'.strip(), file=sys.stderr)
    sys.exit(1)
"; do
    log "PostgreSQL not ready, retrying in 2s..."
    sleep 2
done
log "PostgreSQL is ready."

CURRENT_STEP="django-check"
log "Running Django system checks..."
python manage.py check --deploy --fail-level ERROR

CURRENT_STEP="migrate"
log "Applying migrations..."
python manage.py migrate --noinput
log "Migrations applied."

CURRENT_STEP="collectstatic"
log "Collecting static files..."
python manage.py collectstatic --noinput
log "Static files collected."

CURRENT_STEP="start-${ROLE_NAME}"
if [ "${ROLE}" = "worker" ]; then
    log "Starting celery worker (queue: ${CELERY_TASK_DEFAULT_QUEUE:-sf_networks})"
    exec celery -A backend worker -l info -Q "${CELERY_TASK_DEFAULT_QUEUE:-sf_networks}"
elif [ "${ROLE}" = "beat" ]; then
    log "Starting celery beat"
    exec celery -A backend beat -l info
else
    log "Starting uvicorn on 0.0.0.0:8000 (workers: ${UVICORN_WORKERS:-4}, log level: ${UVICORN_LOG_LEVEL:-info})"
    exec uvicorn backend.asgi:application \
        --host 0.0.0.0 --port 8000 \
        --workers "${UVICORN_WORKERS:-4}" \
        --log-level "${UVICORN_LOG_LEVEL:-info}" \
        --access-log \
        --proxy-headers --forwarded-allow-ips='*'
fi
