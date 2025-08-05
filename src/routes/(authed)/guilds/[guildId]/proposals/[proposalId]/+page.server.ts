import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, fetch, locals, depends }) => {
	depends('app:proposal-page-data');
	try {
		const resProposal = await fetch(`/api/guilds/${params.guildId}/proposals/${params.proposalId}`);
		const proposal = await resProposal.json();

		const resEdits = await fetch(
			`/api/guilds/${params.guildId}/proposals/${params.proposalId}/edits`
		);
		const edits = await resEdits.json();

		const resOriginalTasks = await fetch(
			`/api/guilds/${params.guildId}/taskHistory/${proposal.taskHistoryId}`
		);
		const originalTasks = await resOriginalTasks.json();

		const resLatestTasks = await fetch(`/api/guilds/${params.guildId}/taskHistory?latest=true`);
		const latestTasks = await resLatestTasks.json();

		const testCases = [];

		for (const caseId of proposal.testCases) {
			const resCase = await fetch(`/api/guilds/${params.guildId}/cases/${caseId}`);
			if (resCase.ok) {
				const testCase = await resCase.json();
				testCases.push(testCase);
			}
		}

		const resGuild = await fetch(`/api/guilds/${params.guildId}`);
		const guild = await resGuild.json();

		return {
			proposal,
			edits: edits.edits,
			originalTasks,
			latestTasks,
			testCases,
			user: locals.user,
			guild
		};
	} catch {
		throw error(404, 'Fail to fetch the proposal.');
	}
};
