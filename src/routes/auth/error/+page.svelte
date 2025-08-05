<script>
	import { Button } from '$lib/components/ui/button/index.js';
	import { page } from '$app/state';

	const error = page.url.searchParams.get('error');
</script>

<div class="flex min-h-screen items-center justify-center">
	<div class="w-full max-w-md space-y-6 p-6 text-center">
		<h2 class="text-3xl font-bold text-red-600">Authentication Error</h2>
		<p class="text-gray-600">
			{#if error === 'AccessDenied'}
				You denied access to your Discord account.
			{:else if error === 'Configuration'}
				There's a configuration issue with the authentication service.
			{:else}
				An unexpected error occurred during sign-in.
			{/if}
		</p>
		<Button href="/">Try Again</Button>
	</div>
</div>
