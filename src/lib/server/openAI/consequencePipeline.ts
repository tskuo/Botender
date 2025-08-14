import { bot } from '$lib/server/openAI/bot';
import { bot_capability } from '$lib/sharedPrompts';
import { openAIClient, openAIModel } from '$lib/server/openAI/client';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

export async function consequencePipeline(
	diffTask: Task,
	newTasks: Tasks,
	community_tone: string,
	input_specification: string
) {
	const prompt = diffTask;

	// Detector Module
	const detectorSysPrompt = [
		`You are a helpful assistant tasked with identifying potential unintended consequences in prompts written for language model-based bots deployed within an online community. This prompt defines:`,
		`\t- A trigger: when the bot should take action.`,
		`\t- An action: what the bot should do when triggered.`,
		bot_capability,
		`Your Task:`,
		`Read the full prompt carefully. Identify specific phrases or instructions that could lead to unintended community-level consequences. Focus on aspects of the prompt that may produce negative impacts on participation, trust, tone, or community experience—even if the prompt appears clear or well-intentioned. Surface potential value tensions, social risks, and moderation pitfalls that the community may wish to proactively consider or address. Focus on raising concerns about the prompt's direction, tone, or broader social implications, rather than evaluating its precision or scope. Your goal is to help the community clarify its values and anticipate potential risks before deployment.`,
		`Draw from the following four types of potential unintended consequences of the bot to guide your analysis. These consequences are especially useful for prompting community reflection, surfacing implicit values, and encouraging more thoughtful moderation design:`,
		`1. Encouraging Contribution: Bots may unintentionally discourage participation by overemphasizing metrics or feedback, crowding out users' intrinsic motivation to learn, explore, or contribute creatively. Praise or corrections may feel impersonal or manipulative if delivered rigidly by a bot, undermining trust and commitment. Bots may also reinforce dominant behaviors or popular contributions, marginalizing diverse or alternative forms of value. Replacing personal recognition with automated responses may erode the human connection essential for healthy participation.`,
		`2. Encouraging Commitment: Bots that overlook users' prior efforts, personal goals, or community identity signals may weaken ongoing participation. Ignoring users' history of contributions, social ties, or personal motivations (like fun or growth) can reduce their investment in the community. Overly procedural enforcement may disrupt the sense of belonging and shared identity that helps retain contributors.`,
		`3. Regulating Behavior: Bots may enforce norms in ways that feel confusing, unfair, or alienating. Responses may lack clarity or consistency, punish users without giving them a dignified way to recover, or impose overly harsh or arbitrary sanctions that erode trust. Automated moderation risks appearing punitive rather than supportive, especially if responses feel generic or opaque. Failing to track repeat issues or ignoring community tone can further damage perceptions of fairness, legitimacy, and ownership.`,
		`4. Managing Newcomer Integration: Newcomers may be deterred if bots apply strict rules too early, fail to explain expectations clearly, or do not provide enough early guidance. Rigid enforcement or unclear onboarding may lead to confusion, early mistakes, and disengagement. Bots that present norms too formally or too casually may mislead newcomers about the community's actual tone or values. Abrupt exposure to complex tasks without scaffolding may overwhelm or alienate new participants.`,
		`Prioritize unintended consequences of the prompt that could significantly affect real user experience. The unintended consequence you identify should be something that can be addressed by revising the prompt's wording, without needing to expand the bot's capabilities. Avoid trivial issues, style preferences, or theoretical edge cases unlikely to occur in practice.`,
		`Output Format:`,
		`Return a JSON object containing an array of potential unintended consequences. Each consequence should have a unique key starting from 0 and include the following two properties:`,
		`\t- problematic_phrase: a specific quote or snippet from the prompt that could potentially cause unintended consequences.`,
		`\t- consequence: a 1 to 2 sentence explanation of the possible unintended consequence or concern related to this phrase`,
		`All values must be JSON-safe: wrap any field that contains commas in quotes, and avoid newlines. Do not include any extra text, formatting, or commentary outside the JSON object.`
	].join('\n');

	const DetectorOutputSchema = z.object({
		consequences: z.array(
			z.object({
				problematic_phrase: z.string(),
				consequence: z.string()
			})
		)
	});

	const detectorUserPrompt = `Prompt:\n\t- Trigger: ${prompt.trigger}\n\t- Action: ${prompt.action}`;

	const detectorResponse = await openAIClient.responses.parse({
		model: openAIModel,
		input: [
			{ role: 'system', content: detectorSysPrompt },
			{ role: 'user', content: detectorUserPrompt }
		],
		text: {
			format: zodTextFormat(DetectorOutputSchema, 'detectorResult')
		}
	});

	const detectorResult = detectorResponse.output_parsed;
	if (!detectorResult || !detectorResult.consequences) {
		console.log('No consequences detected or detectorResult is null.');
		return [];
	}

	// console.log(`========== detectorSysPrompt ==========`);
	// console.log(detectorSysPrompt);

	// console.log(`========== detectorUserPrompt ==========`);
	// console.log(detectorUserPrompt);

	// Generator Module

	const generatorSysPrompt = [
		`You are a helpful assistant tasked with generating input test cases that illustrate how specific problematic phrases in a language model-based bot's prompt could unintentionally cause harm to the online community where the bot is deployed. These test cases are intended to reveal how the bot's current design may challenge important community values and spark thoughtful reflection on the behaviors the community wishes to encourage.`,
		`The prompt of the bot defines:`,
		`\t- A trigger: when the bot should take action.`,
		`\t- An action: what the bot should do when triggered.`,
		bot_capability,
		`You will be provided with:`,
		`\t- prompt: the full prompt for the bot, containing one or more potentially problematic phrases.`,
		`\t- problematic_phrase: a specific snippet from the prompt that could potentially cause unintended consequences.`,
		`\t- consequence: the possible unintended consequence identified as a result of the potentially problematic phrase.`,
		`Your Task:`,
		`For each identified consequence, create a single, credible test case that naturally depicts how this consequence might arise. A test case is an input to the bot that adheres to the following input specification:`,
		input_specification,
		`Each test case should stand alone as a compelling, credible example—illustrating the tension between the prompt and the community value at risk. The consequence should be visible at the surface level, without relying on further explanation.`,
		`Additionally, the test cases should be realistic and natural, mirroring the typical messages found in the following community and reflecting its unique tone:`,
		community_tone,
		`Output Format:`,
		`Return a JSON object with the following two properties:`,
		`\t- reasoning: a brief explanation of how the test case reveals the unintended consequence.`,
		`\t- case: the input test case, formatted according to the input specification.`,
		`All values must be JSON-safe: wrap any field that contains commas in quotes, and avoid newlines. Do not include any extra text, formatting, or commentary outside the JSON object.`
	].join('\n');

	const GeneratorOutputSchema = z.object({
		reasoning: z.string(),
		case: z.object({
			channel: z.string(),
			userMessage: z.string()
		})
	});

	let generatorUserPromptPrint = '';

	const generatorPromises = detectorResult.consequences.map(
		(c: { problematic_phrase: string; consequence: string }) => {
			const generatorUserPrompt = [
				`prompt: \n\t Trigger: ${prompt.trigger}\n\t Action: ${prompt.action}`,
				`problematic_phrase: ${c.problematic_phrase}`,
				`consequence: ${c.consequence}`
			].join('\n');
			if (generatorUserPromptPrint === '') generatorUserPromptPrint = generatorUserPrompt;
			return openAIClient.responses.parse({
				model: openAIModel,
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
			const originalConsequence = detectorResult.consequences[index];
			generatorResults.push({
				...originalConsequence,
				...result.value.output_parsed
			});
		} else if (result.status === 'rejected') {
			console.error('A consequence generator promise failed:', result.reason);
		}
	}

	// console.log(`========== generatorSysPrompt ==========`);
	// console.log(generatorSysPrompt);

	// console.log(`========== generatorUserPrompt ==========`);
	// console.log(generatorUserPromptPrint);

	// Bot Module
	const botResponsePromises = generatorResults.map(async (testCase) => {
		const { taskId, botResponse } = await bot(
			testCase.case.channel,
			testCase.case.userMessage,
			newTasks
		);
		return {
			problematic_phrase: testCase.problematic_phrase,
			consequence: testCase.consequence,
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

	// Evaluator Module
	const evaluatorSysPrompt = [
		`You are a helpful assistant tasked with evaluating whether a test case clearly demonstrates how a specific problematic phrase in a language model-based bot's prompt could lead to unintended negative consequences for the online community where the bot is deployed. The bot's prompt defines:`,
		`\t- A trigger: when the bot should take action.`,
		`\t- An action: what the bot should do when triggered.`,
		bot_capability,
		`You will be provided with:`,
		`\t- prompt: the full prompt for the bot, including both the trigger and action components.`,
		`\t- problematic_phrase: a specific snippet from the prompt that could potentially cause unintended consequences.`,
		`\t- consequence: the possible unintended consequence identified as a result of the potentially problematic phrase.`,
		`\t- reasoning: a brief explanation of how the test case reveals the unintended consequence.`,
		`\t- case: the test case itself, including the user message in a specific channel, the specific task triggered for the bot (if any), and the corresponding bot response to that task.`,
		`It is possible that the user input does not trigger any task, or that the bot chooses not to respond even if a task is triggered.`,
		`Your Task:`,
		`Decide whether the test case clearly and convincingly demonstrates the described unintended consequence. Approve the test case only if the consequence is visibly illustrated through the input and bot response (if any), the scenario is realistic, relevant to the community, and a human reviewer could reasonably understand, from the case alone, how the problematic phrase in the prompt could lead to that consequence. Only approve the case if it clearly tests the goal stated in the input reasoning.`,
		`Reject any test case if the consequence is unclear, trivial, or not apparent from the input and response, if the scenario would not affect real user experience or community dynamics, or if understanding the case relies on abstract reasoning that is not visible in the example itself.`,
		`Output Format:`,
		`Return a JSON object with the following two properties:`,
		`\t- label: A boolean value—true if the provided test case clearly demonstrates the consequence; false if it does not, or if it is rejected.`,
		`\t- label_explanation: a brief, 1 to 2 sentence explanation supporting your decision.`,
		`All values must be JSON-safe: wrap any field that contains commas in quotes, and avoid newlines. Do not include any extra text, formatting, or commentary outside the JSON object.`
	].join('\n');

	const EvaluatorOutputSchema = z.object({
		label: z.boolean(),
		label_explanation: z.string()
	});

	let evaluatorUserPromptPrint = '';

	const evaluatorPromises = botResponseResults.map((testCase) => {
		const evaluatorUserPrompt = [
			`prompt: \n\t Trigger: ${prompt.trigger}\n\t Action: ${prompt.action}`,
			`problematic_phrase: ${testCase.problematic_phrase}`,
			`consequence: ${testCase.consequence}`,
			`reasoning: ${testCase.reasoning}`,
			`case:`,
			`\t- channel: ${testCase.channel}`,
			`\t- user message: ${testCase.userMessage}`,
			`\t- trigger task: ${testCase.triggeredTask === '0' ? 'No task is trigger' : newTasks[testCase.triggeredTask].name}`,
			`\t- bot response: ${testCase.botResponse}`
		].join('\n');

		if (evaluatorUserPromptPrint === '') evaluatorUserPromptPrint = evaluatorUserPrompt;

		return openAIClient.responses.parse({
			model: openAIModel,
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
		if (result.status === 'fulfilled' && result.value.output_parsed?.label) {
			// Combine the original test case data with the new evaluation result
			allCases.push({
				...botResponseResults[index],
				...result.value.output_parsed,
				prompt: prompt,
				issue: 'unintended consequences of the prompt'
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
