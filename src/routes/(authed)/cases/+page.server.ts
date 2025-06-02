import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const resTasks = await fetch('/api/tasks');
		const tasks: Task[] = await resTasks.json();

		const resCases = await fetch('/api/cases');
		const cases = await resCases.json();

		return {
			tasks,
			cases
		};
	} catch {
		throw error(404, 'Fail to fetch tasks.');
	}
};
