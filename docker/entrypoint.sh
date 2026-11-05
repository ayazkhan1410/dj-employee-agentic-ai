#!/bin/sh
set -e

echo "Waiting for MySQL at ${DB_HOST}:${DB_PORT}..."
until python - <<'PY'
import os
import sys

import MySQLdb

try:
    MySQLdb.connect(
        host=os.environ["DB_HOST"],
        user=os.environ["DB_USER"],
        passwd=os.environ["DB_PASSWORD"],
        db=os.environ["DB_NAME"],
        port=int(os.environ.get("DB_PORT", "3306")),
        connect_timeout=2,
    )
except MySQLdb.Error:
    sys.exit(1)
PY
do
  sleep 2
done

echo "MySQL is ready. Running migrations..."
python manage.py migrate --noinput

echo "Starting Django on 0.0.0.0:8000..."
exec python manage.py runserver 0.0.0.0:8000
