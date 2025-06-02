<script lang="ts">
	// import ui components
	import { Separator } from '$lib/components/ui/separator/index.js';
	import CaseCard from '$lib/components/CaseCard.svelte';
	import type { PageProps } from './$types';

	// data props
	let { data }: PageProps = $props();
</script>

<div class="flex h-screen w-full flex-col">
	<div class="p-2">
		<h2 class="p-2 text-xl font-bold">Cases</h2>
	</div>
	<Separator />
	<div class="grid auto-rows-fr gap-2 p-4 md:grid-cols-2 lg:grid-cols-3">
		{#each data.cases as c (c.id)}
			<CaseCard
				channel={c.channel}
				userMessage={c.userMessage}
				triggeredTask={c.triggeredTask}
				botResponse={c.botResponse}
				tasks={data.tasks}
			/>
		{/each}
	</div>
</div>
