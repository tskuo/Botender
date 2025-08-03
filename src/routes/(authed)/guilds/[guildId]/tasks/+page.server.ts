import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, fetch }) => {
	try {
		const res = await fetch(`/api/guilds/${params.guildId}/taskHistory?latest=true`);
		const latestTasks = await res.json();
		return {
			latestTasks
		};
	} catch {
		throw error(404, 'Fail to fetch tasks.');
	}
};
