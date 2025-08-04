// filepath: /Users/tzushenk/code/Botender/src/routes/api/bot/+server.ts
import { json, error } from '@sveltejs/kit';
import { bot } from '$lib/server/openAI/bot';
import { db } from '$lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export const POST = async ({ request }) => {
	try {
		const { guildId, channel, userMessage } = await request.json();

		if (!guildId || !channel || !userMessage) {
			throw error(400, 'Missing required fields: guildId, channel, userMessage');
		}
		console.log('guildId: ', guildId);
		console.log('channel: ', channel);
		console.log('userMessage: ', userMessage);

		// Fetch the tasks for the guild from Firestore
		const querySnapshot = await getDocs(
			query(collection(db, 'guilds', guildId, 'taskHistory'), orderBy('createAt', 'desc'), limit(1))
		);

		const tasks = querySnapshot.docs[0].data().tasks;
		console.log(tasks);

		// Call the core bot logic with the fetched tasks
		const { taskId, botResponse } = await bot(channel, userMessage, tasks);
		console.log('taskId: ', taskId);
		console.log('botResponse: ', botResponse);

		return json({ taskId: taskId, botResponse: botResponse }, { status: 201 });
	} catch (e) {
		console.error('Error in bot API:', e);
		throw error(500, 'Failed to process bot request.');
	}
};
