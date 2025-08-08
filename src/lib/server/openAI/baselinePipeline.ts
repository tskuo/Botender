import { bot } from '$lib/server/openAI/bot';
import { bot_capability } from '$lib/sharedPrompts';
import { openAIClient, openAIModel } from '$lib/server/openAI/client';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const SELECT_CASE_NUMBER = 5;

export async function baselinePipeline(
	diffTask: Task,
	newTasks: Tasks,
	community_tone: string,
	input_specification: string
) {
	const prompt = diffTask;

	// One-Step Generator Module
	const generatorSysPrompt = [
		`You are a helpful assistant tasked with identifying potential issues in prompts written for language model-based bots deployed within an online community. This prompt defines:`,
		`\t- A trigger: when the bot should take action.`,
		`\t- An action: what the bot should do when triggered.`,
		bot_capability,
		`You will be provided with:`,
		`\t- prompt: the full prompt for the bot, including both the trigger and action components.`,
		`Your Task:`,
		`Generate ${SELECT_CASE_NUMBER} realistic test cases that could support people in reflecting on the wording of the prompt. A test case is an input to the bot that adheres to the following input specification:`,
		input_specification,
		`Additionally, the test cases should be realistic and natural, mirroring the typical messages found in the following community and reflecting its unique tone:`,
		community_tone,
		`Output Format:`,
		`Return a JSON object containing an array of the generated test cases. Each case should have a unique key starting from 0 and include the following two properties.`,
		`\t- reasoning: a brief explanation of the potential issue this test case could reveal in the bot's prompt.`,
		`\t- case: the input test case, formatted according to the input specification.`,
		`All values must be JSON-safe: wrap any field that contains commas in quotes, and avoid newlines. Do not include any extra text, formatting, or commentary outside the JSON object.`
	].join('\n');

	const GeneratorOutputSchema = z.object({
		cases: z.array(
			z.object({
				reasoning: z.string(),
				case: z.object({
					channel: z.string(),
					userMessage: z.string()
				})
			})
		)
	});

	const generatorUserPrompt = `Prompt:\n\t- Trigger: ${prompt.trigger}\n\t- Action: ${prompt.action}`;

	const generatorResponse = await openAIClient.responses.parse({
		model: openAIModel,
		input: [
			{ role: 'system', content: generatorSysPrompt },
			{ role: 'user', content: generatorUserPrompt }
		],
		text: {
			format: zodTextFormat(GeneratorOutputSchema, 'detectorResult')
		}
	});

	const generatorResult = generatorResponse.output_parsed;
	if (!generatorResult || !generatorResult.cases) {
		console.log('No cases generated or generatorResult is null.');
		return [];
	}

	// console.log(`========== generatorSysPrompt ==========`);
	// console.log(generatorSysPrompt);

	// console.log(`========== generatorUserPrompt ==========`);
	// console.log(generatorUserPrompt);

	const botResponsePromises = generatorResult.cases.map(async (testCase) => {
		const { taskId, botResponse } = await bot(
			testCase.case.channel,
			testCase.case.userMessage,
			newTasks
		);
		return {
			channel: testCase.case.channel,
			userMessage: testCase.case.userMessage,
			triggeredTask: taskId,
			botResponse: botResponse,
			reasoning: testCase.reasoning
		};
	});

	const botResponseSettledResults = await Promise.allSettled(botResponsePromises);

	const botResponseResults = [];
	for (const result of botResponseSettledResults) {
		if (result.status === 'fulfilled') {
			botResponseResults.push(result.value);
		} else {
			console.error('A bot simulation promise failed:', result.reason);
		}
	}

	return botResponseResults;
}
