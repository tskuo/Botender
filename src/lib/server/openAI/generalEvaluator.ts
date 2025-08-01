import { bot_capability } from '$lib/pipelines/prompts';
import { openAIClient } from '$lib/server/openAI/client';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

export async function generalEvaluator(newTasks: Tasks, testCases) {
	const generalEvaluatorSysPrompt = [
		`You are a helpful assistant tasked with evaluating how provocative a given test case is, to support prompt designers in refining the prompt of a language model-based bot deployed within an online community. This prompt defines:`,
		`\t- A trigger: when the bot should take action.`,
		`\t- An action: what the bot should do when triggered.`,
		bot_capability,
		`You will be provided with:`,
		`\t- prompt: The full prompt for the bot, including both the trigger and action components.`,
		// `\t- reasoning: A brief explanation of how this test case might reveal a potential issue with the bot's prompt.`,
		`\t- case: The test case, consisting of the user input as defined by the input specification, the specific task triggered for the bot, and the corresponding bot response to that task.`,
		`It is possible that the user input does not trigger any task, or that the bot chooses not to respond even if a task is triggered.`,
		`Your Task:`,
		`Evaluate how provocative this case is at encouraging designers to recognize or consider potential issues within the bot's prompt. For example, a prompt might contain ambiguous phrasing that leads to inconsistent expectations of the bot's behavior, or overly specific language that fails to address scenarios the prompt should cover. Consider also any potential unintended consequences that could result from the bot's behavior.`,
		`Rate the level of provocativeness on a scale from 1 to 5, using the following definitions:`,
		`1 — Not Provocative`,
		`\t- Case is straightforward, unambiguous, and typical.`,
		`\t- It does not surface new concerns or highlight any notable risks or design considerations.`,
		`\t- Unlikely to lead to discussion or rethinking of current prompt design.`,
		`2 — Slightly Provocative`,
		`\t- Case exposes very minor ambiguities or edge cases within the prompt.`,
		`\t- Raises some minor concern or question, but is easily addressed and unlikely to cause significant design reflection or change.`,
		`3 — Moderately Provocative`,
		`\t- Case draws attention to clear but non-critical prompt issues.`,
		`\t- Examples include ambiguities, gaps in instructions, or scenarios that might lead to inconsistent bot responses.`,
		`\t- Encourages some reflection and possibly minor revisions in prompt design.`,
		`4 — Highly Provocative`,
		`\t- Case unveils significant ambiguities or specific language in the prompt that could lead to unexpected bot outputs.`,
		`\t- Highlights risks of misinterpretation or unintended consequences that could impact user experience or safety.`,
		`\t- Likely to spark in-depth review and thoughtful redesign of prompt.`,
		`5 — Extremely Provocative`,
		`\t- Case is deeply challenging and brings to light fundamental weaknesses, critical ambiguities, or severe design flaws in the prompt.`,
		`\t- Exposes potential for serious, unintended, or even harmful outcomes due to poor prompt design.`,
		`\t- Demands urgent and comprehensive redesign or reconsideration of prompt approach.`,
		`Output Format:`,
		`Return a JSON object with the following two properties:`,
		`\t- rating: A single number between 1 and 5, as defined above.`,
		`\t- rating_explanation: A brief, 1 to 2 sentence explanation supporting your decision on the rating.`
	].join('\n');

	const GeneralEvaluatorOutputSchema = z.object({
		rating: z.number(),
		rating_explanation: z.string()
	});

	const generalEvaluatorPromises = testCases.map((testCase) => {
		const generalEvaluatorUserPrompt = [
			`prompt: \n\t Trigger: ${testCase.prompt.trigger}\n\t Action: ${testCase.prompt.action}`,
			// `reasoning: ${testCase.reasoning}`,
			`case:`,
			`\t- channel: ${testCase.channel}`,
			`\t- user message: ${testCase.userMessage}`,
			`\t- trigger task: ${testCase.triggeredTask === '0' ? 'No task is trigger' : newTasks[testCase.triggeredTask]}`,
			`\t- bot response: ${testCase.botResponse}`
		].join('\n');

		return openAIClient.responses.parse({
			model: 'gpt-4.1',
			input: [
				{ role: 'system', content: generalEvaluatorSysPrompt },
				{ role: 'user', content: generalEvaluatorUserPrompt }
			],
			text: {
				format: zodTextFormat(GeneralEvaluatorOutputSchema, 'generalEvaluatorResult')
			}
		});
	});

	const generalEvaluatorSettledResults = await Promise.allSettled(generalEvaluatorPromises);

	const allCases = [];
	for (const [index, result] of generalEvaluatorSettledResults.entries()) {
		if (result.status === 'fulfilled' && result.value.output_parsed) {
			// Combine the original test case data with the new evaluation result
			allCases.push({
				...testCases[index],
				...result.value.output_parsed
			});
		} else if (result.status === 'rejected') {
			console.error('A general evaluator promise failed:', result.reason);
		}
	}

	return allCases;
}
