import { z } from 'zod';

export const playgroundRunFormSchema = z.object({
	channel: z.string(),
	userMessage: z.string()
});

export const createCaseSchema = z.object({
	botResponse: z.string(),
	channel: z.string(),
	realUserMessage: z.boolean(),
	taskHistoryId: z.string(),
	triggeredTaskId: z.string(),
	userMessage: z.string(),
	source: z.string(),
	proposalEditId: z.string(),
	proposalId: z.string()
});

export const playgroundCreateProposalSchema = z.object({
	description: z.string().trim().min(1),
	taskHistoryId: z.string(),
	testCases: z.string().array(),
	title: z.string().trim().min(1).max(50),
	// the following fields are used for case creation
	botResponse: z.string(),
	channel: z.string(),
	realUserMessage: z.boolean(),
	triggeredTaskId: z.string(),
	userMessage: z.string(),
	source: z.string(),
	proposalEditId: z.string(),
	proposalId: z.string()
});

export const proposalsCreateProposalSchema = z.object({
	description: z.string().trim().min(1),
	title: z.string().trim().min(1).max(50)
});

export type PlaygroundRunFormSchema = typeof playgroundRunFormSchema;
export type CreateCaseSchema = typeof createCaseSchema;
export type PlaygroundCreateProposalSchema = typeof playgroundCreateProposalSchema;
export type ProposalsCreateProposalSchema = typeof proposalsCreateProposalSchema;
