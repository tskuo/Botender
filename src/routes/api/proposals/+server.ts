import { json, error } from '@sveltejs/kit';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '$lib/firebase';

export const GET = async () => {
	try {
		const querySnapshot = await getDocs(
			query(collection(db, 'proposals'), orderBy('createAt', 'desc'))
		);
		const res = [];
		querySnapshot.forEach((doc) => {
			res.push({ ...doc.data(), id: doc.id, createAt: doc.data().createAt.toDate() });
		});
		return json(res);
	} catch {
		throw error(400, 'Fail to fetch data from Firestore.');
	}
};
