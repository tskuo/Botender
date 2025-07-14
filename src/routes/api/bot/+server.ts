import { bot } from '$lib/bot';
import { json, error } from '@sveltejs/kit';

export const POST = async ({ request }) => {
	try {
		const { channel, userMessage, tasks } = await request.json();

		const { taskId, botResponse } = await bot(channel, userMessage, tasks);

		return json({ taskId: taskId, botResponse: botResponse }, { status: 201 });
	} catch {
		throw error(400, "Fail to generate bot's response");
	}
};
