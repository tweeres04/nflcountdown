FROM node:lts-alpine

WORKDIR /app

COPY ./cron/package.json ./cron/package-lock.json ./
RUN npm ci

COPY ./cron/crontab /etc/crontabs/root
COPY ./nba_colors.json /
COPY ./nhl_colors.json /
COPY ./wnba_colors.json /
COPY ./cpl_colors.json /
COPY ./cfl_colors.json /
COPY ./nsl_colors.json /
COPY ./cebl_colors.json /
COPY ./mls_colors.json /
COPY ./nwsl_colors.json /
COPY ./pwhl_colors.json /
COPY ./cron/getNbaSchedule.ts .
COPY ./cron/getNflSchedule.ts .
COPY ./cron/getMlbSchedule.ts .
COPY ./cron/getNhlSchedule.ts .
COPY ./cron/getWnbaSchedule.ts .
COPY ./cron/getCplSchedule.ts .
COPY ./cron/getCflSchedule.ts .
COPY ./cron/getNslSchedule.ts .
COPY ./cron/getCeblSchedule.ts .
COPY ./cron/getMlsSchedule.ts .
COPY ./cron/getNwslSchedule.ts .
COPY ./cron/getPwhlSchedule.ts .
COPY ./cfb_colors.json /
COPY ./cron/getCfbSchedule.ts .
COPY ./worldcup_colors.json /
COPY ./cron/getWorldCupSchedule.ts .
COPY ./wwc_colors.json /
COPY ./cron/getWwcSchedule.ts .

CMD ["crond", "-f", "-d", "8"]
