echo $(node -v)
# needs defined DB_HOST, ELASTICSEARCH_HOST and REDIS_HOST in environment
# and wait-port npm package installed

wait-port "$DB_HOST:${DB_PORT:-5432}" &&
#wait-port "$ELASTICSEARCH_HOST" && \
#wait-port "$REDIS_HOST:${REDIS_PORT:-6379}" && \
npm start
