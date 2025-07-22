import { json, error } from '@sveltejs/kit';
import {
	collection,
	getDocs,
	query,
	orderBy,
	limit,
	addDoc,
	serverTimestamp
} from 'firebase/firestore';
import { db } from '$lib/firebase';

export const GET = async ({ url }) => {
	try {
		const latest = url.searchParams.get('latest');

		if (latest === 'true') {
			const querySnapshot = await getDocs(
				query(collection(db, 'taskHistory'), orderBy('createAt', 'desc'), limit(1))
			);
			const res = {
				...querySnapshot.docs[0].data(),
				id: querySnapshot.docs[0].id,
				createAt: querySnapshot.docs[0].data().createAt.toDate()
			};
			return json(res);
		} else {
			const res: { id: string; tasks: Tasks; createAt: Date }[] = [];
			const querySnapshot = await getDocs(
				query(collection(db, 'taskHistory'), orderBy('createAt', 'desc'))
			);
			querySnapshot.forEach((doc) => {
				const taskHistory = {
					id: doc.id,
					tasks: doc.data().tasks,
					createAt: doc.data().createAt.toDate()
				};
				res.push(taskHistory);
			});
			return json(res);
		}
	} catch {
		throw error(400, 'Fail to fetch taskHistory from Firestore.');
	}
};

export const POST = async ({ request }) => {
	try {
		const { formTaskHistory } = await request.json();
		const tasks: Tasks = { ...formTaskHistory.data.tasks };

		if ('new' in tasks) {
			const taskDocRef = await addDoc(collection(db, 'tasks'), {
				action: tasks['new'].action,
				createAt: serverTimestamp(),
				name: tasks['new'].name,
				trigger: tasks['new'].trigger
			});
			const newId = taskDocRef.id;
			tasks[newId] = { ...tasks['new'] };
			delete tasks['new'];
		}

		const docRef = await addDoc(collection(db, 'taskHistory'), {
			createAt: serverTimestamp(),
			tasks,
			creator: formTaskHistory.data.creator
		});
		return json({ id: docRef.id }, { status: 201 });
	} catch {
		throw error(400, 'Fail to create a new proposal in the database.');
	}
};
