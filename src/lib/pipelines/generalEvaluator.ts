import { getGenerativeModel, Schema } from 'firebase/ai';
import { ai } from '$lib/firebase';
import _ from 'lodash';

export async function generalEvaluator(newTasks: Tasks, testCases) {
	const systemPrompt = [
		`You are a helpful assistant tasked with evaluating how provocative a given test case is, to support prompt designers in refining a language model-based bot's prompt. In this context, a case consists of a user input and the bot's response, which is generated according to the trigger and action described in the prompt. Your task is to assess the level of provocativeness of each case, providing valuable feedback to help improve the design of the bot's prompt.`,
		`You will be provided with the following inputs:`,
		`\t- prompt: The full prompt for the bot, including both the trigger and action components.`,
		`\t- reasoning: A brief explanation of how this test case might reveal a potential issue with the bot's prompt.`,
		`\t- case: The test case, consisting of the user input as defined by the input specification, the specific task triggered for the bot, and the corresponding bot response to that task.`,
		`It is possible that the user input does not trigger any task, or that the bot chooses not to respond even if a task is triggered.`,
		`Your Task:`,
		`Evaluate how provocative this case is in helping prompt designers identify potential issues with the bot's prompt, as explained in the provided reasoning. Rate the level of provocativeness on a scale from 1 to 5, using the following definitions:`,
		`\t 5: Very provocative`,
		`\t 4: Provocative`,
		`\t 3: Neutral`,
		`\t 2: Not provocative`,
		`\t 1: Not at all provocative`,
		`Output Format:`,
		`Return a JSON object with the following two properties:`,
		`\t- rating: A single number between 1 and 5, as defined above.`,
		`\t- explanation: A brief, 1 to 2 sentence explanation supporting your decision on the rating.`
	].join('\n');

	// console.log('\n\n========== General Evaluator System Prompt ==========\n\n');
	// console.log(systemPrompt);

	const evaluatorModel = getGenerativeModel(ai, {
		model: 'gemini-2.0-flash',
		systemInstruction: systemPrompt,
		generationConfig: {
			responseMimeType: 'application/json',
			responseSchema: Schema.object({
				properties: {
					rating: Schema.number(),
					explanation: Schema.string()
				}
			})
		}
	});

	const evaluatorPromises = testCases.map(async (testCase) => {
		const evaluatorUserPrompt = [
			`prompt: \n\t Trigger: ${testCase.prompt.trigger}\n\t Action: ${testCase.prompt.action}`,
			`reasoning: ${testCase.reasoning}`,
			`case:`,
			`\t- channel: ${testCase.channel}`,
			`\t- user message: ${testCase.userMessage}`,
			`\t- trigger task: ${testCase.triggeredTask === '0' ? 'No task is trigger' : newTasks[testCase.triggeredTask]}`,
			`\t- bot response: ${testCase.botResponse}`
		].join('\n');
		const evaluatorOutput = await evaluatorModel.generateContent(evaluatorUserPrompt);
		const evaluatorResult = JSON.parse(evaluatorOutput.response.text());
		return {
			...testCase,
			rating: evaluatorResult.rating,
			explanation: evaluatorResult.explanation
		};
	});

	await Promise.all(evaluatorPromises);
	const allCases = await Promise.all(evaluatorPromises);

	return allCases;
}
