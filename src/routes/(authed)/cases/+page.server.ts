import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ fetch, locals }) => {
	try {
		const res = await fetch('/api/tasks?latest=true');
		const latestTasks = await res.json();

		const resCases = await fetch('/api/cases');
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
