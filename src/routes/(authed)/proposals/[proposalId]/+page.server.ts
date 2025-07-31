import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	try {
		const resProposal = await fetch(`/api/proposals/${params.proposalId}`);
		const proposal = await resProposal.json();

		const resEdits = await fetch(`/api/proposals/${params.proposalId}/edits`);
		const edits = await resEdits.json();

		const resOriginalTasks = await fetch(`/api/taskHistory/${proposal.taskHistoryId}`);
		const originalTasks = await resOriginalTasks.json();

		const resLatestTasks = await fetch('/api/taskHistory?latest=true');
		const latestTasks = await resLatestTasks.json();

		const testCases = [];

		for (const caseId of proposal.testCases) {
			const resCase = await fetch(`/api/cases/${caseId}`);
			if (resCase.ok) {
				const testCase = await resCase.json();
				testCases.push(testCase);
			}
		}

		return {
			proposal,
			edits: edits.edits,
			originalTasks,
			latestTasks,
			testCases,
			user: locals.user,
			discordChannels: ['#introduction', '#general', '#random', '#faq', '#celebrate', '#job']
		};
	} catch {
		throw error(404, 'Fail to fetch the proposal.');
	}
};
