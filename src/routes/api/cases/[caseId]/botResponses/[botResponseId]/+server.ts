import { json, error } from '@sveltejs/kit';
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from '$lib/firebase';

export const PATCH = async ({ request, params, locals }) => {
	if (!locals.user) {
		throw error(400, 'User authentication error.');
	}
	try {
		const { value } = await request.json();
		const userId = locals.user.userId;
		if (value === 'thumbsUp') {
			await updateDoc(doc(db, 'cases', params.caseId, 'botResponses', params.botResponseId), {
				thumbsUp: arrayUnion(userId),
				thumbsDown: arrayRemove(userId)
			});
		} else if (value === 'thumbsDown') {
			await updateDoc(doc(db, 'cases', params.caseId, 'botResponses', params.botResponseId), {
				thumbsUp: arrayRemove(userId),
				thumbsDown: arrayUnion(userId)
			});
		} else {
			await updateDoc(doc(db, 'cases', params.caseId, 'botResponses', params.botResponseId), {
				thumbsUp: arrayRemove(userId),
				thumbsDown: arrayRemove(userId)
			});
		}
		return json({ status: 201 });
	} catch {
		throw error(400, 'Fail to update user vote.');
	}
};
