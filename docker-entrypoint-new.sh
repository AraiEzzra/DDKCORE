echo $(node -v)
echo $(id -u -n)
# needs defined DB_HOST in environment
# and wait-port npm package installed

if [ "$SERVICE" == "WATCH" ]; then
    if [ ! -d node_modules ]; then
        npm install
    fi
    npm update ddk.registry
    nc -lk 5000 & npm run watch
else
    wait-port "$DB_HOST:${DB_PORT:-5432}" && \
    if [ "$MODE" == "WATCH" ]; then
        wait-port "$WATCHER_HOST:$WATCHER_PORT"
    fi
    sleep 5
    if [ "$SERVICE" == "TEST" ]; then
        wait-port "$API_HOST:${API_PORT:-7008}"
        wait-port "$CORE_HOST:${CORE_RPC_PORT:-7009}"
        npm run test
    fi
    if [ "$SERVICE" == "TEST_FUNCTIONALITY" ]; then
        npm run test:functionality
    fi
    if [ "$SERVICE" == "TEST_LAB" ]; then
        npm run test:lab
    fi
    if [ "$SERVICE" == "API" ]; then
        npm run server:api
    fi
    if [ "$SERVICE" == "CORE" ]; then
        if [ "$MODE" == "DEBUG" ]; then
            npm run debug:core
        else
            npm run server:core
        fi
    fi
fi
