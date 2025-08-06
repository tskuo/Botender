// import { type Handle } from '@sveltejs/kit';

// export const handle: Handle = async ({ event, resolve }) => {
// 	// Stage 1

// 	// Hide Chrome dev tool error message. See: https://github.com/sveltejs/kit/issues/13743
// 	if (event.url.pathname.startsWith('/.well-known/appspecific/com.chrome.devtools')) {
// 		// Return empty response with 204 No Content
// 		return new Response(null, { status: 204 });
// 	}

// 	event.locals.user = {
// 		userId: 'sophialiu',
// 		userName: 'Sophia'
// 	};

// 	// Stage 2
// 	const response = await resolve(event);

// 	// Stage 3
// 	return response;
// };

// Replace your entire existing hooks.server.ts file with this:
import { type Handle } from '@sveltejs/kit';
import { handle as authHandle } from './lib/server/auth';
import { sequence } from '@sveltejs/kit/hooks';

const customHandle: Handle = async ({ event, resolve }) => {
	// Hide Chrome dev tool error message
	if (event.url.pathname.startsWith('/.well-known/appspecific/com.chrome.devtools')) {
		return new Response(null, { status: 204 });
	}

	// Get session from Auth.js
	const session = await event.locals.auth();

	if (session?.user) {
		event.locals.user = {
			userId: session.user.id!,
			userName: session.user.name!,
			userImage: session.user.image!,
			guilds: session.user.guilds || [],
			accessToken: session.user.accessToken
		};
	}

	return resolve(event);
};

export const handle = sequence(authHandle, customHandle);
