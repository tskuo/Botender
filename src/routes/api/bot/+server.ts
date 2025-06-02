import { getGenerativeModel } from 'firebase/ai';
import { ai } from '$lib/firebase';
import { json, error } from '@sveltejs/kit';

export const POST = async ({ request }) => {
	try {
		const { channel, userMessage, playgroundTasks } = await request.json();

		const orchestratorSystemPrompt =
			"You are a helpful assistant that determines the relevance of a user's message to specific tasks. If the message is relevant to a particular task's trigger, respond with that task's ID. If it is relevant to more than one task's trigger, respond with the ID of the task to which it is most relevant. If the message is not relevant to any tasks' triggers, respond with 0.";

		const orchestratorModel = getGenerativeModel(ai, {
			model: 'gemini-2.0-flash',
			systemInstruction: orchestratorSystemPrompt
		});

		let prompt = 'Here is a list of tasks: \n';
		for (const task of playgroundTasks) {
			prompt = prompt.concat('Task ID: ', task.id, '\n', 'Task Trigger: ', task.trigger, '\n\n');
		}

		prompt = prompt.concat(
			"Here is the user's message in the ",
			channel,
			' channel: \n',
			userMessage
		);

		const result = await orchestratorModel.generateContent(prompt);
		const response = result.response;
		const taskId = response.text().trim();

		let botResponse = '';

		if (taskId !== '0') {
			const selectedTask = playgroundTasks.find((task: Task) => task.id === taskId) ?? undefined;

			if (selectedTask === undefined) {
				return json({ taskId: taskId, botResponse: botResponse }, { status: 201 });
			}

			let agentSystemPrompt =
				"You are a helpful assistant that replies to a user's message based on the following instructions:\n";
			agentSystemPrompt = agentSystemPrompt.concat(
				selectedTask.action,
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

		return json({ taskId: taskId, botResponse: botResponse }, { status: 201 });
	} catch {
		throw error(400, "Fail to generate bot's response");
	}
};
