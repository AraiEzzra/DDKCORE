echo $(node -v)
# needs defined DB_HOST in environment
# and wait-port npm package installed

if [ "$MODE" == "WATCH" ]; then
    if [ ! -d node_modules ]; then
        npm install
    fi
    nc -lk 5000 & npm run watch
else
    wait-port "$DB_HOST:${DB_PORT:-5432}" && \
    wait-port "$WATCHER_HOST:$WATCHER_PORT"
    sleep 5
        if [ "$MODE" == "TEST" ]; then
            npm run test
        fi
        if [ "$SERVICE" == "API" ]; then
            npm run server:api
        fi
        if [ "$SERVICE" == "CORE" ]; then
            npm run server:core
        fi
fi
