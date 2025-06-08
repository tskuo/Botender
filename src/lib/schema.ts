import { z } from 'zod';

export const playgroundRunFormSchema = z.object({
	channel: z.string(),
	userMessage: z.string()
});

export const playgroundCreateCaseSchema = z.object({
	botResponse: z.string(),
	channel: z.string(),
	realUserMessage: z.boolean(),
	taskHistoryId: z.string(),
	triggeredTaskId: z.string(),
	userMessage: z.string(),
	source: z.string()
});

export type PlaygroundRunFormSchema = typeof playgroundRunFormSchema;
export type PlaygroundCreateCaseSchema = typeof playgroundCreateCaseSchema;
