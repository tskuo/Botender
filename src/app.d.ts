// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { DefaultSession } from '@auth/core/types';

type User = {
	userId: string;
	userName: string;
};

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: {
				userId: string;
				userName: string;
				guilds?: { id: string; name: string }[];
				accessToken?: string;
			};
			getSession?: () => Promise<any>;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	type Task = {
		action: string;
		name: string;
		trigger: string;
	};

	type Tasks = {
		[key: string]: Task;
	};

	type EditedTask = {
		action: string;
		name: string;
		trigger: string;
	};

	type Case = {
		id: string;
		channel: string;
		createAt: Date;
		realUserMessage: boolean;
		userMessage: string;
	};

	type BotResponse = {
		id: string;
		botResponse: string;
		createAt: Date;
		proposalEditId: string;
		proposalId: string;
		taskHistoryId: string;
		thumbsDown: string[];
		thumbsUp: string[];
		triggeredTask: string;
	};

	type Proposal = {
		id: string;
		createAt: Date;
		description: string;
		discussionSummary: string;
		initiator: string;
		open: boolean;
		taskHistoryId: string;
		testCases: string[];
		title: string;
	};
}

declare module '@auth/core/types' {
	interface Session {
		user: {
			guilds?: { id: string; name: string }[];
			accessToken?: string;
		} & DefaultSession['user'];
	}
}

export {};
