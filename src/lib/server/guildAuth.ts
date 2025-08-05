import { error, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Middleware to check if user has access to a specific guild
 */
export function requireGuildAccess(event: RequestEvent, guildId: string) {
	const { user } = event.locals;

	// Check if user is logged in
	if (!user) {
		throw redirect(302, `/?callbackUrl=${encodeURIComponent(event.url.pathname)}`);
	}

	// Check if user has access to this guild by checking the ID within the guild objects
	if (!user.guilds?.some((guild) => guild.id === guildId)) {
		throw error(403, 'You do not have access to this Discord server.');
	}

	return user;
}
