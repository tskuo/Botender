import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const resProposals = await fetch('/api/proposals');
		const proposals = await resProposals.json();

		return {
			proposals
		};
	} catch {
		throw error(404, 'Fail to fetch proposals.');
	}
};
