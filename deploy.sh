ssh server -T <<'EOL'
	cp -r nflcountdown/data /tmp/nflcountdown-data && \
	cd nflcountdown && \
	git fetch && git reset --hard origin/main && \
	docker compose up --build -d && \
	cp -r /tmp/nflcountdown-data nflcountdown/data; \
	rm -rf /tmp/nflcountdown-data
EOL
