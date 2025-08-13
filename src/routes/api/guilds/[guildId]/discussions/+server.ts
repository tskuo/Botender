import { json, error } from '@sveltejs/kit';
import {
	collection,
	getDocs,
	query,
	limit,
	where,
	addDoc,
	serverTimestamp
} from 'firebase/firestore';

import { db } from '$lib/firebase';

export const POST = async ({ request, params }) => {
	try {
		const { threadId, authorId, content } = await request.json();

		// 1. Create a query to find the proposal document by its threadId.
		const proposalsRef = collection(db, 'guilds', params.guildId, 'proposals');
		const q = query(proposalsRef, where('threadId', '==', threadId), limit(1));

		// 2. Execute the query.
		const querySnapshot = await getDocs(q);

		// 3. Check if a matching proposal was found.
		if (!querySnapshot.empty) {
			const proposalDoc = querySnapshot.docs[0];
			const proposalId = proposalDoc.id;

			// 4. Add a new document to the 'discussions' subcollection of that proposal.
			await addDoc(
				collection(db, 'guilds', params.guildId, 'proposals', proposalId, 'discussions'),
				{
					authorId: authorId,
					content: content,
					createAt: serverTimestamp()
				}
			);

			return json({ message: 'Discussion saved successfully.' }, { status: 201 });
		} else {
			// This case means the message was in a channel that is not a proposal thread.
			// This is not an error, so we can return a success status indicating no action was taken.
			return json(
				{ message: 'Message is not in a proposal thread, no action taken.' },
				{ status: 200 }
			);
		}
	} catch (e) {
		console.error('Failed to save discussion:', e);
		throw error(500, 'Fail to save a new discussion message in the database');
	}
};
