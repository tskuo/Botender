import { json, error } from '@sveltejs/kit';
import { doc, getDoc } from 'firebase/firestore';

import { db } from '$lib/firebase';

export const GET = async ({ params }) => {
	const docRef = doc(db, 'taskHistory', params.taskHistoryId);
	const docSnap = await getDoc(docRef);

	if (docSnap.exists()) {
		return json({
			...docSnap.data(),
			id: docSnap.id,
			createAt: docSnap.data().createAt.toDate()
		});
	}
	throw error(404, `Task history #${params.taskHistoryId} not found.`);
};
