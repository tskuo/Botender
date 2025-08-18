<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="p-8">
	<div class="mb-6 flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
		<img src="/img/botender_logo_round.png" alt="Botender Logo" class="h-24 w-24" />
		<div>
			<h1 class="mb-2 text-3xl font-bold">Select a Discord Server</h1>
			<p class="text-gray-600">Here is a list of servers where you have Botender installed</p>
		</div>
	</div>
	{#if !data.user}
		<div class="py-12 text-center">
			<p>Loading...</p>
		</div>
	{:else if data.user?.guilds && data.user.guilds.length > 0}
		<div class="grid gap-4">
			{#each data.user.guilds as guild}
				<Button href="/guilds/{guild.id}/tasks" variant="outline" class="h-auto justify-start p-6">
					<div>
						<h3 class="font-semibold">{guild.name}</h3>
						<p class="text-sm text-gray-600">Click to manage this server's bot</p>
					</div>
				</Button>
			{/each}
		</div>
	{:else}
		<div class="py-12 text-center">
			<p class="mb-4 text-gray-600">
				You don't have access to any servers with this bot installed.
			</p>
			<p class="text-sm text-gray-500">
				Make sure the bot is invited to your Discord server and you have the necessary permissions.
			</p>
		</div>
	{/if}
</div>
