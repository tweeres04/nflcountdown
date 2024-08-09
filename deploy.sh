ssh server -T <<'EOL'
	cd nflcountdown && \
	git fetch && git reset --hard origin/main && \
	docker compose up --build -d
EOL