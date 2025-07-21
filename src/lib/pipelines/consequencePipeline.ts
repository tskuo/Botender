import { bot } from '$lib/bot';
import { bot_capability, input_specification, community_tone } from '$lib/pipelines/prompts';
import { getGenerativeModel, Schema } from 'firebase/ai';
import { ai } from '$lib/firebase';

export async function consequencePipeline(diffTask: Task, newTasks: Tasks) {
	const prompt = diffTask;

	// Detector Module
	const detectorSysPrompt = [
		`You are a helpful assistant tasked with identifying potential unintended consequences in prompts written for language model-based bots deployed within an online community. This prompt defines:`,
		`\t- A trigger: when the bot should take action.`,
		`\t- An action: what the bot should do when triggered.`,
		bot_capability,
		`Rather than focusing on scope or specificity, your task is to surface concerns about the direction, tone, or community-level implications of the prompt. You are not speculating on the intended goal of the prompt beyond what is written. Instead, you are raising concerns that may help the community clarify their own values and intentions before deployment.`,
		`Draw from the following types of potential consequences to guide your analysis. These consequences are especially useful for prompting community reflection, surfacing implicit values, and encouraging more thoughtful moderation design:`,
		`1. Encouraging Contribution`,
		`\t- Obscuring learning and growth: Overemphasis on metrics or bot feedback may crowd out intrinsic motivation like curiosity or self-improvement.`,
		`\t- Undermining commitment or trust: Praise or correction that feels externally imposed may be viewed as insincere or manipulative.`,
		`\t- Enforcing dominant norms uncritically: Bots may amplify popular or conforming behavior, marginalizing alternative forms of value or contribution.`,
		`\t- Eroding the human role in moderation: Automated feedback risks replacing personal recognition with impersonal systems.`,
		`2. Encouraging Commitment`,
		`\t- Undermining normative commitment: Ignoring users' prior contributions or social obligations may reduce motivation to invest further.`,
		`\t- Undermining needs-based commitment: Moderation that neglects personal goals (e.g., learning, fun) may lower perceived value of participation.`,
		`\t- Undermining identity-based commitment: Bots that enforce rules without engaging community identity markers may disrupt belonging and retention.`,
		`3. Regulating Behavior`,
		`\t- Poor norm communication or salience: Norms may be unclear, invisible, or inconsistently enforced, confusing users or encouraging violations.`,
		`\t- Lack of face-saving options: Bots may shame or punish users without allowing dignified recovery or correction.`,
		`\t- Disproportionate or illegitimate sanctions: Responses that feel too harsh or arbitrary may erode trust in moderation.`,
		`\t- Failure to discourage repeat offenders: Flat responses or untracked histories may fail to prevent continued bad behavior.`,
		`\t- Alienating enforcement style: Moderation perceived as punitive rather than supportive may deter participation, especially among newcomers.`,
		`\t- Undermining community legitimacy: Top-down or opaque moderation can diminish perceptions of fairness and community ownership.`,
		`4. Managing Newcomer Integration`,
		`\t- Barriers to entry and access: Strict rules or gatekeeping may discourage participation and reduce diversity.`,
		`\t- Insufficient onboarding or mentoring: Lack of early support may lead to confusion, mistakes, or disengagement.`,
		`\t- Exclusionary or miscommunicated norms: Implicit or poorly explained expectations can result in violations and social punishment.`,
		`\t- Lack of task scaffolding: Abrupt exposure to responsibilities without guidance may overwhelm newcomers.`,
		`\t- Misaligned framing of the community: Bots that communicate norms too formally or informally may mislead or alienate new members.`,
		`Your Task:`,
		`Analyze the prompt and identify any aspects that may lead to the types of unintended consequences listed above, even if the prompt appears well-written or well-intentioned. You are not detecting ambiguities or overspecifications. You are identifying value tensions, social risks, and moderation pitfalls that communities may wish to proactively consider or mitigate.`,
		`Avoid suggesting edits. Your role is to raise the concern, not resolve it.`,
		`Output Format:`,
		`Return a JSON object containing an array of potential unintended consequences that the prompt might have on the community. Each consequence should have a unique key starting from 0 and include the following two properties:`,
		`\t- problematic_phrase: a specific snippet from the prompt that could potentially cause unintended consequences.`,
		`\t- consequence: the possible unintended consequence identified as a result of the potentially problematic phrase.`,
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
					consequences: Schema.array({
						items: Schema.object({
							properties: {
								problematic_phrase: Schema.string(),
								consequence: Schema.string()
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
		`You are a helpful assistant tasked with generating input test cases that explore how specific problematic phrases in a language model-based bot's prompt could unintentionally have a negative impact on the online community where the bot is deployed. These test cases are intended to spark thoughtful discussion and facilitate collective decision-making about the types of bot behavior the community wishes to encourage.`,
		`The prompt of the bot defines:`,
		`\t- A trigger: when the bot should take action.`,
		`\t- An action: what the bot should do when triggered.`,
		bot_capability,
		`You will be provided with:`,
		`\t- prompt: The full prompt for the bot, containing one or more potentially problematic phrases.`,
		`\t- problematic_phrase: a specific snippet from the prompt that could potentially cause unintended consequences.`,
		`\t- consequence: the possible unintended consequence identified as a result of the potentially problematic phrase.`,
		`Your Task:`,
		`For each identified consequence, create a single, credible test case that naturally depicts how this consequence might arise. A test case is an input to the bot that adheres to the following input specification:`,
		input_specification,
		`The test case should stand alone as a compelling, realistic example—distinctly highlighting the tension between the prompt and the community value at risk—without relying on additional explanation to make the consequence clear. Each test case must draw on authentic community dynamics, vary in approach (such as through tone, context, or social interplay), and avoid exaggeration; it should convincingly illustrate how even well-intentioned prompts can inadvertently challenge important values.`,
		`Additionally, the test cases should be realistic and natural, mirroring the typical messages found in the following community and reflecting its unique tone:`,
		community_tone,
		`Return a JSON object with the following two properties:`,
		`\t- reasoning: a brief explanation of how the test case reveals the unintended consequence.`,
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
					reasoning: Schema.string(),
					case: Schema.object({
						properties: {
							channel: Schema.string(),
							userMessage: Schema.string()
						}
					})
				}
			})
		}
	});

	const generatorPromises = detectorResult.consequences.map(
		async (c: { problematic_phrase: string; consequence: string }) => {
			const generatorPrompt = [
				`prompt: \n\t Trigger: ${prompt.trigger}\n\t Action: ${prompt.action}`,
				`problematic_phrase: ${c.problematic_phrase}`,
				`consequence: ${c.consequence}`
			].join('\n');
			const generatorOutput = await generatorModel.generateContent(generatorPrompt);
			const generatorResult = JSON.parse(generatorOutput.response.text());
			return {
				...c,
				reasoning: generatorResult.reasoning,
				case: generatorResult.case
			};
		}
	);

	const generatorResults = await Promise.all(generatorPromises);

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

	const botResponseResults = await Promise.all(botResponsePromises);

	// Evaluator Module
	const evaluatorSysPrompt = [
		`You are a helpful assistant tasked with evaluating test cases that explore how specific problematic phrases in a language model-based bot's prompt could unintentionally have a negative impact on the online community where the bot is deployed.`,
		`You will be provided with the following inputs:`,
		`\t- prompt: The full prompt for the bot, including both the trigger and action components.`,
		`\t- problematic_phrase: a specific snippet from the prompt that could potentially cause unintended consequences.`,
		`\t- consequence: the possible unintended consequence identified as a result of the potentially problematic phrase.`,
		`\t- reasoning: a brief explanation of how the test case reveals the unintended consequence.`,
		`\t- case: The test case, consisting of the user input as defined by the input specification, the specific task triggered for the bot, and the corresponding bot response to that task.`,
		`The test case input must comply with the following input specification:`,
		input_specification,
		`It is possible that the user input does not trigger any task, or that the bot chooses not to respond even if a task is triggered.`,
		`Your Task:`,
		`For each test case, determine whether it clearly illustrates the described consequence and meaningfully shows how it might arise in practice.`,
		`Output Format:`,
		`Return a JSON object with the following two properties:`,
		`\t- label: The label is a boolean value: true if the provided test case fulfills its intended purpose, and false if it does not.`,
		`\t- explanation: A brief, 1 to 2 sentence explanation supporting your decision on the label.`,
		`All values must be JSON-safe: wrap any field that contains commas in quotes, and avoid newlines. Do not include any extra text, formatting, or commentary outside the JSON object.`
	].join('\n');

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
			`problematic_phrase: ${testCase.problematic_phrase}`,
			`consequence: ${testCase.consequence}`,
			`reasoning: ${testCase.reasoning}`,
			`case:`,
			`\t- channel: ${testCase.channel}`,
			`\t- user message: ${testCase.userMessage}`,
			`\t- trigger task: ${testCase.triggeredTask === '0' ? 'No task is trigger' : newTasks[testCase.triggeredTask]}`,
			`\t- bot response: ${testCase.botResponse}`
		].join('\n');
		const evaluatorOutput = await evaluatorModel.generateContent(evaluatorPrompt);
		const evaluatorResult = JSON.parse(evaluatorOutput.response.text());
		return {
			...testCase,
			label: evaluatorResult.label,
			explanation: evaluatorResult.explanation,
			prompt: prompt
		};
	});

	const allCases = await Promise.all(evaluatorPromises);

	return allCases;
}
