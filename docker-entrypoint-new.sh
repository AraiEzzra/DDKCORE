echo $(node -v)
# needs defined DB_HOST in environment
# and wait-port npm package installed

#if [ "$MODE" == "WATCH" ]; then
#    if [ ! -d node_modules ]; then
#        npm install
#    fi
#    nc -lk 5000 & npm run watch
#else
#    wait-port "$DB_HOST:${DB_PORT:-5432}" && \
#    if [ "$MODE" != "TEST" ]; then
#        wait-port "$WATCHER_HOST:$WATCHER_PORT"
#    fi
#    sleep 5
#    if [ "$MODE" == "TEST" ]; then
#        wait-port "$API_HOST:${API_PORT:-7008}"
#        wait-port "$CORE_HOST:${CORE_RPC_PORT:-7009}"
#        npm run test
#    fi
#    if [ "$SERVICE" == "API" ]; then
#        npm run server:api
#    fi
#    if [ "$SERVICE" == "CORE" ]; then
#        npm run server:core
#    fi
#    if [ "$SERVICE" == "MIGRATION" ]; then
#            npm run start:migration
#
#    fi
#
#fi

if [ "$SERVICE" == "MIGRATION" ]; then
    wait-port "$DB_HOST:${DB_PORT:-5432}" && \
    npm run start:migration

    fi
