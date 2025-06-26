import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, fetch }) => {
	try {
		const resProposal = await fetch(`/api/proposals/${params.proposalId}`);
		const proposal = await resProposal.json();

		const resOriginalTasks = await fetch(`/api/taskHistory/${proposal.taskHistoryId}`);
		const originalTasks = await resOriginalTasks.json();

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
			originalTasks,
			testCases
		};
	} catch {
		throw error(404, 'Fail to fetch the proposal.');
	}
};
