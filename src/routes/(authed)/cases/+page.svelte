<script lang="ts">
	// import ui components
	import { Separator } from '$lib/components/ui/separator/index.js';
	import CaseCard from '$lib/components/CaseCard.svelte';
	import type { PageProps } from './$types';

	// data props
	let { data }: PageProps = $props();
</script>

<div class="flex h-screen w-full flex-col">
	<div class="sticky top-0 z-10 bg-white">
		<h2 class="p-4 text-xl font-bold">Cases</h2>
		<Separator />
	</div>

	<div class="grid auto-rows-fr gap-2 p-4 md:grid-cols-2 lg:grid-cols-3">
		{#each data.cases as c (c.id)}
			<CaseCard
				id={c.id}
				channel={c.channel}
				userMessage={c.userMessage}
				triggeredTask={c.triggeredTask}
				botResponse={c.botResponse}
				tasks={data.tasks}
			/>
		{/each}
	</div>
</div>
