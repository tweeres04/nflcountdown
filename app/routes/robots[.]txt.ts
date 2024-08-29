export async function loader() {
	const LEAGUE = (process.env.LEAGUE ?? 'NFL').toLowerCase()

	const body = `User-Agent: *
Disallow:

Sitemap: https://${LEAGUE}countdown.tweeres.com/sitemap.xml`

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain',
		},
	})
}
