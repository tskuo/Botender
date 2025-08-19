import { json, error } from '@sveltejs/kit';
import {
	serverTimestamp,
	addDoc,
	collection,
	getDocs,
	query,
	orderBy,
	doc,
	getDoc
} from 'firebase/firestore';
import { db } from '$lib/firebase';
import { sendEditNotificationToThread } from '$lib/server/discord/api';

export const GET = async ({ params, url }) => {
	try {
		const subColRef = collection(
			db,
			'guilds',
			params.guildId,
			'proposals',
			params.proposalId,
			'edits'
		);
		const querySnapshot = await getDocs(query(subColRef, orderBy('createAt', 'desc')));
		if (!querySnapshot.empty) {
			const edits = querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
				createAt: doc.data().createAt.toDate()
			}));
			if (url.searchParams.get('latest') === 'true') {
				return json({ edits: [edits[0]] }, { status: 201 });
			} else {
				return json({ edits: edits }, { status: 201 });
			}
		} else {
			return json({ edits: [] }, { status: 201 });
		}
	} catch {
		throw error(404, `Edits of proposal #${params.proposalId} not found.`);
	}
};

export const POST = async ({ request, params, locals }) => {
	if (!locals.user) {
		throw error(401, 'You must be logged in to edit a proposal.');
	}
	try {
		const { tasks, editQuestionnaire = [] } = await request.json();

		const proposalRef = doc(db, 'guilds', params.guildId, 'proposals', params.proposalId);
		const proposalSnap = await getDoc(proposalRef);

		if (!proposalSnap.exists()) {
			throw error(404, 'Proposal not found.');
		}

		if (proposalSnap.data().open) {
			const docRef = await addDoc(
				collection(db, 'guilds', params.guildId, 'proposals', params.proposalId, 'edits'),
				{
					createAt: serverTimestamp(),
					downvotes: [],
					editor: locals.user.userName,
					editorId: locals.user.userId,
					tasks: tasks,
					upvotes: [],
					editQuestionnaire: editQuestionnaire
				}
			);

			if (proposalSnap.data().threadId) {
				await sendEditNotificationToThread(
					params.guildId,
					proposalSnap.data().threadId,
					locals.user.userId,
					params.proposalId
				);
			}

			return json({ id: docRef.id }, { status: 201 });
		} else {
			throw error(400, 'The proposal is already closed.');
		}
	} catch {
		throw error(400, 'Fail to save a new edit in the database.');
	}
};
