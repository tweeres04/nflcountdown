FROM node:lts-alpine

# Install Chromium for Puppeteer
RUN apk add --no-cache chromium

# Use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
	PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY ./cron/package.json .
RUN npm install

COPY ./cron/crontab /etc/crontabs/root
COPY ./nba_colors.json /
COPY ./cron/getNbaSchedule.ts .

CMD ["crond", "-f", "-d", "8"]
