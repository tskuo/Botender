import { json, error } from '@sveltejs/kit';
import {
	doc,
	getDoc,
	setDoc,
	addDoc,
	collection,
	serverTimestamp,
	updateDoc
} from 'firebase/firestore';

import { db } from '$lib/firebase';

export const GET = async ({ params }) => {
	const docRef = doc(db, 'guilds', params.guildId);
	const docSnap = await getDoc(docRef);

	if (docSnap.exists()) {
		return json({
			...docSnap.data(),
			id: docSnap.id
		});
	}
	throw error(404, `Guild #${params.guildId} not found.`);
};

export const POST = async ({ request, params }) => {
	try {
		const { channels, community_tone } = await request.json();

		const guildDocRef = doc(db, 'guilds', params.guildId);
		const guildDocSnap = await getDoc(guildDocRef);

		// If the guild already exists, initialize channels and community tone, and return a success response.
		if (guildDocSnap.exists()) {
			await updateDoc(guildDocRef, {
				channels: channels,
				community_tone: community_tone
			});
			return json({ id: params.guildId }, { status: 201 });
		}

		// If the guild does not exist, proceed with the initialization process.
		await setDoc(guildDocRef, {
			channels: channels,
			community_tone: community_tone
		});

		const initialTask = {
			action: 'Reply with a hello and a smiling emoji.',
			name: 'Hello Botender',
			trigger: 'When someone greets Botender in the #botender channel.'
		};

		// Add an initial document to the 'tasks' subcollection
		const taskDocRef = await addDoc(collection(db, 'guilds', params.guildId, 'tasks'), {
			...initialTask,
			createAt: serverTimestamp()
		});

		const initialTaskHistory = {
			[taskDocRef.id]: initialTask
		};

		await addDoc(collection(db, 'guilds', params.guildId, 'taskHistory'), {
			createAt: serverTimestamp(),
			deployer: 'botender',
			deployerId: 'botender',
			tasks: initialTaskHistory
		});

		return json({ id: params.guildId }, { status: 201 });
	} catch (e) {
		console.error('Failed to create guild:', e);
		throw error(400, 'Fail to create a new guild in the database.');
	}
};

export const PATCH = async ({ request, params }) => {
	try {
		const { channels } = await request.json();

		// Basic validation to ensure channels data is provided
		if (!channels || !Array.isArray(channels)) {
			throw error(400, 'Invalid or missing channels data.');
		}

		const guildDocRef = doc(db, 'guilds', params.guildId);

		// Use updateDoc to modify only the 'channels' field
		await updateDoc(guildDocRef, {
			channels: channels
		});

		return json({ id: params.guildId, message: 'Guild channels updated successfully.' });
	} catch (e) {
		console.error('Failed to update guild:', e);
		throw error(500, 'Failed to update the guild in the database.');
	}
};
