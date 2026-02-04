FROM node:lts-alpine

# Install Chromium for Puppeteer
RUN apk add --no-cache chromium

# Use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
	PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY ./cron/package.json ./cron/package-lock.json ./
RUN npm ci

COPY ./cron/crontab /etc/crontabs/root
COPY ./nba_colors.json /
COPY ./nhl_colors.json /
COPY ./wnba_colors.json /
COPY ./mls_colors.json /
COPY ./cron/getNbaSchedule.ts .
COPY ./cron/getNflSchedule.ts .
COPY ./cron/getMlbSchedule.ts .
COPY ./cron/getNhlSchedule.ts .
COPY ./cron/getWnbaSchedule.ts .
COPY ./cron/getMlsSchedule.ts .

CMD ["crond", "-f", "-d", "8"]
