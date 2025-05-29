import { json, error } from '@sveltejs/kit';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '$lib/firebase';

export const GET = async () => {
	try {
		const querySnapshot = await getDocs(
			query(collection(db, 'tasks'), orderBy('createAt', 'desc'))
		);
		const res: any[] = [];
		querySnapshot.forEach((doc) => {
			const task = { id: doc.id, ...doc.data() };
			res.push(task);
		});
		return json(res);
	} catch {
		throw error(400, 'Fail to fetch data from Firestore.');
	}
};
