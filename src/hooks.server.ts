import { type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Stage 1

	// Hide Chrome dev tool error message. See: https://github.com/sveltejs/kit/issues/13743
	if (event.url.pathname.startsWith('/.well-known/appspecific/com.chrome.devtools')) {
		// Return empty response with 204 No Content
		return new Response(null, { status: 204 });
	}

	// Stage 2
	const response = await resolve(event);

	// Stage 3
	return response;
};
