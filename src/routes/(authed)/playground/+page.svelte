<script lang="ts">
	import PlaygroundTask from '$lib/components/playgroundTask.svelte';

	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	import PaintbrushIcon from '@lucide/svelte/icons/paintbrush';
	import UndoIcon from '@lucide/svelte/icons/undo';
	import PlayIcon from '@lucide/svelte/icons/play';

	let { data } = $props();
	let playgroundTasks = $state(data.tasks);

	const scopes = [
		{ value: 'overall', label: 'Overall behaviors' },
		{ value: 'triggers', label: 'Triggers' }
	];
	playgroundTasks.forEach((task: Task) => {
		scopes.push({ value: task.id, label: 'Task: ' + task.name });
	});
	// scopes.push({ value: 'new', label: 'New task' });

	let scope = $state('overall');

	const triggerContent = $derived(
		scopes.find((s) => s.value === scope)?.label ?? 'Select the scope'
	);
</script>

<div class="flex h-screen w-full flex-col">
	<div class="flex items-center justify-between p-2">
		<h2 class="p-2 font-bold">Playground</h2>
		<div class="flex gap-2">
			<Button
				variant="secondary"
				onclick={() => {
					playgroundTasks = data.tasks;
				}}
			>
				<UndoIcon class="size-4" />
				Reset
			</Button>
			<Button
				variant="secondary"
				onclick={() => {
					console.log($state.snapshot(playgroundTasks));
				}}
			>
				<PaintbrushIcon class="size-4" />
				Clear
			</Button>
		</div>
	</div>
	<Separator />
	<div class="grid flex-1 grid-cols-5">
		<div class="col-span-2 border-r p-2">
			<ScrollArea class="h-full w-full">
				<h3 class="p-2">Scope</h3>
				<div class="p-2">
					<Select.Root type="single" name="playgroundScope" bind:value={scope}>
						<Select.Trigger class="w-full">
							{triggerContent}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								{#each scopes as s (s.value)}
									<Select.Item value={s.value} label={s.label}>
										{s.label}
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>
				<div class="p-2">
					{#each playgroundTasks as task (task.id)}
						{#if scope === 'overall' || scope === 'triggers' || scope === task.id}
							<div class="pt-4">
								<PlaygroundTask
									bind:name={task.name}
									bind:trigger={task.trigger}
									bind:action={task.action}
									triggersOnly={scope === 'triggers'}
								/>
							</div>
						{/if}
					{/each}
				</div>
			</ScrollArea>
		</div>
		<div class="col-span-3 p-2">
			<div class="flex h-full flex-col justify-between">
				<div></div>
				<div class="flex flex-col gap-2">
					<Select.Root type="single">
						<Select.Trigger class="w-[180px]">Select a channel</Select.Trigger>
						<Select.Content>
							<Select.Item value="introducion">#introducion</Select.Item>
							<Select.Item value="random">#random</Select.Item>
							<Select.Item value="faq">#faq</Select.Item>
						</Select.Content>
					</Select.Root>
					<Textarea placeholder="Enter user message ... " />
					<Button class="w-fit self-end">
						<PlayIcon class="size-4" />
						Run
					</Button>
				</div>
			</div>
		</div>
	</div>
</div>
