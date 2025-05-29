import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const resTasks = await fetch('/api/tasks');
		const tasks = await resTasks.json();
		return { tasks };
	} catch {
		throw error(404, 'Fail to fetch tasks.');
	}
};
