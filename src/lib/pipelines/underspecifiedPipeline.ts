import { bot } from '$lib/bot';
import { bot_capability, input_specification, community_tone } from '$lib/pipelines/prompts';
import { getGenerativeModel, Schema } from 'firebase/ai';
import { ai } from '$lib/firebase';

export async function underspecifiedPipeline(diffTask: Task, newTasks: Tasks) {
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
		`\t- underspecified_phrase: a specific quote or snippet from the prompt that is ambiguous`,
		`\t- description: a 1-2 sentence explanation of what makes it ambiguous or open to multiple interpretations`,
		`All values must be JSON-safe: wrap any field that contains commas in quotes, and avoid newlines. Do not include any extra text, formatting, or commentary outside the JSON object.`
	].join('\n');

	// console.log('\n\n========== Detector System Prompt ==========\n\n');
	// console.log(detectorSysPrompt);

	const detectorModel = getGenerativeModel(ai, {
		model: 'gemini-2.0-flash',
		systemInstruction: detectorSysPrompt,
		generationConfig: {
			responseMimeType: 'application/json',
			responseSchema: Schema.object({
				properties: {
					ambiguities: Schema.array({
						items: Schema.object({
							properties: {
								underspecified_phrase: Schema.string(),
								description: Schema.string()
							}
						})
					})
				}
			})
		}
	});

	// console.log('\n\n========== Detector User Prompt ==========\n\n');
	// console.log(`Prompt\n\t Trigger: ${prompt.trigger}\n\t Action: ${prompt.action}`);

	const detectorOutput = await detectorModel.generateContent(
		`Prompt\n\t Trigger: ${prompt.trigger}\n\t Action: ${prompt.action}`
	);

	const detectorResult = JSON.parse(detectorOutput.response.text());

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
	// console.log('\n\n========== Generator System Prompt ==========\n\n');
	// console.log(generatorSysPrompt);

	const generatorModel = getGenerativeModel(ai, {
		model: 'gemini-2.0-flash',
		systemInstruction: generatorSysPrompt,
		generationConfig: {
			responseMimeType: 'application/json',
			responseSchema: Schema.object({
				properties: {
					cases: Schema.array({
						items: Schema.object({
							properties: {
								underspecified_phrase: Schema.string(),
								interpretation: Schema.string(),
								reasoning: Schema.string(),
								case: Schema.object({
									properties: {
										channel: Schema.string(),
										userMessage: Schema.string()
									}
								})
							}
						})
					})
				}
			})
		}
	});

	const generatorPromises = detectorResult.ambiguities.map(
		(ambiguity: { underspecified_phrase: string; description: string }) => {
			const generatorPrompt = [
				`prompt: \n\t Trigger: ${prompt.trigger}\n\t Action: ${prompt.action}`,
				`underspecified_phrase: ${ambiguity.underspecified_phrase}`,
				`description: ${ambiguity.description}`
			].join('\n');
			// console.log(`\n\n========== Generator User Prompt ${idx} ==========\n\n`);
			// console.log(generatorPrompt);
			return generatorModel.generateContent(generatorPrompt);
		}
	);
	const generatorOutputs = await Promise.all(generatorPromises);
	const generatorResults = generatorOutputs.map((output) => JSON.parse(output.response.text()));

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

	const botResponseResults = await Promise.all(botResponsePromises);

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

	// console.log('\n\n========== Evaluator System Prompt ==========\n\n');
	// console.log(evaluatorSysPrompt);

	const evaluatorModel = getGenerativeModel(ai, {
		model: 'gemini-2.0-flash',
		systemInstruction: evaluatorSysPrompt,
		generationConfig: {
			responseMimeType: 'application/json',
			responseSchema: Schema.object({
				properties: {
					label: Schema.boolean(),
					label_explanation: Schema.string()
				}
			})
		}
	});

	const evaluatorPromises = botResponseResults.map(async (testCase) => {
		const evaluatorPrompt = [
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
		// console.log(`\n\n========== Evaluator User Prompt ==========\n\n`);
		// console.log(evaluatorPrompt);
		const evaluatorOutput = await evaluatorModel.generateContent(evaluatorPrompt);
		const evaluatorResult = JSON.parse(evaluatorOutput.response.text());
		return {
			...testCase,
			label: evaluatorResult.label,
			label_explanation: evaluatorResult.label_explanation,
			prompt: prompt
		};
	});

	await Promise.all(evaluatorPromises);
	const allCases = await Promise.all(evaluatorPromises);

	return allCases;
}
