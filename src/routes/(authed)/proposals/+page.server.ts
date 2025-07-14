import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ fetch, locals }) => {
	try {
		const resProposals = await fetch('/api/proposals');
		const proposals = await resProposals.json();

		const proposalsWithLatestEdit = await Promise.all(
			proposals.map(async (proposal: Proposal) => {
				const resEdits = await fetch(`/api/proposals/${proposal.id}/edits?latest=true`);
				const edits = resEdits.ok ? await resEdits.json() : [];
				return {
					...proposal,
					...edits
				};
			})
		);

		return {
			proposals: proposalsWithLatestEdit,
			user: locals.user
		};
	} catch {
		throw error(404, 'Fail to fetch proposals.');
	}
};
