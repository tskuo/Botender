import { isTaskEmpty } from '$lib/tasks';
import { openAIClient, openAIModel } from '$lib/server/openAI/client';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

export async function bot(channel: string, userMessage: string, tasks: Tasks) {
	const orchestratorSysPrompt = `You are a helpful assistant tasked with determining whether a task should be triggered based on a user's message in a specific channel. You will receive a list of tasks, each with an associated ID and trigger condition, as well as the user's message and the channel where it was sent. If the message is relevant to the trigger condition of a specific task, respond with that task's ID. If the message is relevant to multiple tasks, respond with the ID of the task to which it is most relevant. If the message does not match any task trigger, respond with 0. Your response must be a JSON object with a single key "taskId". For example: {"taskId": "some-task-id"} or {"taskId": "0"}.`;

	let orchestratorUserPrompt = 'Here is a list of tasks: \n';
	for (const taskId in tasks) {
		// ignore empty (deleted) tasks
		if (!isTaskEmpty(tasks[taskId])) {
			orchestratorUserPrompt = orchestratorUserPrompt.concat(
				`Task ID: ${taskId}\n`,
				`Task Trigger: ${tasks[taskId].trigger}\n\n`
			);
		}
	}

	orchestratorUserPrompt = orchestratorUserPrompt.concat(
		`User message in the ${channel} channel:\n`,
		userMessage
	);

	const orchestratorResponse = await openAIClient.responses.parse({
		model: openAIModel,
		input: [
			{ role: 'system', content: orchestratorSysPrompt },
			{ role: 'user', content: orchestratorUserPrompt }
		],
		text: {
			format: zodTextFormat(z.object({ taskId: z.string() }), 'orchestratorResult')
		}
	});

	// console.log(`========== orchestratorSysPrompt ==========`);
	// console.log(orchestratorSysPrompt);

	// console.log(`========== orchestratorUserPrompt ==========`);
	// console.log(orchestratorUserPrompt);

	let triggeredTaskId = orchestratorResponse.output_parsed?.taskId ?? '0';
	let botResponse = '';

	if (triggeredTaskId !== null && triggeredTaskId in tasks) {
		const agentSysPrompt = `You are a helpful assistant tasked with responding to a user's message in a specific channel, following the instructions provided in an assigned action. You will receive the action instructions, the user's message, and the channel where it was sent. Based on the action, compose an appropriate reply. If you determine that no response is necessary, use "n/a". Your response must be a JSON object with a single key "response". For example: {"response": "Here is your reply."} or {"response": "n/a"}.`;
		const agentUserPrompt = [
			`Action: ${tasks[triggeredTaskId].action}`,
			`User message in the ${channel} channel:`,
			userMessage
		].join('\n');

		const agentResponse = await openAIClient.responses.parse({
			model: openAIModel,
			input: [
				{ role: 'system', content: agentSysPrompt },
				{ role: 'user', content: agentUserPrompt }
			],
			// tools: [{ type: 'web_search_preview', search_context_size: 'low' }],
			text: {
				format: zodTextFormat(z.object({ response: z.string() }), 'agentResult')
			}
			// max_output_tokens: 450
		});

		// console.log(`========== agentSysPrompt ==========`);
		// console.log(agentSysPrompt);

		// console.log(`========== agentUserPrompt ==========`);
		// console.log(agentUserPrompt);

		const agentResult = agentResponse.output_parsed?.response;
		// console.log(agentResult);

		if (!agentResult || agentResult === null || agentResult === 'n/a' || agentResult === `"n/a"`) {
			botResponse = '';
		} else {
			botResponse = agentResult;
		}
	} else {
		triggeredTaskId = '0';
	}

	if (botResponse.length > 2000) {
		botResponse = botResponse.substring(0, 1997) + '...'; // Discord limits 2000 charactors
	}

	return { taskId: triggeredTaskId, botResponse: botResponse };
}
