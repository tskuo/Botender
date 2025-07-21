import { bot } from '$lib/bot';
import { bot_capability, input_specification, community_tone } from '$lib/pipelines/prompts';
import { getGenerativeModel, Schema } from 'firebase/ai';
import { ai } from '$lib/firebase';
import _ from 'lodash';

export async function overspecifiedPipeline(diffTask: Task, newTasks: Tasks) {
	const prompt = diffTask;

	// Detector Module
	const detectorSysPrompt = [
		`You are a helpful assistant supporting users in improving the coverage and generalizability of prompts given to language model-based bots. Your task is to identify parts of a prompt that are overspecified: phrased too narrowly, rigidly, or in ways that depend on surface-level features. These narrow definitions may cause the bot to miss important situations that still align with the prompt's broader intended goal.`,
		bot_capability,
		`Your Task:`,
		`First, carefully read the provided prompt and determine its broader goal. Specifically, infer the underlying goal of the prompt: what the bot is ultimately intended to detect, prevent, encourage, or support. This goal should capture the spirit of the prompt, rather than being confined to particular wording, formats, or channels.`,
		`Next, using your understanding of the broader goal, identify any overspecified phrase within the prompt that unnecessarily restricts the bot's ability to fulfill this goal. This may include requirements for specific words or formats, limitations to certain channels, users, or contexts, or an overemphasis on particular examples at the expense of generalizable behaviors.`,
		`Finally, for each overspecified phrase, describe types of scenarios that are relevant to the broader goal but are not covered by the current overspecified wording. These scenarios should be ones the bot could reasonably handle within its capabilities.`,
		`Focus on plausible behavioral patterns or scenarios that are likely to arise within the community where the bot is deployed. Here is a description of the community`,
		community_tone,
		`When identifying uncovered scenarios, ensure they fall within the scope of the bot's capabilities. Do not include scenarios that would require expanding the bot's functionality.`,
		`Output Format:`,
		`Return a JSON object containing an array of overspecified phrases. Each phrase should have a unique key starting from 0 and include the following three properties:`,
		`\t- overspecified_phrase: a specific quote or snippet from the prompt that is overly specific.`,
		`\t- broader_goal: the broader goal of the prompt, as you inferred from its content.`,
		`\t- uncovered_scenarios: a description of scenarios that are relevant to the broader goal but are not addressed by the current overspecified phrase.`,
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
					overspecified_phrases: Schema.array({
						items: Schema.object({
							properties: {
								overspecified_phrase: Schema.string(),
								broader_goal: Schema.string(),
								uncovered_scenarios: Schema.string()
							}
						})
					})
				}
			})
		}
	});

	const detectorOutput = await detectorModel.generateContent(
		`Prompt\n\t Trigger: ${prompt.trigger}\n\t Action: ${prompt.action}`
	);

	const detectorResult = JSON.parse(detectorOutput.response.text());

	// Generator Module

	const generatorSysPrompt = [
		`You are a helpful assistant tasked with generating test cases that illustrate how an overspecified phrase in a prompt might overlook reasonable situations that still align with the broader goal of the prompt. The prompt, which includes both a trigger and an action component, guides the behavior of a language model-based bot. Specifically, the bot receives user input, as defined by the input specification, and determines whether to respond based on the trigger described in the prompt. If the bot decides to respond, it generates output according to the action specified in the prompt. Your goal is to create input test cases for the bot that encourage human users to consider whether the scope defined by the overspecified phrase is too limited, and if it should be expanded to cover additional, unaddressed scenarios. In some cases, you may not yet know whether a test case will successfully illustrate a particular uncovered scenario of the overspecified phrase, since you don't know how the bot will actually respond. However, you should aim to create test cases that are likely to prompt the bot to produce the response you intend to illustrate.`,
		`You will be provided with the following inputs:`,
		`\t- prompt: The full prompt for the bot, containing one or more overspecified phrases.`,
		`\t- overspecified_phrase: a specific quote or snippet from the prompt that has been identified as overly specific.`,
		`\t- broader_goal: the broader goal of the prompt.`,
		`\t- uncovered_scenarios: a description of scenarios that are relevant to the broader goal but are not addressed by the current overspecified phrase.`,
		`Your Task:`,
		`For each overspecified phrase, generate a concise set of test cases that illustrate different uncovered scenarios, based on the provided scenarios and the broader goal. Specifically, each case should clearly illustrate a distinct uncovered scenario that aligns with the broader goal but is not addressed by the overspecified phrase. Each case in the set should be unique and avoid repetition. Each case should also be legible on its own and clearly highlight the scenario that the overspecified phrase does not address, even without further explanation. It is crucial that the test case itself makes the limitations of the overspecified phrase apparent.`,
		`Each test case must be a valid input according to the following input specification:`,
		input_specification,
		`Additionally, each case should be realistic and natural, reflecting the tone, slang, punctuation, and style typical of the specific community where the bot is being deployed. Here is a description of the community:`,
		community_tone,
		`Output Format:`,
		`Return a JSON object containing an array of the generated test cases. Each case should have a unique key starting from 0 and include the following four properties.`,
		// `\t- overspecified_phrase: the overspecified phrase that the test case is intended to highlight as potentially problematic due to its limited generalizability.`,
		// `\t- broader_goal: the provided broader goal of the prompt.`,
		`\t- uncovered_scenario: the specific uncovered scenario that the test case is generated to illustrate.`,
		`\t- case: The input test cases, formatted according the input specification.`,
		`\t- reasoning: A brief explanation describing how the generated test case could potentially demonstrate this uncovered scenario of the overspecified phrase.`,
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
								uncovered_scenario: Schema.string(),
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

	const generatorPromises = detectorResult.overspecified_phrases.map(
		async (phraseObj: {
			overspecified_phrase: string;
			broader_goal: string;
			uncovered_scenarios: string;
		}) => {
			const generatorPrompt = [
				`prompt: \n\t Trigger: ${prompt.trigger}\n\t Action: ${prompt.action}`,
				`overspecified_phrase: ${phraseObj.overspecified_phrase}`,
				`broader_goal: ${phraseObj.broader_goal}`,
				`uncovered_scenarios: ${phraseObj.uncovered_scenarios}`
			];
			const generatorOutput = await generatorModel.generateContent(generatorPrompt);
			return {
				..._.omit(phraseObj, ['uncovered_scenarios']),
				...JSON.parse(generatorOutput.response.text())
			};
		}
	);

	const generatorResults = await Promise.all(generatorPromises);

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

	const botResponseResults = await Promise.all(botResponsePromises);

	// Evaluator Module
	const evaluatorSysPrompt = [
		`You are a helpful assistant tasked with evaluating whether a test case clearly illustrates a potential uncovered scenario of an overspecified phrase in a prompt that guides the behavior of a language model-based bot. The bot receives user input and decides whether to respond based on the trigger described in the prompt. If it does respond, it generates output according to the action described in the prompt. Your task is to assess whether the test case accomplishes its intended purpose, as described in the provided reasoning.`,
		`You will be provided with the following inputs:`,
		`\t- prompt: The full prompt for the bot, including both the trigger and action components.`,
		`\t- overspecified_phrase: a specific quote or snippet from the prompt that has been identified as overly specific.`,
		`\t- broader_goal: the broader goal of the prompt.`,
		`\t- uncovered_scenario: the specific uncovered scenario that the test case is generated to illustrate.`,
		`\t- reasoning: A brief explanation describing how the generated test case could potentially demonstrate this uncovered scenario of the overspecified phrase.`,
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
			`overspecified_phrase: ${testCase.overspecified_phrase}`,
			`broader_goal: ${testCase.broader_goal}`,
			`uncovered_scenario: ${testCase.uncovered_scenario}`,
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
