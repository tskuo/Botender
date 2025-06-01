import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { playgroundRunFormSchema } from '$lib/schema';
import { zod } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const resTasks = await fetch('/api/tasks');
		const tasks: Task[] = await resTasks.json();

		return {
			tasks,
			form: await superValidate(zod(playgroundRunFormSchema))
		};
	} catch {
		throw error(404, 'Fail to fetch tasks.');
	}
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const form = await superValidate(formData, zod(playgroundRunFormSchema));
		// const form = await superValidate(event, zod(playgroundRunFormSchema));
		if (!form.valid) {
			return fail(400, { form });
		}
		console.log(formData.get('playgroundTasks'));
		console.log(form.data.channel);
		return {
			form
		};
	}
};
