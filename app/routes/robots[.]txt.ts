export async function loader() {
	const body = `User-Agent: *
Disallow:

Sitemap: https://teamcountdown.com/sitemap.xml`

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain',
		},
	})
}
