import { json, error } from '@sveltejs/kit';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
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
