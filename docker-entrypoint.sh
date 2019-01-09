echo $(node -v)
# needs defined DB_HOST, ELASTICSEARCH_HOST and REDIS_HOST in environment
# and wait-port npm package installed

if [ "$MODE" == "WATCH" ]; then
    if [ ! -d node_modules ]; then
        npm install
    fi
    nc -lk 5000 & npm run watch
else
    wait-port "$DB_HOST:${DB_PORT:-5432}" && \
    wait-port "$ELASTICSEARCH_HOST" && \
    wait-port "$REDIS_HOST:${REDIS_PORT:-6379}" && \
    wait-port "10.6.0.7:5000" && \
    sleep 5
    npm start
fi
