import { json, error } from '@sveltejs/kit';
import { serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '$lib/firebase';

export const POST = async ({ request }) => {
	try {
		const { form } = await request.json();

		const docRef = await addDoc(collection(db, 'cases'), {
			createAt: serverTimestamp(),
			channel: form.data.channel,
			userMessage: form.data.userMessage,
			triggeredTask: form.data.triggeredTask,
			botResponse: form.data.botResponse
		});

		return json({ id: docRef.id }, { status: 201 });
	} catch {
		throw error(400, 'Fail to create a new case in the database.');
	}
};
