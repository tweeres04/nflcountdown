FROM node:lts-alpine

WORKDIR /app

COPY ./cron/package.json .
RUN npm install

COPY ./cron/crontab /etc/crontabs/root
COPY ./nba_colors.json /
COPY ./cron/getNbaSchedule.ts .

CMD ["crond", "-f", "-d", "8"]
