FROM    node:10-alpine

RUN     apk add --no-cache python curl bash automake autoconf libtool git alpine-sdk postgresql-dev netcat-openbsd
RUN     addgroup ddk -g 1100 && \
        adduser -D -u 1100 ddk -G ddk

WORKDIR /home/ddk
USER    ddk
RUN     mkdir -p /home/ddk && \
        chmod -R 777 /home/ddk && \
        mkdir -p /home/ddk/dist && \
        mkdir -p /home/ddk/logs && \
        touch /home/ddk/LICENSE

USER    root
RUN     npm install --global npm@latest && \
        npm install --global node-gyp@latest && \
        npm install --global wait-port@latest

USER    ddk
COPY    --chown=ddk docker-entrypoint-new.sh /home/ddk/docker-entrypoint-new.sh

USER    root
RUN     chmod +x /home/ddk/docker-entrypoint-new.sh

USER ddk
CMD     ["/bin/bash", "/home/ddk/docker-entrypoint-new.sh"]
