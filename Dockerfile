FROM node:8.9.4
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json .
RUN npm install
COPY . .
RUN mkdir logs || true
EXPOSE 7000
CMD ["NODE_ENV=mainnet","node","--max_old_space_size=8000","app.js"]
