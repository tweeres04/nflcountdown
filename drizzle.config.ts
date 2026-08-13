import { defineConfig } from 'drizzle-kit'

export default defineConfig({
	schema: './app/lib/schema.server.ts',
	dialect: 'sqlite',
	dbCredentials: {
		url: process.env.DATABASE_URL ?? 'file:./data/teamcountdown.db',
	},
})
