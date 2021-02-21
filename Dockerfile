FROM node:10-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY ./src/ ./src/
COPY ./lib/ ./lib/
COPY ./tsconfig.json ./tsconfig.json


RUN npm run build


EXPOSE 3001

CMD [ "node", "./dist/src/index.js" ]