import { getGenerativeModel } from 'firebase/ai';
import { ai } from '$lib/firebase';
import { json, error } from '@sveltejs/kit';

export const POST = async ({ request }) => {
	try {
		const { channel, userMessage, tasks, source } = await request.json();

		const orchestratorSystemPrompt =
			"You are a helpful assistant that determines the relevance of a user's message to specific tasks. If the message is relevant to a particular task's trigger, respond with that task's ID. If it is relevant to more than one task's trigger, respond with the ID of the task to which it is most relevant. If the message is not relevant to any tasks' triggers, respond with 0.";

		const orchestratorModel = getGenerativeModel(ai, {
			model: 'gemini-2.0-flash',
			systemInstruction: orchestratorSystemPrompt
		});

		let prompt = 'Here is a list of tasks: \n';
		for (const taskId in tasks) {
			prompt = prompt.concat(
				'Task ID: ',
				taskId,
				'\n',
				'Task Trigger: ',
				tasks[taskId].trigger,
				'\n\n'
			);
		}

		prompt = prompt.concat(
			"Here is the user's message in the ",
			channel,
			' channel: \n',
			userMessage
		);

		const result1 = await orchestratorModel.generateContent(prompt);
		const response1 = result1.response;
		const triggeredTaskId = response1.text().trim();

		let botResponse = '';

		if (triggeredTaskId in tasks) {
			let agentSystemPrompt =
				"You are a helpful assistant that replies to a user's message based on the following instructions:\n";
			agentSystemPrompt = agentSystemPrompt.concat(
				tasks[triggeredTaskId].action,
				'\n',
				"However, if you believe you shouldn't reply to anything, reply an empty string.\n",
				"Here is the user's message in the ",
				channel,
				' channel: \n',
				userMessage
			);

			const agentModel = getGenerativeModel(ai, {
				model: 'gemini-2.0-flash',
				systemInstruction: agentSystemPrompt
			});

			const result2 = await agentModel.generateContent(userMessage);
			const response2 = result2.response;
			botResponse = response2.text();
		}

		return json({ taskId: triggeredTaskId, botResponse: botResponse }, { status: 201 });
	} catch {
		throw error(400, "Fail to generate bot's response");
	}
};
