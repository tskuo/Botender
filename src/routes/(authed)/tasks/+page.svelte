<script lang="ts">
	// import ui components
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	// import types
	import type { PageProps } from './$types';

	// data props
	let { data }: PageProps = $props();

	let clickedTaskId = $state('');

	const textLengthCap = 190;
</script>

<div class="flex h-screen w-full flex-col">
	<div class="sticky top-0 z-10 bg-white">
		<h2 class="p-4 text-xl font-bold">Tasks</h2>
		<Separator />
	</div>
	<div class="grid h-full flex-1 md:grid-cols-5">
		<div class="overflow-auto border-r p-4 md:col-span-2">
			<div class="grid auto-rows-fr gap-2">
				{#each Object.entries(data.latestTasks.tasks).sort() as [taskId, _] (taskId)}
					{@const task = data.latestTasks.tasks[taskId]}
					<Card.Root
						class="hover:bg-muted/50 hover:cursor-pointer"
						onclick={() => (clickedTaskId = taskId)}
					>
						<Card.Header>
							<Card.Title><h3>{task.name}</h3></Card.Title>
						</Card.Header>
						<Card.Content>
							<p class="mb-2">
								<span class="font-[GintoDiscordMedium]">Trigger:</span>
								{#if task.trigger.length <= textLengthCap}
									{task.trigger}
								{:else}
									{task.trigger.substring(0, textLengthCap)}...
								{/if}
							</p>
							<p>
								<span class="font-[GintoDiscordMedium]">Action:</span>
								{#if task.action.length <= textLengthCap}
									{task.action}
								{:else}
									{task.action.substring(0, textLengthCap)}...
								{/if}
							</p>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		</div>
		<div class="h-full md:col-span-3">
			{#if clickedTaskId}
				<div class="p-4">
					{#each Object.entries(data.latestTasks.tasks) as [taskId, _] (taskId)}
						{@const task = data.latestTasks.tasks[taskId]}
						{#if taskId === clickedTaskId}
							<h3 class="mb-4 text-lg">Task: {task.name}</h3>
							<div class="mb-4 w-full">
								<h4 class="mb-1">Trigger:</h4>
								<p>{task.trigger}</p>
							</div>
							<div class=" mb-2 w-full">
								<h4 class="mb-1">Action:</h4>
								<p>{task.action}</p>
							</div>
						{/if}
					{/each}
				</div>
			{:else}
				<div class="flex h-full items-center justify-center">
					<p class="text-muted-foreground">Click on a task to see its details.</p>
				</div>
			{/if}
		</div>
	</div>
</div>
