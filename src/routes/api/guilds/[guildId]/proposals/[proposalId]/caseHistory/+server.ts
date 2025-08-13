import { json, error } from '@sveltejs/kit';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '$lib/firebase';

export const GET = async ({ params }) => {
	try {
		const subColRef = collection(
			db,
			'guilds',
			params.guildId,
			'proposals',
			params.proposalId,
			'caseHistory'
		);
		const querySnapshot = await getDocs(query(subColRef, orderBy('createAt', 'desc')));
		if (!querySnapshot.empty) {
			const caseHistory = querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
				createAt: doc.data().createAt.toDate()
			}));

			return json({ caseHistory: caseHistory }, { status: 201 });
		} else {
			return json({ caseHistory: [] }, { status: 201 });
		}
	} catch {
		throw error(404, `Edits of proposal #${params.proposalId} not found.`);
	}
};
