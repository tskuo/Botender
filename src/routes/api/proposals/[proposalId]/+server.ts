import { json, error } from '@sveltejs/kit';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';

import { db } from '$lib/firebase';

export const GET = async ({ params }) => {
	const docRef = doc(db, 'proposals', params.proposalId);
	const docSnap = await getDoc(docRef);

	const subColRef = collection(db, 'proposals', params.proposalId, 'edits');
	const querySnapshot = await getDocs(query(subColRef, orderBy('createAt', 'desc')));
	let editsData = [];
	if (!querySnapshot.empty) {
		editsData = querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
			createAt: doc.data().createAt.toDate()
		}));
	}

	if (docSnap.exists()) {
		return json({
			...docSnap.data(),
			id: docSnap.id,
			createAt: docSnap.data().createAt.toDate(),
			edits: editsData
		});
	}
	throw error(404, `Proposal #${params.proposalId} not found.`);
};
