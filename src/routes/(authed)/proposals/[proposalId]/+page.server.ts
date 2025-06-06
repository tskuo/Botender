import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, fetch }) => {
	try {
		const resProposal = await fetch(`/api/proposals/${params.proposalId}`);
		const proposal = await resProposal.json();

		const resTasks = await fetch('/api/tasks');
		const tasks: Task[] = await resTasks.json();

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
			tasks,
			testCases
		};
	} catch {
		throw error(404, 'Fail to fetch tasks.');
	}
};
