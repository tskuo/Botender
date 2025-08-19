import { json, error } from '@sveltejs/kit';
import {
	collection,
	getDocs,
	query,
	orderBy,
	limit,
	addDoc,
	serverTimestamp,
	doc,
	getDoc
} from 'firebase/firestore';
import { db } from '$lib/firebase';
import { sendTaskUpdateNotification } from '$lib/server/discord/api';

export const GET = async ({ url, params }) => {
	try {
		const latest = url.searchParams.get('latest');

		if (latest === 'true') {
			const querySnapshot = await getDocs(
				query(
					collection(db, 'guilds', params.guildId, 'taskHistory'),
					orderBy('createAt', 'desc'),
					limit(1)
				)
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
				query(collection(db, 'guilds', params.guildId, 'taskHistory'), orderBy('createAt', 'desc'))
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

export const POST = async ({ request, params, locals }) => {
	if (!locals.user) {
		throw error(400, 'User authentication error.');
	}
	try {
		const { formTaskHistory } = await request.json();
		const changedTasks: Tasks = { ...formTaskHistory.data.changedTasks };
		const proposalId: string = formTaskHistory.data.proposalId;
		const messageId: string = formTaskHistory.data.messageId;

		// Check if the proposal is already closed or deployed
		const proposalRef = doc(db, 'guilds', params.guildId, 'proposals', proposalId);
		const proposalSnap = await getDoc(proposalRef);
		if (!proposalSnap.exists()) {
			throw error(404, 'Proposal not found.');
		}
		if (!proposalSnap.data().open || proposalSnap.data().deployed) {
			throw error(400, 'The proposal is already closed or deployed.');
		}

		// Check if a new task is proposed
		if ('new' in changedTasks) {
			const taskDocRef = await addDoc(collection(db, 'guilds', params.guildId, 'tasks'), {
				action: changedTasks['new'].action.trim(),
				createAt: serverTimestamp(),
				name: changedTasks['new'].name.trim(),
				trigger: changedTasks['new'].trigger.trim()
			});
			const newId = taskDocRef.id;
			changedTasks[newId] = { ...changedTasks['new'] };
			delete changedTasks['new'];
		}

		// Get the very latest task:
		const querySnapshot = await getDocs(
			query(
				collection(db, 'guilds', params.guildId, 'taskHistory'),
				orderBy('createAt', 'desc'),
				limit(1)
			)
		);
		const latestTasks: Tasks = querySnapshot.docs[0].data().tasks;

		// If a task ID exists in both latestTasks and editedTasks, the value from editedTasks (the one on the right) will overwrite the one from latestTasks
		const newTasks = { ...latestTasks, ...changedTasks };

		const docRef = await addDoc(collection(db, 'guilds', params.guildId, 'taskHistory'), {
			createAt: serverTimestamp(),
			tasks: newTasks,
			deployer: locals.user.userName,
			deployerId: locals.user.userId,
			proposalId: proposalId
		});

		await sendTaskUpdateNotification(params.guildId, locals.user.userId, messageId);

		return json({ id: docRef.id }, { status: 201 });
	} catch {
		throw error(400, 'Fail to create a new taskHistory in the database.');
	}
};
