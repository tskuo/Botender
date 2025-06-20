import { json, error } from '@sveltejs/kit';
import { doc, getDoc } from 'firebase/firestore';

import { db } from '$lib/firebase';

export const GET = async ({ params }) => {
	// const botResponses = url.searchParams.get('botResponses');

	// if (botResponses && botResponses === 'true') {
	// 	const subColRef = collection(db, 'cases', params.caseId, 'botResponses');
	// 	const querySnapshot = await getDocs(query(subColRef, orderBy('createAt')));
	// 	const botResponsesData = querySnapshot.docs.map((doc) => ({
	// 		id: doc.id,
	// 		...doc.data(),
	// 		createAt: doc.data().createAt.toDate()
	// 	}));
	// 	return json({
	// 		botResponses: botResponsesData
	// 	});
	// } else {
	const docRef = doc(db, 'cases', params.caseId);
	const docSnap = await getDoc(docRef);

	if (docSnap.exists()) {
		return json({
			...docSnap.data(),
			id: docSnap.id,
			createAt: docSnap.data().createAt.toDate()
		});
	}
	// }
	throw error(404, `Case #${params.caseId} not found.`);
};
