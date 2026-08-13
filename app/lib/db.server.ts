import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema.server'

const client = createClient({
	url: process.env.DATABASE_URL ?? 'file:./data/teamcountdown.db',
})

// busy_timeout first so the WAL pragma itself waits for the lock instead of
// failing when another process (dev server, build workers) has the db open.
// busy_timeout is per-connection; journal_mode persists in the db file but
// setting it here keeps fresh databases correct too.
client.executeMultiple('PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;')

export const db = drizzle(client, { schema })
