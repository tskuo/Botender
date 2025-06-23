import { json, error } from '@sveltejs/kit';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';

import { db } from '$lib/firebase';

export const GET = async ({ params, url }) => {
	// const latest = url.searchParams.get('latest');

	// if (latest && latest === 'true') {
	// 	// if latest is specified, return the latest bot response that has a taskHistoryId
	// 	const subColRef = collection(db, 'cases', params.caseId, 'botResponses');
	// 	const querySnapshot = await getDocs(query(subColRef, orderBy('createAt', 'desc')));

	// 	if (!querySnapshot.empty) {
	// 		const latestDoc = querySnapshot.docs.find(
	// 			(doc) => doc.data().taskHistoryId && doc.data().taskHistoryId !== ''
	// 		);
	// 		return json({
	// 			// wrap in an array for consistency
	// 			botResponses: [
	// 				{ ...latestDoc.data(), id: latestDoc.id, createAt: latestDoc.data().createAt.toDate() }
	// 			]
	// 		});
	// 	} else {
	// 		throw error(404, `Case #${params.caseId} bot responses not found.`);
	// 	}
	// } else
	if (url.searchParams.get('taskHistoryId')) {
		const subColRef = collection(db, 'cases', params.caseId, 'botResponses');
		const querySnapshot = await getDocs(
			query(
				subColRef,
				where('taskHistoryId', '==', url.searchParams.get('taskHistoryId')),
				limit(1)
			)
		);
		if (!querySnapshot.empty) {
			const doc = querySnapshot.docs[0];
			return json({
				// wrap in an array for consistency
				botResponses: [{ ...doc.data(), id: doc.id, createAt: doc.data().createAt.toDate() }]
			});
		} else {
			throw error(404, `Case #${params.caseId} bot responses not found.`);
		}
	} else {
		// if not specified, return all bot responses
		const subColRef = collection(db, 'cases', params.caseId, 'botResponses');
		const querySnapshot = await getDocs(query(subColRef, orderBy('createAt')));
		const botResponsesData = querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
			createAt: doc.data().createAt.toDate()
		}));
		return json({
			botResponses: botResponsesData
		});
	}
	throw error(404, `Case #${params.caseId} not found.`);
};
