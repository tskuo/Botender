import { json, error } from '@sveltejs/kit';
import { doc, getDoc } from 'firebase/firestore';

import { db } from '$lib/firebase';

export const GET = async ({ params }) => {
	const docRef = doc(db, 'guilds', params.guildId);
	const docSnap = await getDoc(docRef);

	if (docSnap.exists()) {
		return json({
			...docSnap.data(),
			id: docSnap.id
		});
	}
	throw error(404, `Guild #${params.guildId} not found.`);
};
