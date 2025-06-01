import { z } from 'zod';

export const playgroundRunFormSchema = z.object({
	channel: z.string(),
	userMessage: z.string()
});

export type PlaygroundRunFormSchema = typeof playgroundRunFormSchema;
