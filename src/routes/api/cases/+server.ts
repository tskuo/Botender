import { json, error } from '@sveltejs/kit';
import { serverTimestamp, addDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '$lib/firebase';
import ThumbsDown from '@lucide/svelte/icons/thumbs-down';

export const GET = async () => {
	try {
		const querySnapshot = await getDocs(
			query(collection(db, 'cases'), orderBy('createAt', 'desc'))
		);
		const res: Case[] = [];
		querySnapshot.forEach((doc) => {
			const c = {
				id: doc.id,
				botResponse: doc.data().botResponse,
				channel: doc.data().channel,
				createAt: doc.data().createAt.toDate(),
				realUserMessage: doc.data().realUserMessage,
				triggeredTask: doc.data().triggeredTask,
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
		const { form } = await request.json();

		const docRef = await addDoc(collection(db, 'cases'), {
			createAt: serverTimestamp(),
			channel: form.data.channel,
			userMessage: form.data.userMessage,
			realUserMessage: form.data.realUserMessage
		});

		await addDoc(collection(db, 'cases', docRef.id, 'botResponses'), {
			createAt: serverTimestamp(),
			botResponse: form.data.botResponse,
			proposalEditId: (form.data.source === 'proposal' ? form.data.proposalEditId : '') || '',
			proposalId: (form.data.source === 'proposal' ? form.data.proposalId : '') || '',
			taskHistoryId: form.data.taskHistoryId ?? '',
			thumbsDown: [],
			thumbsUp: [],
			triggeredTask: form.data.triggeredTaskId
		});

		return json({ id: docRef.id }, { status: 201 });
	} catch {
		throw error(400, 'Fail to create a new case in the database.');
	}
};
