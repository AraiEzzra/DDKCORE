echo $(node -v)

wait-port "$DB_HOST:${DB_PORT:-5432}" && \
wait-port "$ELASTICSEARCH_HOST" && \
wait-port "$REDIS_HOST:${REDIS_PORT:-6379}" && \
wait-port "$HOST:${PORT:-7007}" && \
  npm run test
