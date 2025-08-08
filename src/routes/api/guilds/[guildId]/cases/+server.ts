import { json, error } from '@sveltejs/kit';
import {
	serverTimestamp,
	addDoc,
	collection,
	getDocs,
	query,
	orderBy,
	where,
	limit
} from 'firebase/firestore';
import { db } from '$lib/firebase';

export const GET = async ({ params }) => {
	try {
		const querySnapshot = await getDocs(
			query(collection(db, 'guilds', params.guildId, 'cases'), orderBy('createAt', 'desc'))
		);
		const res: Case[] = [];
		querySnapshot.forEach((doc) => {
			const c = {
				id: doc.id,
				channel: doc.data().channel,
				createAt: doc.data().createAt.toDate(),
				realUserMessage: doc.data().realUserMessage,
				userMessage: doc.data().userMessage
			};
			res.push(c);
		});
		return json(res);
	} catch {
		throw error(400, 'Fail to fetch data from Firestore.');
	}
};

export const POST = async ({ request, params }) => {
	try {
		const { formCase, caseOnly = false } = await request.json();

		// Check if a case with the same generatedId already exists
		const casesRef = collection(db, 'guilds', params.guildId, 'cases');
		const q = query(casesRef, where('generatedId', '==', formCase.data.generatedId), limit(1));
		const querySnapshot = await getDocs(q);

		// If a case with this generatedId already exists...
		if (!querySnapshot.empty) {
			const existingDocId = querySnapshot.docs[0].id;

			// Return the ID of the existing case.
			return json({ id: existingDocId }, { status: 200 });
		}

		// If no existing case is found, create a new one.
		const docRef = await addDoc(collection(db, 'guilds', params.guildId, 'cases'), {
			channel: formCase.data.channel,
			createAt: serverTimestamp(),
			realUserMessage: formCase.data.realUserMessage,
			source: formCase.data.source,
			userMessage: formCase.data.userMessage,
			generatedId: formCase.data.generatedId,
			issue: formCase.data.issue
		});

		if (!caseOnly) {
			await addDoc(collection(db, 'guilds', params.guildId, 'cases', docRef.id, 'botResponses'), {
				botResponse: formCase.data.botResponse,
				createAt: serverTimestamp(),
				proposalEditId: formCase.data.proposalEditId,
				proposalId: formCase.data.proposalId,
				taskHistoryId: formCase.data.taskHistoryId,
				thumbsDown: formCase.data.thumbsDown,
				thumbsUp: formCase.data.thumbsUp,
				triggeredTask: formCase.data.triggeredTaskId
			});
		}

		return json({ id: docRef.id }, { status: 201 });
	} catch {
		throw error(400, 'Fail to create a new case in the database.');
	}
};
