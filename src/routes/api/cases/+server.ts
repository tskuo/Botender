import { json, error } from '@sveltejs/kit';
import { serverTimestamp, addDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '$lib/firebase';

export const GET = async () => {
	try {
		const querySnapshot = await getDocs(
			query(collection(db, 'cases'), orderBy('createAt', 'desc'))
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

export const POST = async ({ request }) => {
	try {
		const { formCase, caseOnly = false } = await request.json();

		const docRef = await addDoc(collection(db, 'cases'), {
			channel: formCase.data.channel,
			createAt: serverTimestamp(),
			realUserMessage: formCase.data.realUserMessage,
			source: formCase.data.source,
			userMessage: formCase.data.userMessage
		});

		if (!caseOnly) {
			await addDoc(collection(db, 'cases', docRef.id, 'botResponses'), {
				botResponse: formCase.data.botResponse,
				createAt: serverTimestamp(),
				proposalEditId: formCase.data.proposalEditId,
				proposalId: formCase.data.proposalId,
				taskHistoryId: formCase.data.taskHistoryId,
				thumbsDown: [],
				thumbsUp: [],
				triggeredTask: formCase.data.triggeredTaskId
			});
		}

		return json({ id: docRef.id }, { status: 201 });
	} catch {
		throw error(400, 'Fail to create a new case in the database.');
	}
};
