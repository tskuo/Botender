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
			user: User | null;
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

	type EditedTask = {
		action: string;
		name: string;
		trigger: string;
	};

	type Case = {
		id: string;
		botResponse: string;
		channel: string;
		createAt: date;
		realUserMessage: boolean;
		triggeredTask: string;
		userMessage: string;
	};
}

export {};
