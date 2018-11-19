#!/bin/sh

echo $(node -v)
# needs defined db, elasticsearch and redis in docker-compose
# and wait-port npm package installed
wait-port db:5432 && \
wait-port elasticsearch:9200 && \
wait-port redis:6379 && \
if [[ -v DEBUG ]]; then
  npm run debug
else
  npm start
fi
