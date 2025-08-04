import { bot } from '$lib/server/openAI/bot';
import { bot_capability } from '$lib/sharedPrompts';
import { openAIClient } from '$lib/server/openAI/client';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import _ from 'lodash';

export async function overspecifiedPipeline(
	diffTask: Task,
	newTasks: Tasks,
	community_tone: string,
	input_specification: string
) {
	const prompt = diffTask;

	// Detector Module
	const detectorSysPrompt = [
		`You are a helpful assistant tasked with identifying critical overspecified phrases in prompts written for language model-based bots. This prompt defines:`,
		`\t- A trigger: when the bot should take action.`,
		`\t- An action: what the bot should do when triggered.`,
		bot_capability,
		`Your Task:`,
		`Read the full prompt carefully. Identify overspecified phrases—parts of the prompt that unnecessarily limit the bot's behavior or responses, phrased too narrowly, rigidly, or tied to surface-level specifics. These may prevent the bot from fulfilling its broader functional purpose.`,
		`Follow these steps to complete your task:`,
		`1. Infer the Broader Goal: Read the full prompt carefully. Infer the broadest reasonable functional goal: what the bot is ultimately intended to detect, prevent, encourage, or support, independent of any surface-level constraints or examples mentioned in the wording of the prompt. Focus on the underlying user problem, situation, or need that the bot is designed to address. Ignore specific conditions, instances, or implementation details unless they are essential to the bot's purpose. Express the broader goal as what the bot should ideally support, if it were not constrained by unnecessary restrictions.`,
		`2. Identify Overspecified Phrases: Identify specific snippets of the prompt that unnecessarily constrain how the bot can fulfill its broader goal. Focus on requirements tied to particular content types, formats, channels, or contexts; examples treated as strict conditions; and narrow definitions that exclude plausible situations fitting the broader goal.`,
		`3. Define Uncovered Scenarios: For each overspecified phrase, describe as thoroughly as possible the set of scenarios that are currently excluded because of the restrictive wording. These scenarios should fit within the broader goal and could reasonably be handled by the bot without requiring any expansion of its capabilities.`,
		`Important: Do not include scenarios that are already covered by the current overspecified phrase. Think of uncovered scenarios as the portion of the broader goal left unaddressed due to the overspecified phrase. Apply deliberate creativity: consider realistic, plausible situations that are missed due to unnecessary specificity. Focus on diverse, meaningful cases that reflect the variety of user needs the bot is intended to support. Prioritize scenarios that are plausible within the community where the bot is deployed, likely to arise in typical use, and distinct from one another in form, context, or content.`,
		`Output Format:`,
		`Return a JSON object containing an array of overspecified phrases. Each phrase should have a unique key starting from 0 and include:`,
		`\t- broader_goal: the broader goal of the prompt, as you inferred from its content.`,
		`\t- overspecified_phrase: a specific quote or snippet from the prompt that is overly specific.`,
		`\t- uncovered_scenarios: a description of scenarios that are relevant to the broader goal but are not addressed by the current overspecified phrase.`,
		`All values must be JSON-safe: wrap any field that contains commas in quotes, and avoid newlines. Do not include any extra text, formatting, or commentary outside the JSON object.`
	].join('\n');

	const DetectorOutputSchema = z.object({
		overspecified_phrases: z.array(
			z.object({
				overspecified_phrase: z.string(),
				broader_goal: z.string(),
				uncovered_scenarios: z.string()
			})
		)
	});

	const detectorUserPrompt = `Prompt:\n\t- Trigger: ${prompt.trigger}\n\t- Action: ${prompt.action}`;

	const detectorResponse = await openAIClient.responses.parse({
		model: 'gpt-4.1',
		input: [
			{ role: 'system', content: detectorSysPrompt },
			{ role: 'user', content: detectorUserPrompt }
		],
		text: {
			format: zodTextFormat(DetectorOutputSchema, 'detectorResult')
		}
	});

	const detectorResult = detectorResponse.output_parsed;
	if (!detectorResult || !detectorResult.overspecified_phrases) {
		console.log('No overspecified phrases detected or detectorResult is null.');
		return [];
	}

	// console.log(`========== detectorSysPrompt ==========`);
	// console.log(detectorSysPrompt);

	// console.log(`========== detectorUserPrompt ==========`);
	// console.log(detectorUserPrompt);

	const generatorSysPrompt = [
		`You are a helpful assistant tasked with generating input test cases that illustrate how an overspecified phrase in a prompt might cause the bot to miss relevant situations. This prompt defines:`,
		`\t- A trigger: when the bot should take action.`,
		`\t- An action: what the bot should do when triggered.`,
		bot_capability,
		`You will be provided with:`,
		`\t- prompt: the full prompt for the bot, containing one or more overspecified phrases.`,
		`\t- overspecified_phrase: a specific snippet from the prompt identified as overly specific.`,
		`\t- broader_goal: the broader goal of the prompt.`,
		`\t- uncovered_scenarios: a description of scenarios that are relevant to the broader goal but excluded by the overspecified phrase.`,
		`Your Task:`,
		`For each overspecified_phrase, generate distinct test cases, where each case directly reflects one specific uncovered scenario from the provided list, aligns with the broader goal, and is currently excluded due to the overspecified phrase. A test case is an input to the bot that adheres to the following input specification:`,
		input_specification,
		`Each test case should visibly demonstrate how the overspecified phrase restricts the bot's behavior, excluding relevant situations that fit the broader goal. The missed scenario should be evident from the channel name and user message alone, without requiring further explanation. When designing test cases, prioritize those that surface differences in message content, phrasing, or context that realistically reflect how the overspecified phrase causes the bot to fail. Avoid trivial variations or unrealistic phrasing.`,
		`Additionally, the test cases should be realistic and natural, mirroring the typical messages found in the following community and reflecting its unique tone:`,
		community_tone,
		`Do not generate scenarios already covered by the overspecified phrase. Do not generate cases that require capabilities the bot does not have. Do not include trivial, repetitive, or unrealistic cases. The uncovered scenario should be clear to a human reviewer from the input alone.`,
		`Output Format:`,
		`Return a JSON object containing an array of generated test cases. Each case should have a unique key starting from 0 and include:`,
		`\t- uncovered_scenario: the specific uncovered scenario that the test case is generated to illustrate.`,
		`\t- reasoning: a brief explanation describing how the test case makes this uncovered scenario visible to a human reviewer.`,
		`\t- case: the input test case, formatted according to the input specification.`,
		`All values must be JSON-safe: wrap any field that contains commas in quotes, and avoid newlines. Do not include any extra text, formatting, or commentary outside the JSON object.`
	].join('\n');

	const GeneratorOutputSchema = z.object({
		cases: z.array(
			z.object({
				uncovered_scenario: z.string(),
				reasoning: z.string(),
				case: z.object({
					channel: z.string(),
					userMessage: z.string()
				})
			})
		)
	});

	let generatorUserPromptPrint = '';

	const generatorPromises = detectorResult.overspecified_phrases.map(
		(phraseObj: {
			overspecified_phrase: string;
			broader_goal: string;
			uncovered_scenarios: string;
		}) => {
			const generatorUserPrompt = [
				`prompt: \n\t Trigger: ${prompt.trigger}\n\t Action: ${prompt.action}`,
				`overspecified_phrase: ${phraseObj.overspecified_phrase}`,
				`broader_goal: ${phraseObj.broader_goal}`,
				`uncovered_scenarios: ${phraseObj.uncovered_scenarios}`
			].join('\n');
			if (generatorUserPromptPrint === '') generatorUserPromptPrint = generatorUserPrompt;
			return openAIClient.responses.parse({
				model: 'gpt-4.1',
				input: [
					{ role: 'system', content: generatorSysPrompt },
					{ role: 'user', content: generatorUserPrompt }
				],
				text: {
					format: zodTextFormat(GeneratorOutputSchema, 'generatorResult')
				}
			});
		}
	);
	const generatorSettledResults = await Promise.allSettled(generatorPromises);
	const generatorResults = [];
	for (const [index, result] of generatorSettledResults.entries()) {
		if (result.status === 'fulfilled' && result.value.output_parsed) {
			const originalPhraseObj = detectorResult.overspecified_phrases[index];
			generatorResults.push({
				..._.omit(originalPhraseObj, ['uncovered_scenarios']),
				...result.value.output_parsed
			});
		} else if (result.status === 'rejected') {
			console.error('An overspecified generator promise failed:', result.reason);
		}
	}

	const generatorCases = generatorResults.flatMap((item) =>
		item.cases.map(
			(singleCase: {
				uncovered_scenario: string;
				reasoning: string;
				case: {
					channel: string;
					userMessage: string;
				};
			}) => ({
				..._.omit(item, ['cases']),
				...singleCase
			})
		)
	);

	// console.log(`========== generatorSysPrompt ==========`);
	// console.log(generatorSysPrompt);

	// console.log(`========== generatorUserPrompt ==========`);
	// console.log(generatorUserPromptPrint);

	// Bot Module
	const botResponsePromises = generatorCases.map(async (testCase) => {
		const { taskId, botResponse } = await bot(
			testCase.case.channel,
			testCase.case.userMessage,
			newTasks
		);
		return {
			broader_goal: testCase.broader_goal,
			overspecified_phrase: testCase.overspecified_phrase,
			reasoning: testCase.reasoning,
			uncovered_scenario: testCase.uncovered_scenario,
			channel: testCase.case.channel,
			userMessage: testCase.case.userMessage,
			triggeredTask: taskId,
			botResponse: botResponse
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

	// Evaluator Module
	const evaluatorSysPrompt = [
		`You are a helpful assistant tasked with evaluating whether a test case effectively demonstrates an uncovered scenario caused by an overspecified phrase in a bot's prompt. This prompt defines:`,
		`\t- A trigger: when the bot should take action.`,
		`\t- An action: what the bot should do when triggered.`,
		bot_capability,
		`You will be provided with:`,
		`\t- prompt: the full prompt for the bot, including both the trigger and action components.`,
		`\t- overspecified_phrase: a snippet from the prompt that is identified as overly specific.`,
		`\t- broader_goal: the broader goal of the prompt.`,
		`\t- uncovered_scenario: the scenario the test case is designed to illustrate.`,
		`\t- reasoning: an explanation of how the test case illustrates the scenario that is uncovered by the overly specific phrase in the prompt.`,
		`\t- case: the test case itself, including the user message in a specific channel, the specific task triggered for the bot (if any), and the corresponding bot response to that task.`,
		`It is possible that the user input does not trigger any task, or that the bot chooses not to respond even if a task is triggered.`,
		`Your Task:`,
		`Decide whether the test case clearly and directly demonstrates the uncovered scenario caused by the overspecified phrase. Approve the test case only if it visibly reveals the restriction introduced by the overspecified phrase, showing that the bot fails to address a situation that clearly fits within the broader goal. The scenario must be plausible, relevant to the broader goal, and clearly observable based solely on the input message and bot response.  Approve only when a human reviewer could reasonably understand, from the input message and bot response alone, how the overspecified phrase prevents the bot from acting as intended.`,
		`Reject any test case where the uncovered scenario is unclear, irrelevant, trivial, or not apparent from the case itself. Additionally, reject any test case where the scenario requires the bot to perform actions beyond its defined capabilities.`,
		`Output Format:`,
		`Return a JSON object with the following two properties:`,
		`\t- label: A boolean value—true if the test case clearly demonstrates the uncovered scenario; false if it does not, or if it is rejected.`,
		`\t- label_explanation: a brief, 1 to 2 sentence explanation supporting your decision.`,
		`All values must be JSON-safe: wrap any field that contains commas in quotes, and avoid newlines. Do not include any extra text, formatting, or commentary outside the JSON object.`
	].join('\n');

	const EvaluatorOutputSchema = z.object({
		label: z.boolean(),
		label_explanation: z.string()
	});

	let evaluatorUserPromptPrint = '';

	const evaluatorPromises = botResponseResults.map(async (testCase) => {
		const evaluatorUserPrompt = [
			`prompt: \n\t Trigger: ${prompt.trigger}\n\t Action: ${prompt.action}`,
			`overspecified_phrase: ${testCase.overspecified_phrase}`,
			`broader_goal: ${testCase.broader_goal}`,
			`uncovered_scenario: ${testCase.uncovered_scenario}`,
			`reasoning: ${testCase.reasoning}`,
			`case:`,
			`\t- channel: ${testCase.channel}`,
			`\t- user message: ${testCase.userMessage}`,
			`\t- trigger task: ${testCase.triggeredTask === '0' ? 'No task is trigger' : newTasks[testCase.triggeredTask].name}`,
			`\t- bot response: ${testCase.botResponse}`
		].join('\n');

		if (evaluatorUserPromptPrint === '') evaluatorUserPromptPrint = evaluatorUserPrompt;

		return openAIClient.responses.parse({
			model: 'gpt-4.1',
			input: [
				{ role: 'system', content: evaluatorSysPrompt },
				{ role: 'user', content: evaluatorUserPrompt }
			],
			text: {
				format: zodTextFormat(EvaluatorOutputSchema, 'evaluatorResult')
			}
		});
	});

	const evaluatorSettledResults = await Promise.allSettled(evaluatorPromises);

	const allCases = [];
	for (const [index, result] of evaluatorSettledResults.entries()) {
		if (result.status === 'fulfilled' && result.value.output_parsed) {
			allCases.push({
				...botResponseResults[index],
				...result.value.output_parsed,
				prompt: prompt
			});
		} else if (result.status === 'rejected') {
			console.error('An evaluator promise failed:', result.reason);
		}
	}

	// console.log(`========== evaluatorSysPrompt ==========`);
	// console.log(evaluatorSysPrompt);

	// console.log(`========== evaluatorUserPrompt ==========`);
	// console.log(evaluatorUserPromptPrint);

	return allCases;
}
