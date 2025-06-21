import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { playgroundCreateCaseSchema, playgroundCreateProposalSchema } from '$lib/schema.js';

import { zod } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async ({ fetch, locals }) => {
	try {
		const res = await fetch('/api/tasks?latest=true');
		const latestTasks = await res.json();

		return {
			latestTasks,
			form: await superValidate(zod(playgroundCreateCaseSchema)),
			formProposal: await superValidate(zod(playgroundCreateProposalSchema)),
			user: locals.user
		};
	} catch {
		throw error(404, 'Fail to fetch the latest tasks.');
	}
};

export const actions: Actions = {
	createCase: async (event) => {
		const formCase = await superValidate(event, zod(playgroundCreateCaseSchema));

		if (!formCase.valid) {
			return fail(400, { formCase });
		}

		const resCase = await event.fetch('/api/cases', {
			method: 'POST',
			body: JSON.stringify({ formCase }),
			headers: {
				'Content-Type': 'appplication/json'
			}
		});

		if (!resCase.ok) {
			return fail(400, { formCase });
		}

		return {
			formCase
		};
	},
	createProposal: async (event) => {
		const formProposal = await superValidate(event, zod(playgroundCreateProposalSchema));

		if (!formProposal.valid) {
			return fail(400, { formProposal });
		}

		const resProposal = await event.fetch('/api/proposals', {
			method: 'POST',
			body: JSON.stringify({ formProposal }),
			headers: {
				'Content-Type': 'appplication/json'
			}
		});
		if (!resProposal.ok) {
			return fail(400, { formProposal });
		}
		// Redirect to the newly created proposal
		const data = await resProposal.json();
		throw redirect(303, `/proposals/${data.id}`);
	}
};
