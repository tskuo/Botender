<script lang="ts">
	// import my components
	import TaskCard from '$lib/components/TaskCard.svelte';

	// import ui components
	import { Separator } from '$lib/components/ui/separator/index.js';

	// import types
	import type { PageProps } from './$types';

	// data props
	let { data }: PageProps = $props();
</script>

<div class="flex h-screen w-full flex-col">
	<div class="sticky top-0 z-10 bg-white">
		<h2 class="p-4 text-xl font-bold">Tasks</h2>
		<Separator />
	</div>
	<div class="grid md:grid-cols-5">
		<div class="grid auto-rows-fr gap-2 border-r p-4 md:col-span-2">
			{#each data.tasks as task (task.id)}
				<TaskCard
					id={task.id}
					action={task.action}
					createAt={task.createAt}
					name={task.name}
					trigger={task.trigger}
				/>
			{/each}
		</div>
		<div class="h-full md:col-span-3"></div>
	</div>
</div>
