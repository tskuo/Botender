import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { playgroundCreateCaseSchema } from '$lib/schema.js';

import { zod } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const resTasks = await fetch('/api/tasks');
		const tasks: Task[] = await resTasks.json();

		return {
			tasks,
			form: await superValidate(zod(playgroundCreateCaseSchema))
		};
	} catch {
		throw error(404, 'Fail to fetch tasks.');
	}
};

export const actions: Actions = {
	createCase: async (event) => {
		const form = await superValidate(event, zod(playgroundCreateCaseSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const resCase = await event.fetch('/api/cases', {
			method: 'POST',
			body: JSON.stringify({ form }),
			headers: {
				'Content-Type': 'appplication/json'
			}
		});

		console.log(resCase.ok);

		return {
			form
		};
	}
};
