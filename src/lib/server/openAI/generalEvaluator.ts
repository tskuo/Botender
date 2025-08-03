import { bot_capability } from '$lib/pipelines/prompts';
import { openAIClient } from '$lib/server/openAI/client';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

export async function generalEvaluator(newTasks: Tasks, testCases) {
	const generalEvaluatorSysPrompt = [
		`You are a helpful assistant tasked with evaluating how provocative a given test case is, to support prompt designers in refining the prompt and behavior of a language model-based bot deployed within an online community. This prompt defines:`,
		`\t- A trigger: when the bot should take action.`,
		`\t- An action: what the bot should do when triggered.`,
		bot_capability,
		`You will be provided with:`,
		`\t- prompt: the full prompt for the bot, including both the trigger and action components.`,
		`\t- case: the test case, including the user message in a specific channel, the specific task triggered for the bot (if any), and the corresponding bot response to that task.`,
		`It is possible that the user input does not trigger any task, or that the bot chooses not to respond even if a task is triggered.`,
		`Your Task:`,
		`Evaluate how effectively this test case reveals potential issues in the prompt that might provoke prompt designers or community moderators to consider how they could revise and improve the prompt to prevent such issues. To do this, follow the steps below:`,
		`Step 1. Infer Issues: Examine the test case and prompt together to identify what issue(s) the case may reveal. These might include:`,
		`\t- Underspecified Prompt: Vague or open-ended language in the prompt can lead to multiple valid interpretations, resulting in differing expectations for how the bot should handle a given case.`,
		`\t- Overspecified Prompt: Rigid or overly narrow language in the prompt may exclude reasonable cases that the bot is expected to handle.`,
		`\t- Unintended Consequence of the Prompt: The prompt may cause unintended community-level harm, such as discouraging participation, undermining commitment, alienating users, or confusing newcomers.`,
		`Step 2. Evaluate Provocativeness: Assess how effectively the test case brings the inferred issue(s) to the surface and invites deeper thinking. Consider the following aspects when judging provocativeness:`,
		`\t- A provocative case should highlight something surprising, risky, or that challenges existing assumptions.`,
		`\t- A provocative case should prompt a thoughtful community moderator or prompt designer to pause, reflect, or want to start a discussion about the case.`,
		`\t- A provocative case may reveal a design tension or dilemma that people might not have fully considered before.`,
		`\t- Provocativeness isn't limited to exposing major issues—subtle or situational concerns can be just as compelling, especially when they are presented in a way that feels authentic and relatable.`,
		`\tImportant: Do not judge the case based on whether the bot's response is correct, ideal, or even present. Focus on the usefulness of the case itself for prompt revision—not whether the bot performs well. Valuable cases often reveal something about the prompt even if the bot's reply is absent or minimal.`,
		`Step 3. Rate the Case: Assign a rating from 1 to 5 based on how well the test case surfaces the issue and invites thoughtful reflection—on its own, without additional explanation. Use the following rating scale:`,
		`5 - Deeply Reflective`,
		`\t- Brings a major issue to light—ethical, emotional, or systemic.`,
		`\t- Feels urgent or resonant. Likely to spark serious discussion or revision.`,
		`4 - Strongly Reflective`,
		`\t- Clearly surfaces a meaningful problem or tension.`,
		`\t- Prompts consideration or thoughtful debate.`,
		`3 - Moderately Reflective`,
		`\t- Highlights a real, valid issue—though less surprising or critical.`,
		`\t- Still useful for understanding prompt behavior.`,
		`2 - Slightly Reflective`,
		`\t- Surfaces a minor or expected limitation.`,
		`\t- May be helpful as part of a broader pattern, but less striking on its own.`,
		`1 - Not Reflective`,
		`\t- Does not surface any notable issue or tension.`,
		`\t- Unlikely to influence prompt design decisions.`,
		`\t- Includes validation or confirmation cases where the bot acts in accordance with expectations, without surfacing new concerns.`,
		`When rating cases, remember that test cases are not meant to confirm correct bot behavior. Instead, their purpose is to encourage reflection and spark discussion about potential changes to the prompt.`,
		`Output Format:`,
		`Return a JSON object with the following two properties:`,
		`\t- rating: a single number between 1 and 5, as defined above.`,
		`\t- rating_explanation: a brief, 1 to 2 sentence explanation supporting your decision on the rating.`
	].join('\n');

	const GeneralEvaluatorOutputSchema = z.object({
		rating: z.number(),
		rating_explanation: z.string()
	});

	let generalEvaluatorUserPromptPrint = '';

	const generalEvaluatorPromises = testCases.map((testCase) => {
		const generalEvaluatorUserPrompt = [
			`prompt:\n\t- Trigger: ${testCase.prompt.trigger}\n\t- Action: ${testCase.prompt.action}`,
			// `reasoning: ${testCase.reasoning}`,
			`case:`,
			`\t- channel: ${testCase.channel}`,
			`\t- user message: ${testCase.userMessage}`,
			`\t- trigger task: ${testCase.triggeredTask === '0' ? 'No task is trigger' : newTasks[testCase.triggeredTask].name}`,
			`\t- bot response: ${testCase.botResponse}`
		].join('\n');

		if (generalEvaluatorUserPromptPrint === '')
			generalEvaluatorUserPromptPrint = generalEvaluatorUserPrompt;

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

	// console.log(`========== generalEvaluatorSysPrompt ==========`);
	// console.log(generalEvaluatorSysPrompt);

	// console.log(`========== generalEvaluatorUserPrompt ==========`);
	// console.log(generalEvaluatorUserPromptPrint);

	return allCases;
}
