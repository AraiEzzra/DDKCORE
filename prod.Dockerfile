FROM    node:10-alpine
RUN     apk add --no-cache python curl bash automake autoconf libtool git alpine-sdk postgresql-dev netcat-openbsd
RUN     addgroup ddk -g 1100 && \
        adduser -D -u 1100 ddk -G ddk

WORKDIR /home/ddk
RUN     mkdir -p /home/DDK.REGISTRY && chmod -R 777 /home/DDK.REGISTRY

USER    ddk
RUN     mkdir -p /home/ddk && chmod -R 777 /home/ddk && \
        mkdir -p /home/ddk/dist && mkdir -p /home/ddk/dist/core && mkdir -p /home/ddk/dist/api && \
        mkdir -p /home/ddk/logs && \
        touch /home/ddk/LICENSE

USER    root
RUN     npm install --global npm@latest && \
        npm install --global node-gyp@latest && \
        npm install --global wait-port@latest

USER ddk
WORKDIR /home/DDK.REGISTRY
RUN     git clone https://github.com/AraiEzzra/DDK.REGISTRY.git .

WORKDIR /home/ddk
COPY    ./package*.json /home/ddk/
RUN     npm install

COPY    --chown=ddk . /home/ddk
RUN     npm run build
COPY    --chown=ddk docker-entrypoint-prod.sh /home/ddk/docker-entrypoint-prod.sh

USER    root
RUN     chmod +x /home/ddk/docker-entrypoint-prod.sh

USER    ddk
ENTRYPOINT ["/bin/bash", "/home/ddk/docker-entrypoint-prod.sh"]
