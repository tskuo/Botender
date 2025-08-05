import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
// import { createCaseSchema } from '$lib/schema.js';
import { playgroundCreateProposalSchema } from '$lib/schema.js';

import { zod } from 'sveltekit-superforms/adapters';

import _ from 'lodash';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	try {
		const res = await fetch(`/api/guilds/${params.guildId}/taskHistory?latest=true`);
		const latestTasks = await res.json();

		const resGuild = await fetch(`/api/guilds/${params.guildId}`);
		const guild = await resGuild.json();

		return {
			latestTasks,
			guild,
			// form: await superValidate(zod(createCaseSchema)),
			formProposal: await superValidate(zod(playgroundCreateProposalSchema)),
			user: locals.user
		};
	} catch {
		throw error(404, 'Fail to fetch the latest tasks.');
	}
};

export const actions: Actions = {
	// createCase: async (event) => {
	// 	const formCase = await superValidate(event, zod(createCaseSchema));

	// 	if (!formCase.valid) {
	// 		return fail(400, { formCase });
	// 	}

	// 	const resCase = await event.fetch('/api/cases', {
	// 		method: 'POST',
	// 		body: JSON.stringify({ formCase }),
	// 		headers: {
	// 			'Content-Type': 'appplication/json'
	// 		}
	// 	});

	// 	if (!resCase.ok) {
	// 		return fail(400, { formCase });
	// 	}

	// 	return {
	// 		formCase
	// 	};
	// },
	createProposal: async (event) => {
		const formData = await event.request.formData();
		const formProposal = await superValidate(formData, zod(playgroundCreateProposalSchema));
		if (!formProposal.valid) {
			return fail(400, { formProposal });
		}

		// Create Proposal
		const resProposal = await event.fetch(`/api/guilds/${event.params.guildId}/proposals`, {
			method: 'POST',
			body: JSON.stringify({ formProposal }),
			headers: {
				'Content-Type': 'appplication/json'
			}
		});
		if (!resProposal.ok) {
			return fail(400, { formProposal });
		}
		const dataProposal = await resProposal.json();

		// Create Proposed Edit (If Needed)
		let editId = undefined;
		const editedTasks = formData.get('editedTasks');
		if (!_.isNil(editedTasks) && typeof editedTasks === 'string') {
			const resEdit = await event.fetch(
				`/api/guilds/${event.params.guildId}/proposals/${dataProposal.id}/edits`,
				{
					method: 'POST',
					body: JSON.stringify({
						tasks: JSON.parse(editedTasks),
						editor: formProposal.data.initiator,
						editorId: formProposal.data.initiatorId
					}),
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);
			if (resEdit.ok) {
				const resEditData = await resEdit.json();
				editId = resEditData.id;
			}
		}

		// Create Case
		const resCase = await event.fetch(`/api/guilds/${event.params.guildId}/cases`, {
			method: 'POST',
			body: JSON.stringify({
				formCase: {
					data: {
						channel: formProposal.data.channel,
						realUserMessage: formProposal.data.realUserMessage,
						source: formProposal.data.source,
						userMessage: formProposal.data.userMessage,
						botResponse: formProposal.data.botResponse,
						proposalEditId: editId === undefined ? '' : editId,
						proposalId: editId === undefined ? '' : dataProposal.id,
						taskHistoryId: editId === undefined ? formProposal.data.taskHistoryId : '',
						triggeredTaskId: formProposal.data.triggeredTaskId,
						thumbsUp: [], // TODO
						thumbsDown: [] // TODo
					}
				}
			}),
			headers: {
				'Content-Type': 'appplication/json'
			}
		});
		const dataCase = await resCase.json();

		await event.fetch(`/api/guilds/${event.params.guildId}/proposals/${dataProposal.id}`, {
			method: 'PATCH',
			body: JSON.stringify({
				action: 'addCase',
				caseId: dataCase.id
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});

		// Redirect to the newly created proposal
		throw redirect(303, `/guilds/${event.params.guildId}/proposals/${dataProposal.id}`);
	}
};
