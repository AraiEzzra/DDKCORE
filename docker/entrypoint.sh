#!/bin/bash

aws s3 cp s3://ddk-prod-mainnet-env/.env . --region ap-southeast-1
node app.js

/bin/bash
exec "$@";
