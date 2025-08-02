import { bot } from '$lib/server/openAI/bot';
import { bot_capability, input_specification, community_tone } from '$lib/pipelines/prompts';
import { openAIClient } from '$lib/server/openAI/client';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

export async function underspecifiedPipeline(diffTask: Task, newTasks: Tasks) {
	try {
		const prompt = diffTask;

		// Detector Module
		const detectorSysPrompt = [
			`You are a helpful assistant tasked with identifying critical ambiguities in prompts written for language model-based bots deployed within an online community. This prompt defines:`,
			`\t- A trigger: when the bot should take action.`,
			`\t- An action: what the bot should do when triggered.`,
			bot_capability,
			`Your Task:`,
			`Read the full prompt carefully. Identify specific phrases or instructions that are ambiguous, underspecified, and open to multiple reasonable interpretations. Focus exclusively on ambiguities that could cause:`,
			`\t- Vague or undefined concepts`,
			`\t- Unclear boundaries or thresholds`,
			`\t- Conflicting or competing goals`,
			`\t- Situational or contextual assumptions`,
			`\t- Ambiguity about what, when, or how the bot is supposed to act`,
			`Prioritize ambiguities that could lead to reasonable differences in human interpretation, especially those where people might disagree about whether the bot's behavior is desirable. Focus on ambiguities that could cause visible inconsistencies in the bot's behavior. Do not list trivial ambiguities, style differences, or issues that would not affect how real users experience the bot.`,
			`Output Format:`,
			`Return a JSON object containing an array of ambiguities. Each ambiguity should have a unique key starting from 0 and include the following two properties:`,
			`\t- underspecified_phrase: a specific snippet from the prompt that is ambiguous`,
			`\t- description: a 1-2 sentence explanation of what makes it ambiguous or open to multiple interpretations`,
			`All values must be JSON-safe: wrap any field that contains commas in quotes, and avoid newlines. Do not include any extra text, formatting, or commentary outside the JSON object.`
		].join('\n');

		const DetectorOutputSchema = z.object({
			ambiguities: z.array(
				z.object({
					underspecified_phrase: z.string(),
					description: z.string()
				})
			)
		});

		const detectorResponse = await openAIClient.responses.parse({
			model: 'gpt-4.1',
			input: [
				{ role: 'system', content: detectorSysPrompt },
				{
					role: 'user',
					content: `Prompt\n\t Trigger: ${prompt.trigger}\n\t Action: ${prompt.action}`
				}
			],
			text: {
				format: zodTextFormat(DetectorOutputSchema, 'detectorResult')
			}
		});

		const detectorResult = detectorResponse.output_parsed;
		if (!detectorResult || !detectorResult.ambiguities) {
			console.log('No ambiguities detected or detectorResult is null.');
			return [];
		}

		// Generator Module

		const generatorSysPrompt = [
			`You are a helpful assistant tasked with generating input test cases that explore how ambiguous phrases in a bot's prompt could be interpreted in different, plausible ways. This prompt defines:`,
			`\t- A trigger: when the bot should take action.`,
			`\t- An action: what the bot should do when triggered.`,
			bot_capability,
			`You will be provided with:`,
			`\t- prompt: The full prompt for the bot, containing one or more ambiguous phrases.`,
			`\t- underspecified_phrase: a specific snippet from the prompt that is ambiguous.`,
			`\t- description: a 1-2 sentence explanation describing why the phrase is ambiguous or can be interpreted in multiple ways.`,
			`Your Task:`,
			`For each underspecified_phrase, generate a small set of test cases that illustrate distinct, plausible alternative interpretations of the phrase. A test case is an input to the bot that adheres to the following input specification:`,
			input_specification,
			`When generating test cases, prioritize those that provoke visible divergence in bot behavior—either in whether the bot responds (trigger ambiguity) or in how the bot responds (action ambiguity). Aim to create test cases that illustrate non-obvious yet reasonable interpretations, revealing hidden assumptions, unclear boundaries, or conflicting objectives within the original, underspecified phrase. If the ambiguity influences the bot's action, design the test case to elicit a bot response that clearly diverges from its typical default response. If the ambiguity concerns the trigger, focus on whether the bot responds or not. Each test case should make the ambiguity evident at the surface level, discernible from the channel, user message, and bot response alone, without the need for additional explanation.`,
			`Additionally, the test cases should be realistic and natural, mirroring the typical messages found in the following community and reflecting its unique tone:`,
			community_tone,
			`Do not generate test cases based on literal, overly obvious, or superficial interpretations. Avoid creating test cases that only involve minor tone or style differences, unless these differences have a clear impact on user-facing behavior. Additionally, do not include cases that would not affect how humans perceive or interact with the bot.`,
			`Output Format:`,
			`Return a JSON object containing an array of the generated test cases. Each case should have a unique key starting from 0 and include the following four properties.`,
			`\t- underspecified_phrase: the specific snippet from the prompt that is ambiguous.`,
			`\t- interpretation: a plausible alternative interpretation of the phrase that the test case is generated to illustrate.`,
			`\t- reasoning: a brief explanation of how the test case reveals the ambiguity.`,
			`\t- case: the input test case, formatted according to the input specification.`,
			`All values must be JSON-safe: wrap any field that contains commas in quotes, and avoid newlines. Do not include any extra text, formatting, or commentary outside the JSON object.`
		].join('\n');

		const GeneratorOutputSchema = z.object({
			cases: z.array(
				z.object({
					underspecified_phrase: z.string(),
					interpretation: z.string(),
					reasoning: z.string(),
					case: z.object({
						channel: z.string(),
						userMessage: z.string()
					})
				})
			)
		});

		const generatorPromises = detectorResult.ambiguities.map(
			(ambiguity: { underspecified_phrase: string; description: string }) => {
				const generatorUserPrompt = [
					`prompt: \n\t Trigger: ${prompt.trigger}\n\t Action: ${prompt.action}`,
					`underspecified_phrase: ${ambiguity.underspecified_phrase}`,
					`description: ${ambiguity.description}`
				].join('\n');
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
		for (const result of generatorSettledResults) {
			if (result.status === 'fulfilled' && result.value.output_parsed) {
				generatorResults.push(result.value.output_parsed);
			} else if (result.status === 'rejected') {
				console.error('A underspecified generator promise failed:', result.reason);
			}
		}

		// Bot Module
		const generatorCases = generatorResults.flatMap((gr) => gr.cases);
		const botResponsePromises = generatorCases.map(async (testCase) => {
			const { taskId, botResponse } = await bot(
				testCase.case.channel,
				testCase.case.userMessage,
				newTasks
			);
			return {
				underspecified_phrase: testCase.underspecified_phrase,
				interpretation: testCase.interpretation,
				reasoning: testCase.reasoning,
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

		// Evaluator Modudle
		const evaluatorSysPrompt = [
			`You are a helpful assistant tasked with evaluating whether a test case clearly demonstrates a plausible and critical alternative interpretation of an ambiguous phrase in a bot’s prompt. This prompt defines:`,
			`\t- A trigger: when the bot should take action.`,
			`\t- An action: what the bot should do when triggered.`,
			bot_capability,
			`You will be provided with:`,
			`\t- prompt: The full prompt for the bot, including both the trigger and action components.`,
			`\t- underspecified_phrase: a specific snippet from the prompt that is ambiguous.`,
			`\t- interpretation: a plausible alternative interpretation of the phrase that the test case is intended to illustrate.`,
			`\t- reasoning: a brief explanation describing how the test case could demonstrate this interpretation`,
			`\t- case: the test case itself, including the user message in a specific channel, the specific task triggered for the bot (if any), and the corresponding bot response to that task.`,
			`It is possible that the user input does not trigger any task, or that the bot chooses not to respond even if a task is triggered.`,
			`Your Task:`,
			`Decide whether the test case clearly and directly demonstrates the intended interpretation based only on the channel, user message, and bot response. The ambiguity must be apparent to a human without explanation.`,
			`At the same time, reject any test cases where the scenario assumes the bot can perform actions beyond its defined capabilities. Also, reject cases where the interpretation shown is non-critical—that is, it does not impact user understanding or the bot's behavior. Additionally, reject test cases that simply reflect an expected, default, or literal reading of the ambiguous phrase, as well as those where the demonstrated interpretation is too subtle for an average human to notice.`,
			`If the ambiguity involves how the bot should respond—meaning the action within the prompt is underspecified—consider the following additional steps: First, infer the generalized or default response the bot would typically give based on the prompt and input. Next, compare this default response to the bot's actual response in the test case. Approve the case only if the actual response shows a clear and noticeable difference from the default in terms of tone, structure, or content, such that the change would be obvious to a human observer. Minor shifts in tone, phrasing, or politeness do not count unless they lead to a significant change in the bot's observable behavior.`,
			`Output Format:`,
			`Return a JSON object with the following two properties:`,
			`\t- label: A boolean value—true if the test case visibly and meaningfully demonstrates the intended interpretation of the underspecified phrase; false if it does not, or if it is rejected.`,
			`\t- label_explanation: A brief, 1 to 2 sentence explanation supporting your decision.`
		].join('\n');

		const EvaluatorOutputSchema = z.object({
			label: z.boolean(),
			label_explanation: z.string()
		});

		const evaluatorPromises = botResponseResults.map(async (testCase) => {
			const evaluatorUserPrompt = [
				`prompt: \n\t Trigger: ${prompt.trigger}\n\t Action: ${prompt.action}`,
				`underspecified_phrase: ${testCase.underspecified_phrase}`,
				`interpretation: ${testCase.interpretation}`,
				`reasoning: ${testCase.reasoning}`,
				`case:`,
				`\t- channel: ${testCase.channel}`,
				`\t- user message: ${testCase.userMessage}`,
				`\t- trigger task: ${testCase.triggeredTask === '0' ? 'No task is trigger' : newTasks[testCase.triggeredTask]}`,
				`\t- bot response: ${testCase.botResponse}`
			].join('\n');

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

		return allCases;
	} catch (error) {
		console.log(error);
		return [];
	}
}
