import { json, error } from '@sveltejs/kit';
import {
	collection,
	getDocs,
	query,
	orderBy,
	limit,
	where,
	or,
	addDoc,
	serverTimestamp
} from 'firebase/firestore';

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
	if (url.searchParams.get('taskHistoryId') && url.searchParams.get('proposalId')) {
		const subColRef = collection(
			db,
			'guilds',
			params.guildId,
			'cases',
			params.caseId,
			'botResponses'
		);
		const querySnapshot = await getDocs(
			query(
				subColRef,
				or(
					where('taskHistoryId', '==', url.searchParams.get('taskHistoryId')),
					where('proposalId', '==', url.searchParams.get('proposalId'))
				)
			)
		);
		if (!querySnapshot.empty) {
			const botResponsesData = querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
				createAt: doc.data().createAt.toDate()
			}));
			return json({
				botResponses: botResponsesData
			});
		} else {
			return json({
				botResponses: []
			});
		}
	} else if (url.searchParams.get('taskHistoryId')) {
		const subColRef = collection(
			db,
			'guilds',
			params.guildId,
			'cases',
			params.caseId,
			'botResponses'
		);
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
		const subColRef = collection(
			db,
			'guilds',
			params.guildId,
			'cases',
			params.caseId,
			'botResponses'
		);
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

export const POST = async ({ request, params }) => {
	try {
		const {
			botResponse,
			proposalEditId = '',
			proposalId = '',
			taskHistoryId = '',
			thumbsDown = [],
			thumbsUp = [],
			triggeredTaskId
		} = await request.json();

		// 1. Create a reference to the subcollection.
		const botResponsesRef = collection(
			db,
			'guilds',
			params.guildId,
			'cases',
			params.caseId,
			'botResponses'
		);

		// 2. Create a query to find an existing document with the same IDs.
		const q = query(
			botResponsesRef,
			where('proposalEditId', '==', proposalEditId),
			where('proposalId', '==', proposalId),
			where('taskHistoryId', '==', taskHistoryId),
			limit(1)
		);

		// 3. Execute the query.
		const querySnapshot = await getDocs(q);

		// 4. If a document is found, return the existing doc instead of creating a new one.
		if (!querySnapshot.empty) {
			return json(
				{
					id: querySnapshot.docs[0].id,
					botResponse: querySnapshot.docs[0].data().botResponse,
					triggeredTask: querySnapshot.docs[0].data().triggeredTask
				},
				{ status: 200 }
			);
		}

		// 5. If no existing document is found, create a new one.
		const docRef = await addDoc(botResponsesRef, {
			botResponse: botResponse,
			createAt: serverTimestamp(),
			proposalEditId: proposalEditId,
			proposalId: proposalId,
			taskHistoryId: taskHistoryId,
			thumbsDown: thumbsDown,
			thumbsUp: thumbsUp,
			triggeredTask: triggeredTaskId
		});
		return json(
			{ id: docRef.id, botResponse: botResponse, triggeredTask: triggeredTaskId },
			{ status: 201 }
		);
	} catch {
		throw error(400, 'Fail to save a new botResponse in the database.');
	}
};
