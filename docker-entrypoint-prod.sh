echo $(node -v)
# needs defined DB_HOST in environment
# and wait-port npm package installed
wait-port "$DB_HOST:${DB_PORT:-5432}"

if [ "$SERVICE" == "TEST" ]; then
    wait-port "$API_HOST:${API_PORT:-7008}"
    wait-port "$CORE_HOST:${CORE_RPC_PORT:-7009}"
    npm run test
fi
if [ "$SERVICE" == "API" ]; then
    if [ "$PROFILING" == "TRUE" ]; then
        npm run start:api:profiling
    else
        npm run start:api
    fi
fi
if [ "$SERVICE" == "CORE" ]; then
    if [ "$PROFILING" == "TRUE" ]; then
        npm run start:core:profiling
    else
        npm run start:core
    fi
fi
