FROM node:20 AS build

WORKDIR /app

RUN npm install

COPY . .

COPY .env .env

EXPOSE 8080

RUN npm install --only=production

CMD ["node", "server.js"]