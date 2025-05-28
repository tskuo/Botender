<script lang="ts">
	import PlaygroundTask from '$lib/components/playgroundTask.svelte';

	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	import PaintbrushIcon from '@lucide/svelte/icons/paintbrush';
	import PlayIcon from '@lucide/svelte/icons/play';

	const scopes = [
		{ value: 'overall', label: 'Overall behaviors' },
		{ value: 'triggers', label: 'Triggers' },
		{ value: 'task-1', label: 'Task: Wecome Newcomers' },
		{ value: 'task-2', label: 'Task: Redirect Ads' },
		{ value: 'task-3', label: 'Task: Answer Repeated Questions' },
		{ value: 'task-new', label: 'New task' }
	];

	let scope = $state('overall');

	const triggerContent = $derived(
		scopes.find((s) => s.value === scope)?.label ?? 'Select the scope'
	);
</script>

<div class="flex h-screen w-full flex-col">
	<div class="flex items-center justify-between p-2">
		<h2 class="p-2 font-bold">Playground</h2>
		<Button variant="secondary">
			<PaintbrushIcon class="size-4" />
			Clear
		</Button>
	</div>
	<Separator />
	<div class="grid flex-1 grid-cols-5">
		<div class="col-span-2 border-r p-2">
			<ScrollArea class="h-full w-full">
				<h3 class="p-2">Scope</h3>
				<div class="p-2">
					<Select.Root type="single" name="playgroundScope" bind:value={scope}>
						<Select.Trigger class="w-[180px]">
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
					<div class="pt-4">
						<PlaygroundTask name="Welcome Newcomers" />
					</div>
					<div class="pt-4">
						<PlaygroundTask name="Redirect Ads" />
					</div>
					<div class="pt-4">
						<PlaygroundTask name="Answer Repeated Questions" />
					</div>
				</div>
			</ScrollArea>
		</div>
		<div class="col-span-3 p-2">
			<div class="flex h-full flex-col justify-between">
				<div></div>
				<div class="flex flex-col gap-2">
					<Select.Root type="single">
						<Select.Trigger class="w-[180px]"></Select.Trigger>
						<Select.Content>
							<Select.Item value="light">Light</Select.Item>
							<Select.Item value="dark">Dark</Select.Item>
							<Select.Item value="system">System</Select.Item>
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
