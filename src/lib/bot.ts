import { getGenerativeModel } from 'firebase/ai';
import { ai } from '$lib/firebase';

export async function bot(channel: string, userMessage: string, tasks: Tasks) {
	const orchestratorSystemPrompt = `You are a helpful assistant tasked with determining whether a task should be triggered based on a user's message in a specific channel. You will receive a list of tasks, each with an associated ID and trigger condition, as well as the user's message and the channel where it was sent. If the message in that channel is relevant to the trigger condition of a specific task, respond with that task's ID. If the message is relevant to multiple tasks, respond with the ID of the task to which it is most relevant. If the message does not match any task trigger, respond with 0.`;

	const orchestratorModel = getGenerativeModel(ai, {
		model: 'gemini-2.0-flash',
		systemInstruction: orchestratorSystemPrompt
	});

	let prompt1 = 'Here is a list of tasks: \n';
	for (const taskId in tasks) {
		prompt1 = prompt1.concat(`Task ID: ${taskId}\n`, `Task Trigger: ${tasks[taskId].trigger}\n\n`);
	}

	prompt1 = prompt1.concat(`User message in the ${channel} channel:\n`, userMessage);

	const result1 = await orchestratorModel.generateContent(prompt1);
	const response1 = result1.response;
	const triggeredTaskId = response1.text().trim();

	let botResponse = '';

	if (triggeredTaskId in tasks) {
		const agentSystemPrompt = `You are a helpful assistant tasked with responding to a user's message in a specific channel, following the instructions provided in an assigned action. You will receive the action instructions, the user's message, and the channel where it was sent. Based on the action, compose an appropriate reply. If you determine that no response is necessary, reply with n/a instead.`;
		const prompt2 = [
			`Action: ${tasks[triggeredTaskId].action}`,
			`User message in the ${channel} channel:`,
			userMessage
		].join('\n');

		const agentModel = getGenerativeModel(ai, {
			model: 'gemini-2.0-flash',
			systemInstruction: agentSystemPrompt
		});

		const result2 = await agentModel.generateContent(prompt2);
		const response2 = result2.response;
		botResponse = response2.text().trim();

		if (botResponse === 'n/a' || botResponse === `"n/a"`) botResponse = '';
	}

	return { taskId: triggeredTaskId, botResponse: botResponse };
}
