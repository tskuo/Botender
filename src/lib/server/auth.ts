import Discord from '@auth/sveltekit/providers/discord';
import { SvelteKitAuth } from '@auth/sveltekit';
import {
	DISCORD_CLIENT_ID,
	DISCORD_CLIENT_SECRET,
	AUTH_SECRET,
	DISCORD_TOKEN
} from '$env/static/private';

const DISCORD_API_BASE = 'https://discord.com/api/v10';

// Store the bot's guilds in a cache to avoid refetching on every session check
let botGuildsCache: { id: string; name: string }[] | null = null;
let cacheTimestamp = 0;

/**
 * Fetches the guilds that the BOT is a member of.
 * Caches the result for 5 minutes to avoid excessive API calls.
 */
async function getBotGuilds(): Promise<{ id: string; name: string }[]> {
	const now = Date.now();
	// Cache is valid for 5 minutes (300,000 ms)
	if (botGuildsCache && now - cacheTimestamp < 300000) {
		return botGuildsCache;
	}

	try {
		const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
			headers: { Authorization: `Bot ${DISCORD_TOKEN}` }
		});
		if (!response.ok) return [];
		const guilds = await response.json();
		botGuildsCache = guilds.map((guild: any) => ({ id: guild.id, name: guild.name }));
		cacheTimestamp = now;
		return botGuildsCache || [];
	} catch (error) {
		console.error('Error fetching bot guilds:', error);
		return [];
	}
}

/**
 * Fetches the guilds that a USER is a member of.
 */
async function getUserGuilds(accessToken: string): Promise<{ id: string; name: string }[]> {
	try {
		const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
			headers: { Authorization: `Bearer ${accessToken}` }
		});
		if (!response.ok) return [];
		const guilds = await response.json();
		return guilds.map((guild: any) => ({ id: guild.id, name: guild.name }));
	} catch (error) {
		console.error('Error fetching user guilds:', error);
		return [];
	}
}

export const { handle, signIn, signOut } = SvelteKitAuth({
	trustHost: true,
	providers: [
		Discord({
			clientId: DISCORD_CLIENT_ID,
			clientSecret: DISCORD_CLIENT_SECRET,
			authorization: { params: { scope: 'identify guilds' } }
		})
	],
	secret: AUTH_SECRET,
	pages: {
		signIn: '/',
		error: '/auth/error'
	},
	callbacks: {
		async jwt({ token, account }) {
			if (account?.access_token) {
				token.accessToken = account.access_token;
			}
			if (token.sub) {
				token.id = token.sub;
			}
			return token;
		},
		async session({ session, token }) {
			if (token.id && session.user) {
				session.user.id = token.id as string;
			}

			if (token.accessToken) {
				const [userGuilds, botGuilds] = await Promise.all([
					getUserGuilds(token.accessToken as string),
					getBotGuilds()
				]);

				// Find the intersection of the two lists
				const botGuildIds = new Set(botGuilds.map((g) => g.id));
				const validGuilds = userGuilds.filter((guild) => botGuildIds.has(guild.id));

				session.user.guilds = validGuilds;
				session.user.accessToken = token.accessToken as string;
			}
			return session;
		},
		async redirect({ url, baseUrl }) {
			// After successful sign-in, redirect to the intended page or the guilds page
			if (url.startsWith(baseUrl)) {
				return url;
			}
			return `${baseUrl}/guilds`;
		}
	}
});
