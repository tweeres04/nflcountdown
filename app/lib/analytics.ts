import mixpanel from 'mixpanel-browser'

/**
 * Thin wrapper over Mixpanel that mirrors every call to both the primary
 * and legacy project instances. Once the legacy project is retired, replace
 * every `import { analytics } from '~/lib/analytics'` with
 * `import mixpanel from 'mixpanel-browser'` and delete this file.
 */

const legacy = 'legacy'

export function initAnalytics(
	primaryToken: string,
	legacyToken: string | undefined,
	config: Exclude<Parameters<typeof mixpanel.init>[1], undefined>
) {
	mixpanel.init(primaryToken, config)

	if (legacyToken) {
		mixpanel.init(legacyToken, config, legacy)
	}
}

function getLegacy(): typeof mixpanel | undefined {
	try {
		// Named instances are accessed as properties on the mixpanel object
		return (mixpanel as any)[legacy] as typeof mixpanel | undefined
	} catch {
		return undefined
	}
}

export const analytics = {
	track(...args: Parameters<typeof mixpanel.track>) {
		mixpanel.track(...args)
		getLegacy()?.track(...args)
	},

	register(...args: Parameters<typeof mixpanel.register>) {
		mixpanel.register(...args)
		getLegacy()?.register(...args)
	},
}
