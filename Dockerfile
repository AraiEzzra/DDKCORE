FROM node:8.9.4
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json .
RUN npm install
COPY . .
EXPOSE 7001
CMD ["node","app.js"]
#CMD echo "starting app" && setsid node app.js && : >> /usr/src/app/logs/2018-08-16.log && tail -f /usr/src/app/logs/2018-08-16.log

