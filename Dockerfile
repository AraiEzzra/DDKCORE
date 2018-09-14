FROM node:8.9.4
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json .
RUN npm install
COPY . .
RUN mkdir logs || true
ARG NODE_ENV=mainnet
ENV NODE_ENV=$NODE_ENV
EXPOSE 7000
CMD ["node","--max_old_space_size=8000","app.js"]
