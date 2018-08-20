FROM node:8.9.4
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json .
RUN npm install
COPY . .
RUN apt-get update && apt-get install awscli -y
EXPOSE 7001
#CMD ["node","app.js"]
CMD ["./docker/entrypoint.sh"]
