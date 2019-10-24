FROM    node:10-alpine

RUN     apk add --no-cache python curl bash automake autoconf libtool git alpine-sdk postgresql-dev netcat-openbsd libsodium

WORKDIR /home/ddk
RUN     mkdir -p /home/ddk && chmod -R 777 /home/ddk && \
        mkdir -p /home/ddk/dist && chmod -R 777  /home/ddk/dist && \
        mkdir -p /home/ddk/logs && chmod -R 777 /home/ddk/logs && \
        mkdir -p /home/DDK.REGISTRY && chmod -R 777 /home/DDK.REGISTRY && \
        touch /home/ddk/LICENSE

RUN     npm install --global npm@latest && \
        npm install --global node-gyp@latest && \
        npm install --global wait-port@latest

COPY    docker-entrypoint-new.sh /home/ddk/docker-entrypoint-new.sh

RUN     chmod +x /home/ddk/docker-entrypoint-new.sh

CMD     ["/bin/bash", "/home/ddk/docker-entrypoint-new.sh"]
