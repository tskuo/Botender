// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

type User = {
	userId: string;
	userName: string;
};

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: User;
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
		createAt: date;
		realUserMessage: boolean;
		userMessage: string;
	};

	type BotResponse = {
		id: string;
		botResponse: string;
		createAt: date;
		proposalEditId: string;
		proposalId: string;
		taskHistoryId: string;
		thumbsDown: string[];
		thumbsUp: string[];
		triggeredTask: string;
	};

	type Proposal = {
		id: string;
		createAt: date;
		description: string;
		discussionSummary: string;
		initiator: string;
		open: boolean;
		taskHistoryId: string;
		testCases: string[];
		title: string;
	};
}

export {};
