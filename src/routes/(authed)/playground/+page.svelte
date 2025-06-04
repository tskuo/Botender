<script lang="ts">
	// import my components
	import TaskSection from '$lib/components/TaskSection.svelte';

	// import ui components
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';

	// import lucide icons
	import PaintbrushIcon from '@lucide/svelte/icons/paintbrush';
	import UndoIcon from '@lucide/svelte/icons/undo';
	import PlayIcon from '@lucide/svelte/icons/play';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import HashIcon from '@lucide/svelte/icons/hash';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import BotIcon from '@lucide/svelte/icons/bot';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';

	// import form-related things
	import { playgroundCreateCaseSchema, type PlaygroundCreateCaseSchema } from '$lib/schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	// import types
	import type { PageProps } from './$types';

	// data props
	let { data }: PageProps = $props();

	// initialize form
	const form = superForm(data.form, {
		validators: zodClient(playgroundCreateCaseSchema),
		onSubmit() {
			disalbeCreateCaseButton = true;
		},
		onError() {
			disalbeCreateCaseButton = false;
		},
		onUpdated() {
			disalbeCreateCaseButton = true;
			savedCase = true;
		}
	});
	const { form: formData, enhance } = form;

	// initialize states
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
	let selectedChannel = $state('');
	let displayedChannel = $state('');
	let enteredUserMessage = $state('');
	let displayedUserMessage = $state('');
	let displayedBotResponse = $state('');
	let triggeredTask = $state('');
	let running = $state(false);
	let showCase = $state(false);
	let disalbeCreateCaseButton = $state(true);
	let savedCase = $state(false);
</script>

<div class="flex h-screen w-full flex-col">
	<div class="sticky top-0 z-10 bg-white">
		<div class="flex items-center justify-between p-3">
			<h2 class=" text-xl font-bold">Playground</h2>
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
						showCase = false;
					}}
				>
					<PaintbrushIcon class="size-4" />
					Clear
				</Button>
			</div>
		</div>
		<Separator />
	</div>

	<div class="grid flex-1 md:grid-cols-5">
		<div class="border-r p-2 md:col-span-2">
			<ScrollArea class="h-full w-full">
				<h3 class="p-2 font-medium">Scope</h3>
				<div class="px-2">
					<Select.Root type="single" name="playgroundScope" bind:value={scope}>
						<Select.Trigger class="w-full">
							{scopes.find((s) => s.value === scope)?.label ?? 'Select the scope'}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								{#each scopes as s (s.value)}
									<Select.Item value={s.value} label={s.label} />
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>
				<div class="px-2 py-2">
					{#each playgroundTasks as task (task.id)}
						{#if scope === 'overall' || scope === 'triggers' || scope === task.id}
							<div class="pt-4">
								<TaskSection
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
		<div class="p-2 md:col-span-3">
			<div class="flex h-full flex-col justify-between">
				<div>
					{#if showCase}
						<div class="mb-1 flex items-center">
							<HashIcon class="mr-2 size-4" />
							<h3 class="font-semibold">Channel: {displayedChannel}</h3>
						</div>
						<div class="flex items-center">
							<UserRoundIcon class="mr-2 size-4" />
							<h3 class="font-semibold">User Message</h3>
						</div>
						<p class="mb-3 pl-6">{displayedUserMessage}</p>
						{#if running}
							<div class="flex w-full items-center space-x-4">
								<Skeleton class="size-12 rounded-full" />
								<div class="w-full space-y-2">
									<Skeleton class="h-4 w-full" />
									<Skeleton class="h-4 w-full" />
								</div>
							</div>
						{:else}
							<div class="mb-1 flex items-center">
								<WrenchIcon class="mr-2 size-4" />
								<h3 class="font-semibold">Triggered Task:</h3>

								<h3 class="ml-1 font-semibold">
									{playgroundTasks.find((task) => task.id === triggeredTask)?.name ??
										'No Task is Triggered'}
								</h3>
							</div>
							<div class="flex items-center">
								{#if triggeredTask !== '0'}
									<BotIcon class="mr-2 size-4" />
									<h3 class="font-semibold">Bot's Response</h3>
								{/if}
							</div>
							<p class="mb-3 pl-6">{displayedBotResponse}</p>
						{/if}
						<form method="POST" use:enhance action="?/createCase">
							<Form.Field {form} name="channel">
								<Form.Control>
									{#snippet children({ props })}
										<!-- <Form.Label>Channel</Form.Label> -->
										<Input type="hidden" {...props} value={displayedChannel} />
									{/snippet}
								</Form.Control>
								<Form.Description />
								<Form.FieldErrors />
							</Form.Field>
							<Form.Field {form} name="userMessage">
								<Form.Control>
									{#snippet children({ props })}
										<!-- <Form.Label>User Message</Form.Label> -->
										<Input type="hidden" {...props} bind:value={displayedUserMessage} />
									{/snippet}
								</Form.Control>
								<Form.Description />
								<Form.FieldErrors />
							</Form.Field>
							<Form.Field {form} name="triggeredTask">
								<Form.Control>
									{#snippet children({ props })}
										<!-- <Form.Label>Triggered Task</Form.Label> -->
										<Input type="hidden" {...props} bind:value={triggeredTask} />
									{/snippet}
								</Form.Control>
								<Form.Description />
								<Form.FieldErrors />
							</Form.Field>
							<Form.Field {form} name="botResponse">
								<Form.Control>
									{#snippet children({ props })}
										<!-- <Form.Label>Bot Response</Form.Label> -->
										<Input type="hidden" {...props} bind:value={displayedBotResponse} />
									{/snippet}
								</Form.Control>
								<Form.Description />
								<Form.FieldErrors />
							</Form.Field>
							{#if savedCase}
								<Alert.Root>
									<CircleCheckIcon class="size-4" />
									<Alert.Title>Success!</Alert.Title>
									<Alert.Description>This case is saved in the database.</Alert.Description>
								</Alert.Root>
							{:else}
								<Form.Button
									disabled={running || !showCase || disalbeCreateCaseButton || savedCase}
								>
									Save this case
								</Form.Button>
							{/if}
						</form>
					{:else}
						<div></div>
					{/if}
				</div>
				<div class="flex flex-col gap-2">
					<Select.Root type="single" bind:value={selectedChannel}>
						<Select.Trigger class="w-[180px]">
							{selectedChannel === '' ? 'Select a channel' : selectedChannel}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="#introducion" label="#introducion" />
							<Select.Item value="#random" label="#random" />
							<Select.Item value="#faq" label="#faq" />
						</Select.Content>
					</Select.Root>
					<Textarea placeholder="Enter user message ... " bind:value={enteredUserMessage} />
					<Button
						class="w-fit self-end"
						disabled={running || enteredUserMessage.trim() === '' || selectedChannel === ''}
						onclick={async () => {
							running = true;
							showCase = true;
							displayedChannel = selectedChannel;
							displayedUserMessage = enteredUserMessage;
							const response = await fetch('/api/bot', {
								method: 'POST',
								body: JSON.stringify({
									channel: selectedChannel,
									userMessage: enteredUserMessage,
									playgroundTasks: playgroundTasks
								}),
								headers: {
									'Content-Type': 'application/json'
								}
							});

							const { taskId, botResponse } = await response.json();
							triggeredTask = taskId;
							displayedBotResponse = botResponse;
							running = false;
							disalbeCreateCaseButton = false;
							savedCase = false;
							enteredUserMessage = '';
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
