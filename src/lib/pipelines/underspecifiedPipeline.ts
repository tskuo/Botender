import { bot } from '$lib/bot';
import { bot_capability, input_specification, community_tone } from '$lib/pipelines/prompts';
import { getGenerativeModel, Schema } from 'firebase/ai';
import { ai } from '$lib/firebase';

export async function underspecifiedPipeline(diffTask: Task, newTasks: Tasks) {
	const prompt = diffTask;

	// Detector Module
	const detectorSysPrompt = [
		`You are a helpful assistant supporting users in improving the clarity and consistency of prompts given to language model-based bots. Your task is to identify underspecified parts of a prompt: phrases that could be interpreted in different ways by different people, or that might cause the bot to behave inconsistently or unpredictably.`,
		bot_capability,
		`Your Task:`,
		`Read the full prompt carefully. Identify specific phrases, wordings, or instructions that may be ambiguous. These are parts that could reasonably be interpreted in multiple ways, especially in terms of:`,
		`\t- Vague or undefined concepts`,
		`\t- Unclear boundaries or thresholds`,
		`\t- Conflicting or competing goals`,
		`\t- Situational or contextual assumptions`,
		`\t- Ambiguity about what, when, or how the bot is supposed to act`,
		`Rather than listing every possible ambiguity, focus on those that are most likely to significantly affect how people perceive the bot's effectiveness.`,
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
		`You are a helpful assistant tasked with generating test cases that illustrate different interpretations of ambiguous language in a prompt. The prompt, which includes both a trigger and an action component, guides the behavior of a language model-based bot. Specifically, the bot receives user input, as defined by the input specification, and determines whether to respond based on the trigger described in the prompt. If the bot decides to respond, it generates output according to the action specified in the prompt. Your goal is to create input test cases for the bot that help human users reflect on how the prompt could be interpreted inconsistently and support collective clarification of its intended meaning. In some cases, you may not yet know whether a test case will successfully illustrate a particular interpretation of ambiguous language, since you don't know how the bot will actually respond. However, you should aim to create test cases that are likely to prompt the bot to produce the response you intend to illustrate.`,
		`You will be provided with the following inputs:`,
		`\t- prompt: The full prompt for the bot, containing one or more ambiguous phrases.`,
		`\t- underspecified_phrase: a specific quote or snippet from the prompt that is ambiguous`,
		`\t- description: a 1-2 sentence explanation of what makes it ambiguous or open to multiple interpretations`,
		`Your Task:`,
		`For each underspecified phrase, generate a small, reasonable set of test cases that illustrate different plausible interpretations of the phrase, based on the given description. Each case should be legible on its own and clearly reflect the ambiguity it is meant to highlight, even without further explanations. It is crucial that the test case itself makes the ambiguity apparent.`,
		`Each test case must be a valid input according to the following input specification:`,
		input_specification,
		`Additionally, each case should be realistic and natural, reflecting the tone, slang, punctuation, and style typical of the specific community where the bot is being deployed. Here is a description of the community:`,
		community_tone,
		`Output Format:`,
		`Return a JSON object containing an array of the generated test cases. Each case should have a unique key starting from 0 and include the following four properties.`,
		`\t- underspecified_phrase: the underspecified phrase that the test case is intended to highlight as potentially problematic due to its lack of specificity`,
		`\t- interpretation: An interpretation of the underspecified phrase that the test case is generated to illustrate.`,
		`\t- reasoning: A brief explanation describing how the test case could potentially demonstrate a plausible interpretation of the underspecified phrase.`,
		`\t- case: The input test cases, formatted according the input specification.`,
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
		`You are a helpful assistant tasked with evaluating whether a test case clearly illustrates a potential interpretation of an ambiguous phrase in a prompt that guides the behavior of a language model-based bot. The bot receives user input and decides whether to respond based on the trigger described in the prompt. If it does respond, it generates output according to the action described in the prompt. Your task is to assess whether the test case accomplishes its intended purpose, as described in the provided reasoning.`,
		`You will be provided with the following inputs:`,
		`\t- prompt: The full prompt for the bot, including both the trigger and action components.`,
		`\t- underspecified_phrase: a specific quote or snippet from the prompt that is ambiguous`,
		`\t- interpretation: An interpretation of the underspecified phrase that the test case is generated to illustrate.`,
		`\t- reasoning: A brief explanation describing how the test case could potentially demonstrates a plausible interpretation of the underspecified phrase.`,
		`\t- case: The test case, consisting of the user input as defined by the input specification, the specific task triggered for the bot, and the corresponding bot response to that task.`,
		`The test case input must comply with the following input specification:`,
		input_specification,
		`It is possible that the user input does not trigger any task, or that the bot chooses not to respond even if a task is triggered.`,
		`Your Task:`,
		`Assess whether the provided test case effectively fulfills its intended purpose, as described in the provided reasoning.`,
		`Output Format:`,
		`Return a JSON object with the following two properties:`,
		`\t- label: The label is a boolean value: true if the provided test case fulfills its intended purpose, and false if it does not.`,
		`\t- explanation: A brief, 1 to 2 sentence explanation supporting your decision on the label.`
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
					explanation: Schema.string()
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
			explanation: evaluatorResult.explanation,
			prompt: prompt
		};
	});

	await Promise.all(evaluatorPromises);
	const allCases = await Promise.all(evaluatorPromises);

	return allCases;
}
