import { json, error } from '@sveltejs/kit';
import { serverTimestamp, addDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '$lib/firebase';

export const GET = async ({ params, url }) => {
	try {
		const subColRef = collection(db, 'proposals', params.proposalId, 'edits');
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

export const POST = async ({ request, params }) => {
	try {
		const { tasks, editor } = await request.json();
		const docRef = await addDoc(collection(db, 'proposals', params.proposalId, 'edits'), {
			createAt: serverTimestamp(),
			downvotes: [],
			editor: editor,
			tasks: tasks,
			upvotes: []
		});
		return json({ id: docRef.id }, { status: 201 });
	} catch {
		throw error(400, 'Fail to save a new edit in the database.');
	}
};
