echo $(node -v)
# needs defined DB_HOST, ELASTICSEARCH_HOST and REDIS_HOST in environment
# and wait-port npm package installed

if [ "$MODE" == "WATCH" ]; then
    if [ ! -d node_modules ]; then
        npm install
    fi
    nc -lk 5000 & npm run watch:core
else
    if [ "$MODE" == "TEST" ]; then
        wait-port "$HOST:${PORT:-7007}"
        npm run test
    else
        # wait-port "$DB_HOST:${DB_PORT:-5432}" && \
        wait-port "$WATCHER_HOST:$WATCHER_PORT" && \
        sleep 5
        npm run server:core
    fi
fi
