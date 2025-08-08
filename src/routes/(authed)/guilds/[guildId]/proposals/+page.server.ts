import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { proposalsCreateProposalSchema } from '$lib/schema.js';
import { zod } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	try {
		const resProposals = await fetch(`/api/guilds/${params.guildId}/proposals`);
		const proposals = await resProposals.json();

		const proposalsWithLatestEdit = await Promise.all(
			proposals.map(async (proposal: Proposal) => {
				const resEdits = await fetch(
					`/api/guilds/${params.guildId}/proposals/${proposal.id}/edits?latest=true`
				);
				const edits = resEdits.ok ? await resEdits.json() : [];
				return {
					...proposal,
					...edits
				};
			})
		);

		return {
			proposals: proposalsWithLatestEdit,
			formProposal: await superValidate(zod(proposalsCreateProposalSchema)),
			user: locals.user
		};
	} catch {
		throw error(404, 'Fail to fetch proposals.');
	}
};

export const actions: Actions = {
	createProposal: async (event) => {
		const formProposal = await superValidate(event, zod(proposalsCreateProposalSchema));
		if (!formProposal.valid) {
			return fail(400, { formProposal });
		}

		// Create Proposal
		const resProposal = await event.fetch(`/api/guilds/${event.params.guildId}/proposals`, {
			method: 'POST',
			body: JSON.stringify({ formProposal }),
			headers: {
				'Content-Type': 'application/json'
			}
		});
		if (!resProposal.ok) {
			return fail(400, { formProposal });
		}
		const dataProposal = await resProposal.json();

		throw redirect(303, `/guilds/${event.params.guildId}/proposals/${dataProposal.id}`);
	}
};
