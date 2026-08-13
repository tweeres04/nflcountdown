#!/bin/bash
# Pull a consistent snapshot of the production database and swap it in as
# the local dev db. VACUUM INTO takes a clean copy even while the app is
# writing (never copy the live file directly; a mid-write copy can be torn).
set -e

ssh server "cd nflcountdown && rm -f data/snapshot.db && docker compose exec -T teamcountdown node -e \"require('@libsql/client').createClient({ url: 'file:./data/teamcountdown.db' }).execute(\\\"VACUUM INTO './data/snapshot.db'\\\").then(() => console.log('snapshot created'))\""
scp server:nflcountdown/data/snapshot.db ./data/teamcountdown.db
# Stale journal files from the old local db must not replay onto the snapshot
rm -f ./data/teamcountdown.db-wal ./data/teamcountdown.db-shm
echo "Local data/teamcountdown.db replaced with a prod snapshot (restart the dev server if it's running)"
