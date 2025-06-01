<script lang="ts">
	import PlaygroundTask from '$lib/components/playgroundTask.svelte';
	import type { PageData } from './$types.js';

	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	// import lucide icons
	import PaintbrushIcon from '@lucide/svelte/icons/paintbrush';
	import UndoIcon from '@lucide/svelte/icons/undo';
	import PlayIcon from '@lucide/svelte/icons/play';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import HashIcon from '@lucide/svelte/icons/hash';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import BotIcon from '@lucide/svelte/icons/bot';

	import PlaygroundRunForm from '$lib/components/PlaygroundRunForm.svelte';
	import { playgroundRunFormSchema, type PlaygroundRunFormSchema } from '$lib/schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const form = superForm(data.form, {
		validators: zodClient(playgroundRunFormSchema)
	});

	const { form: formData, enhance } = form;

	let playgroundTasks = $state(data.tasks);

	const scopes = [
		{ value: 'overall', label: 'Overall behaviors' },
		{ value: 'triggers', label: 'Triggers' }
	];
	data.tasks.forEach((task: Task) => {
		scopes.push({ value: task.id, label: 'Task: ' + task.name });
	});
	// scopes.push({ value: 'new', label: 'New task' });

	let scope = $state('overall');
	let channel = $state('');
	let userMessage = $state('');
	let triggeredTask = $state('');
	let reply = $state('');
	let running = $state(false);

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
				<div>
					<div class="flex items-center">
						<HashIcon class="mr-1 size-4" />
						<h3 class="font-semibold">Channel: {channel}</h3>
					</div>
					<div class="flex items-center">
						<UserRoundIcon class="mr-1 size-4" />
						<h3 class="font-semibold">User Message</h3>
					</div>
					<p class="pl-5">{userMessage}</p>
					<div class="flex items-center">
						<WrenchIcon class="mr-1 size-4" />
						<h3 class="font-semibold">
							Triggered Task:
							{playgroundTasks.find((task) => task.id === triggeredTask)?.name ??
								'no task is triggered'}
						</h3>
					</div>
					<div class="flex items-center">
						<BotIcon class="mr-1 size-4" />
						<h3 class="font-semibold">Bot's Response</h3>
					</div>
					<p class="pl-5">{reply}</p>
				</div>
				<!-- <form method="POST" use:enhance>
					<Form.Field {form} name="channel">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Channel</Form.Label>
								<Select.Root type="single" bind:value={$formData.channel} name={props.name}>
									<Select.Trigger {...props}>
										{$formData.channel ? $formData.channel : 'Select a channel'}
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="#introduction" label="#introduction" />
										<Select.Item value="#random" label="#random" />
										<Select.Item value="#faq" label="#faq" />
									</Select.Content>
								</Select.Root>
							{/snippet}
						</Form.Control>
						<Form.Description>Select a channel where the user sends the message to</Form.Description>
						<Form.FieldErrors />
					</Form.Field>
					<Form.Field {form} name="userMessage">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Channel</Form.Label>
								<Input {...props} bind:value={$formData.userMessage} />
							{/snippet}
						</Form.Control>
						<Form.Description>This is user's message.</Form.Description>
						<Form.FieldErrors />
					</Form.Field>
					<Form.Button class="w-fit self-end">
						<PlayIcon class="size-4" />
						Run
					</Form.Button>
				</form> -->
				<div class="flex flex-col gap-2">
					<Select.Root type="single" bind:value={channel}>
						<Select.Trigger class="w-[180px]">
							{channel === '' ? 'Select a channel' : channel}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="#introducion">#introducion</Select.Item>
							<Select.Item value="#random">#random</Select.Item>
							<Select.Item value="#faq">#faq</Select.Item>
						</Select.Content>
					</Select.Root>
					<Textarea placeholder="Enter user message ... " bind:value={userMessage} />
					<Button
						class="w-fit self-end"
						disabled={running}
						onclick={async () => {
							running = true;
							const response = await fetch('/api/bot', {
								method: 'POST',
								body: JSON.stringify({
									channel,
									userMessage,
									playgroundTasks
								}),
								headers: {
									'Content-Type': 'application/json'
								}
							});

							const { taskId, botResponse } = await response.json();
							triggeredTask = taskId;
							reply = botResponse;
							running = false;
						}}
					>
						{#if running}
							<LoaderCircleIcon class="size-4 animate-spin" />
						{:else}
							<PlayIcon class="size-4" />
						{/if}
						Run
					</Button>
				</div>
			</div>
		</div>
	</div>
</div>
