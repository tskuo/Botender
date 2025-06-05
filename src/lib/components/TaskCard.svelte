<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';

	let { id = '', action = '', createAt = new Date(), name = '', trigger = '' } = $props();

	const textLengthCap = 190;
</script>

<Card.Root>
	<Card.Header>
		<Card.Title><h3>{name}</h3></Card.Title>
		<!-- <Card.Description>Card Description</Card.Description> -->
	</Card.Header>
	<Card.Content>
		<p class="mb-2">
			<span class="font-[GintoDiscordMedium]">Trigger:</span>
			{#if trigger.length <= textLengthCap}
				{trigger}
			{:else}
				{trigger.substring(0, textLengthCap)}...
			{/if}
		</p>
		<p>
			<span class="font-[GintoDiscordMedium]">Action:</span>
			{#if action.length <= textLengthCap}
				{action}
			{:else}
				{action.substring(0, textLengthCap)}...
			{/if}
		</p>
	</Card.Content>
	<Card.Footer class="mt-auto">
		<p>X proposals</p>
	</Card.Footer>
</Card.Root>
