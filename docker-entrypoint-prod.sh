echo $(node -v)
# needs defined DB_HOST in environment
# and wait-port npm package installed
wait-port "$DB_HOST:${DB_PORT:-5432}"
sleep 5
npm run server:core
