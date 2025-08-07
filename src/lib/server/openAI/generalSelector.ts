import { bot_capability } from '$lib/sharedPrompts';
import { openAIClient, openAIModel } from '$lib/server/openAI/client';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const SELECT_CASE_NUMBER = 5;

export async function generalSelector(newTasks: Tasks, testCases) {
	const generalSelectorSysPrompt = [
		`You are a helpful assistant tasked with selecting a small set of test cases that will be most useful for prompt designers to refine the prompt and behavior of a language model-based bot deployed within an online community. The prompt defines:`,
		`\t- A trigger: when the bot should take action.`,
		`\t- An action: what the bot should do when triggered.`,
		bot_capability,
		`You will be provided with a list of test cases for the bot. Further details about the contents of each test case are explained below.`,
		`Your Task:`,
		`Select the ${SELECT_CASE_NUMBER} most provocative test cases that highlight potential issues in the associated prompt, which might lead prompt designers or community moderators to reconsider how the prompt could be revised and improved to avoid such issues.`,
		`Follow these steps to make your selection:`,
		`Step 1. Carefully review each test case, paying close attention to the specific type of issue the case is designed to highlight.`,
		`Each test case includes a user message, the channel where the message was sent, any specific task triggered for the bot by the message, and the corresponding bot response. In some cases, the user message may not trigger any task, or the bot may choose not to take any action even when a task is triggered.`,
		`In addition to these details, each test case also includes the bot's prompt that the case is designed to evaluate, as well as one of the following three types of prompt issues it is intended to reveal:`,
		`\t- Underspecified Prompt: The prompt uses vague or open-ended language, which can lead to multiple valid interpretations. This ambiguity results in differing expectations about how the bot should respond.`,
		`\t- Overspecified Prompt: The prompt is overly rigid or too narrowly defined, potentially excluding reasonable cases that the bot should be able to handle.`,
		`\t- Unintended Consequences of the Prompt: The prompt may inadvertently cause negative effects at the community level, such as discouraging participation, undermining commitment, alienating users, or confusing newcomers.`,
		`When considering a test case, make sure it is clearly aligned with the specific type of issue in the prompt that it is intended to reveal.`,
		`Step 2. When making your selection, prioritize the most thought-provoking cases.`,
		`A case is considered provocative if it clearly highlights the identified issue with the prompt and inspires deeper reflection on how the prompt could be improved. Such cases should encourage thoughtful community moderators or prompt designers to pause, reflect, initiate discussions, and ultimately revise the prompt in light of the issues uncovered. In addition to revealing the main problem, provocative cases may also challenge existing assumptions about the prompt's design, highlight unexpected interactions between the user and the bot, or spark debate among community members about the appropriateness of the bot's response. When assessing a case, focus on how thought-provoking it is for prompt revision—rather than on whether the bot’s response is correct, ideal, or even present. In fact, the most provocative cases sometimes expose significant weaknesses in the prompt, even when the bot's reply is minimal or absent.`,
		`Step 3. Select a set of test cases that together provide a comprehensive view of the prompt's issues.`,
		`The complete set of test cases you choose should aim to capture a wide range of issues that might provoke community moderators or prompt designers to revise the prompt. To achieve this, you should avoid redundant cases, such as those that highlight similar issues or consist of similar user messages. Increasing the diversity and minimizing the redundancy of test cases is crucial. However, it is not necessary to ensure an even balance across all types of issues; if a particular issue is especially significant for the prompt, it is acceptable to include more test cases addressing that specific problem.`,
		`Ultimately, the purpose of the test cases is to provide community moderators and prompt designers with the opportunity to think critically, reflect, engage in discussion, and revise the prompt to address any issues illustrated by the test cases.`,
		`Output Format:`,
		`Return a JSON object containing an array of ${SELECT_CASE_NUMBER} selected test cases. Each test case should include the following two properties:`,
		`\t- caseId: The case ID for this test case.`,
		`\t- selection_reason: An explanation of why this case was selected as one of the most provocative test cases.`
	].join('\n');

	const GeneralSelectorOutputSchema = z.object({
		cases: z.array(
			z.object({
				caseId: z.string(),
				selection_reason: z.string()
			})
		)
	});

	const generalSelectorUserPrompt = testCases
		.map(
			(testCase) =>
				`---
Case ID: ${testCase.tmpId}
Channel: ${testCase.channel}
User Message: ${testCase.userMessage}
Triggered Task: ${testCase.triggeredTask === '0' ? 'No task is trigger' : newTasks[testCase.triggeredTask].name}
Bot Response: ${testCase.botResponse}
Prompt Under Test:\n\t- Trigger: ${testCase.prompt.trigger}\n\t- Action: ${testCase.prompt.action}
Identified Issue: ${testCase.issue}
---`
		)
		.join('\n\n');

	const generalSelectorResponse = await openAIClient.responses.parse({
		model: openAIModel,
		input: [
			{ role: 'system', content: generalSelectorSysPrompt },
			{ role: 'user', content: generalSelectorUserPrompt }
		],
		text: {
			format: zodTextFormat(GeneralSelectorOutputSchema, 'generalSelectorResult')
		}
	});

	const generalSelectorResult = generalSelectorResponse.output_parsed;
	if (!generalSelectorResult || !generalSelectorResult.cases) {
		console.log('No cases selected or generalSelectorResult is null.');
		return [];
	}

	// console.log(`========== generalSelectorSysPrompt ==========`);
	// console.log(generalSelectorSysPrompt);

	// console.log(`========== generalSelectorUserPrompt ==========`);
	// console.log(generalSelectorUserPrompt);

	// console.log(generalSelectorResult.cases);

	return generalSelectorResult.cases;
}
