FROM node:lts-alpine

EXPOSE 3000
WORKDIR /app

COPY ./package.json .
RUN npm install

COPY --exclude=cron . .

RUN npm run build

CMD ["npm", "run", "start"]