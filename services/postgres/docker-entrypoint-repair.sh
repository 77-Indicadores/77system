#!/bin/sh
set -eu

if [ "${1:-}" = "postgres" ] && [ -s "${PGDATA:-/var/lib/postgresql/data}/PG_VERSION" ]; then
  escaped_password="$(printf "%s" "${POSTGRES_PASSWORD:-postgres}" | sed "s/'/''/g")"

  echo "repair-postgres-role: fixing persisted postgres role login state"
  cat <<SQL | su-exec postgres postgres --single -D "${PGDATA:-/var/lib/postgresql/data}" postgres >/dev/null
ALTER ROLE postgres WITH LOGIN PASSWORD '${escaped_password}';
SQL
fi

exec /usr/local/bin/docker-entrypoint.sh "$@"
