<script>
	import { signIn } from '@auth/sveltekit/client';
	import { Button } from '$lib/components/ui/button/index.js';
	import { page } from '$app/state';

	const callbackUrl = page.url.searchParams.get('callbackUrl') || '/guilds';
</script>

<div class="flex min-h-screen items-center justify-center">
	<div class="w-full max-w-md space-y-6 p-6">
		<div class="text-center">
			<img
				src="/img/botender_logo_round.png"
				alt="Botender Logo"
				class="mx-auto mb-6 h-3/4 w-3/4"
			/>
			<h2 class="text-3xl font-bold">Sign in to Botender</h2>
			<p class="mt-2 text-gray-600">
				You need to sign in with Discord to access your server's bot settings.
			</p>
		</div>

		<Button class="w-full cursor-pointer" onclick={() => signIn('discord', { callbackUrl })}>
			Sign in with Discord
		</Button>
	</div>
</div>
