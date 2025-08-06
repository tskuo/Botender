import { json, error } from '@sveltejs/kit';
import {
	collection,
	getDocs,
	query,
	orderBy,
	addDoc,
	serverTimestamp,
	updateDoc,
	doc
} from 'firebase/firestore';
import { db } from '$lib/firebase';
import { createProposalThread } from '$lib/server/discord/api';

export const GET = async ({ params }) => {
	try {
		const querySnapshot = await getDocs(
			query(collection(db, 'guilds', params.guildId, 'proposals'), orderBy('createAt', 'desc'))
		);
		const res = [];
		for (const doc of querySnapshot.docs) {
			const subColRef = collection(db, 'guilds', params.guildId, 'proposals', doc.id, 'edits');
			const querySnapshot = await getDocs(query(subColRef, orderBy('createAt', 'desc')));
			const edits = querySnapshot.docs.map((d) => ({
				id: d.id,
				...d.data(),
				createAt: d.data().createAt.toDate()
			}));

			res.push({ ...doc.data(), id: doc.id, createAt: doc.data().createAt.toDate(), edits: edits });
		}

		// querySnapshot.forEach((doc) => {
		// 	res.push({ ...doc.data(), id: doc.id, createAt: doc.data().createAt.toDate() });
		// });
		return json(res);
	} catch {
		throw error(400, 'Fail to fetch data from Firestore.');
	}
};

export const POST = async ({ request, params, locals }) => {
	if (!locals.user) {
		throw error(401, 'You must be logged in to initiate a proposal.');
	}
	try {
		const { formProposal, caseId } = await request.json();

		const docRef = await addDoc(collection(db, 'guilds', params.guildId, 'proposals'), {
			createAt: serverTimestamp(),
			description: formProposal.data.description,
			discussionSummary: '',
			initiator: locals.user.userName,
			initiatorId: locals.user.userId,
			open: true,
			taskHistoryId: formProposal.data.taskHistoryId,
			testCases: caseId ? [caseId] : [],
			title: formProposal.data.title
		});

		// After successfully creating the proposal, create a thread on Discord.
		const discordThreadInfo = await createProposalThread(
			params.guildId,
			docRef.id,
			formProposal.data.title,
			formProposal.data.description,
			locals.user.userId
		);

		// If the thread was created, update the proposal doc with the thread ID
		if (discordThreadInfo) {
			await updateDoc(doc(db, 'guilds', params.guildId, 'proposals', docRef.id), {
				threadId: discordThreadInfo.threadId,
				messageId: discordThreadInfo.messageId
			});
		}

		return json({ id: docRef.id }, { status: 201 });
	} catch {
		throw error(400, 'Fail to create a new proposal in the database.');
	}
};
