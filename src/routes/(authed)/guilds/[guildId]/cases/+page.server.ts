import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	try {
		const res = await fetch(`/api/guilds/${params.guildId}/taskHistory?latest=true`);
		const latestTasks = await res.json();

		const resCases = await fetch(`/api/guilds/${params.guildId}/cases`);
		const cases = await resCases.json();

		return {
			latestTasks,
			cases,
			user: locals.user
		};
	} catch {
		throw error(404, 'Fail to fetch cases.');
	}
};
