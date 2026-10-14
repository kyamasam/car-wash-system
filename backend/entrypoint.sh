#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
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
except Exception:
    sys.exit(1)
" 2>/dev/null; do
    echo "PostgreSQL not ready, retrying in 2s..."
    sleep 2
done
echo "PostgreSQL is ready."

python manage.py migrate --noinput
python manage.py collectstatic --noinput

if [ "${ROLE}" = "worker" ]; then
    exec celery -A backend worker -l info -Q "${CELERY_TASK_DEFAULT_QUEUE:-sf_networks}"
elif [ "${ROLE}" = "beat" ]; then
    exec celery -A backend beat -l info
else
    exec uvicorn backend.asgi:application --host 0.0.0.0 --port 8000 --workers 4
fi
