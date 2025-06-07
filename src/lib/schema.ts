import { z } from 'zod';

export const playgroundRunFormSchema = z.object({
	channel: z.string(),
	userMessage: z.string()
});

export const playgroundCreateCaseSchema = z.object({
	channel: z.string(),
	userMessage: z.string(),
	triggeredTaskId: z.string(),
	botResponse: z.string()
});

export type PlaygroundRunFormSchema = typeof playgroundRunFormSchema;
export type PlaygroundCreateCaseSchema = typeof playgroundCreateCaseSchema;
