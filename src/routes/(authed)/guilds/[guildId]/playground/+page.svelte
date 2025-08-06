<script lang="ts">
	// import lodash for object comparison
	import _ from 'lodash';

	// import my components
	import TaskSection from '$lib/components/TaskSection.svelte';
	import TaskDiffSection from '$lib/components/TaskDiffSection.svelte';

	// import my functions
	import {
		isTaskMissingField,
		isTaskEmpty,
		trimTaskCustomizer,
		trimWhiteSpaceInTasks
	} from '$lib/tasks';

	// import ui components
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	// import lucide icons
	import UndoIcon from '@lucide/svelte/icons/undo';
	import BotMessageSquareIcon from '@lucide/svelte/icons/bot-message-square';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import HashIcon from '@lucide/svelte/icons/hash';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import BotIcon from '@lucide/svelte/icons/bot';
	import BotOffIcon from '@lucide/svelte/icons/bot-off';
	import LightbulbIcon from '@lucide/svelte/icons/lightbulb';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import DiffIcon from '@lucide/svelte/icons/diff';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import UserIcon from '@lucide/svelte/icons/user';
	import InfoIcon from '@lucide/svelte/icons/info';

	// import form-related things
	import { createCaseSchema, playgroundCreateProposalSchema } from '$lib/schema';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	// import types
	import type { PageProps } from './$types';

	// data props
	let { data }: PageProps = $props();

	// initialize create case form
	// let disableCreateCaseButton = $state(true);
	// const form = superForm(data.form, {
	// 	validators: zodClient(createCaseSchema),
	// 	onSubmit() {
	// 		disableCreateCaseButton = true;
	// 	},
	// 	onError() {
	// 		disableCreateCaseButton = false;
	// 	},
	// 	onUpdated() {
	// 		disableCreateCaseButton = true;
	// 		savedCase = true;
	// 	}
	// });
	// const { form: formData, enhance } = form;

	// initialize create proposal form
	let disableCreateProposalBtn = $state(true);
	const formProposal = superForm(data.formProposal, {
		validators: zodClient(playgroundCreateProposalSchema),
		onSubmit({ formData }) {
			disableCreateProposalBtn = true;
			if (isTaskChanged && !_.isNil(testedTasks))
				formData.set('editedTasks', JSON.stringify(testedTasks));
		},
		onError() {
			disableCreateProposalBtn = false;
		},
		onUpdated() {
			disableCreateProposalBtn = false;
		}
	});
	const { form: formDataProposal, enhance: enhanceProposal } = formProposal;

	// initialize states
	let playgroundTasks = $state<Tasks>(data.latestTasks.tasks);
	let testedTasks = $state<Tasks | undefined>(undefined);
	let isTaskChanged = $derived(
		!_.isEqualWith(
			'new' in playgroundTasks && isTaskEmpty(playgroundTasks['new'])
				? _.omit(playgroundTasks, ['new'])
				: playgroundTasks,
			data.latestTasks.tasks,
			trimTaskCustomizer
		)
	);
	let canReset = $derived(
		isTaskChanged || ('new' in playgroundTasks && isTaskEmpty(playgroundTasks['new']))
	);
	let isTaskTested = $derived(
		_.isEqualWith(
			'new' in playgroundTasks && isTaskEmpty(playgroundTasks['new'])
				? _.omit(playgroundTasks, ['new'])
				: playgroundTasks,
			testedTasks,
			trimTaskCustomizer
		)
	);

	// Get the tasks that have missing fields
	let tasksWithMissingFields = $derived(
		Object.entries(playgroundTasks)
			.filter(([taskId, task]) => !isTaskEmpty(task) && isTaskMissingField(task))
			.map(([taskId, task]) => taskId)
			.sort((a, b) => {
				// Keep 'new' at the end
				if (a === 'new') return 1;
				if (b === 'new') return -1;
				// Sort other taskIds alphabetically
				return a.localeCompare(b);
			})
	);
	let hasTaskMissingField = $derived(tasksWithMissingFields.length > 0);

	let scope = $state('overall');
	let selectedChannel = $state('');
	let displayedChannel = $state('');
	let enteredUserMessage = $state('');
	let displayedUserMessage = $state('');
	let displayedBotResponse = $state('');
	let triggeredTaskId = $state('');
	let running = $state(false);
	let showCase = $state(false);
	// let savedCase = $state(false);

	let scopes = $derived([
		{ value: 'overall', label: 'All Tasks' },
		// { value: 'triggers', label: 'Triggers' },
		...[
			...Object.keys(_.pickBy(data.latestTasks.tasks, (task) => !isTaskEmpty(task))).sort(),
			...('new' in playgroundTasks ? ['new'] : [])
		].map((taskId) => {
			let label;
			if (taskId === 'new') {
				if (playgroundTasks[taskId].name.trim() === '') {
					label = 'New Task: (no task name entered)';
				} else {
					label = `New Task: ${playgroundTasks[taskId].name.trim()}`;
				}
			} else {
				if (isTaskEmpty(playgroundTasks[taskId])) {
					label = `Task: ${data.latestTasks.tasks[taskId].name} (deleted)`;
				} else if (playgroundTasks[taskId].name.trim() === '') {
					label = 'Task: (no task name entered)';
				} else {
					label = `Task: ${playgroundTasks[taskId].name.trim()}`;
				}
			}
			return { value: taskId, label };
		})
	]);
</script>

<div class="flex h-screen w-full flex-col">
	<div class="sticky top-0 z-10 bg-white">
		<div class="flex items-center p-4">
			<Sidebar.Trigger class="mr-2 md:hidden" />
			<h2 class="text-xl font-bold">Playground</h2>
		</div>
		<Separator />
	</div>
	<div class="grid flex-1 overflow-hidden md:grid-cols-5">
		<div class="overflow-y-auto border-r md:col-span-2">
			<div class="p-4">
				<div class="flex items-center justify-between">
					<h4 class="font-medium">Bot Instructions</h4>
					<div>
						<Button
							class="hover:cursor-pointer"
							variant="secondary"
							disabled={!canReset}
							onclick={() => {
								playgroundTasks = data.latestTasks.tasks;
							}}
						>
							<UndoIcon class="size-4" />
							Reset All
						</Button>
						<Dialog.Root>
							<Dialog.Trigger
								class={`${buttonVariants({ variant: 'secondary' })} hover:cursor-pointer`}
								disabled={!isTaskChanged}
							>
								<DiffIcon />
								Diff
							</Dialog.Trigger>
							<Dialog.Content class="flex max-h-[80vh] flex-col">
								<Dialog.Header class="text-left">
									<Dialog.Title><h2>Compare the differences</h2></Dialog.Title>
									<Dialog.Description>
										The highlighted and strikethrough text indicates the edits you made to the
										current bot instructions.
									</Dialog.Description>
								</Dialog.Header>
								<div class="min-h-0 flex-1 overflow-y-auto text-sm">
									<div class="flex flex-col gap-6">
										{#each Object.keys(data.latestTasks.tasks).sort() as taskId (taskId)}
											{#if !isTaskEmpty(data.latestTasks.tasks[taskId])}
												<TaskDiffSection
													oldTask={data.latestTasks.tasks[taskId]}
													newTask={playgroundTasks[taskId]}
												/>
											{/if}
										{/each}
										{#if 'new' in playgroundTasks}
											{#if !isTaskEmpty(playgroundTasks['new'])}
												<TaskDiffSection newTask={playgroundTasks['new']} />
											{/if}
										{/if}
									</div>
								</div>
							</Dialog.Content>
						</Dialog.Root>
					</div>
				</div>
				<div class="pt-2">
					<Select.Root type="single" name="playgroundScope" bind:value={scope}>
						<Select.Trigger class="w-full">
							{scopes.find((s) => s.value === scope)?.label ?? 'Select a task'}
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
				<div class="flex flex-col gap-10 pt-4">
					{#each [...Object.keys(data.latestTasks.tasks).sort(), ...('new' in playgroundTasks ? ['new'] : [])] as taskId (taskId)}
						{#if scope === 'overall' || scope === 'triggers' || scope === taskId}
							{#if taskId === 'new' || (taskId in data.latestTasks.tasks && !isTaskEmpty(data.latestTasks.tasks[taskId]))}
								<TaskSection
									id={taskId}
									bind:name={playgroundTasks[taskId].name}
									bind:trigger={playgroundTasks[taskId].trigger}
									bind:action={playgroundTasks[taskId].action}
									triggersOnly={scope === 'triggers'}
								/>
							{/if}
						{/if}
					{/each}
				</div>
				<Button
					class="mt-4 w-full hover:cursor-pointer"
					variant="secondary"
					size="sm"
					hidden={'new' in playgroundTasks || scope !== 'overall'}
					disabled={'new' in playgroundTasks}
					onclick={() => {
						playgroundTasks['new'] = {
							name: '',
							trigger: '',
							action: ''
						};
					}}
				>
					<PlusIcon class="size-4" />New Task
				</Button>
				<div class="flex items-center gap-2 pt-2"></div>
			</div>
		</div>
		<div class="flex h-full flex-col md:col-span-3">
			<div class="min-h-0 flex-1 overflow-y-auto p-4">
				{#if isTaskChanged}
					<Alert.Root class="border-primary text-primary mb-2">
						<PencilIcon />
						<Alert.Title><h4>Heads up! Your edit is not saved yet.</h4></Alert.Title>
						<Alert.Description class="text-primary">
							The bot will now respond based on the edits you've made in this playground, which may
							differ from its current behavior in your Discord server. To see the bot's new
							behavior, enter a user message here. If you're satisfied, you can then create a
							proposal to update the bot in your server with these changes.
						</Alert.Description>
					</Alert.Root>
				{/if}
				{#if hasTaskMissingField}
					<Alert.Root class="border-my-pink text-my-pink mb-2">
						<TriangleAlertIcon />
						<Alert.Description class="text-my-pink">
							<h4>Task fields must not be left empty.</h4>
							<ul class="list-inside list-disc text-sm">
								{#each tasksWithMissingFields as taskId (taskId)}
									{#if taskId === 'new'}
										<li>
											New Task: {playgroundTasks[taskId].name.trim() === ''
												? '(no task name entered)'
												: playgroundTasks[taskId].name}
										</li>
									{:else}
										<li>
											Task: {playgroundTasks[taskId].name.trim() === ''
												? '(no task name entered)'
												: playgroundTasks[taskId].name}
										</li>
									{/if}
								{/each}
							</ul>
						</Alert.Description>
					</Alert.Root>
				{/if}
				{#if showCase}
					{#if displayedBotResponse === '' && triggeredTaskId !== '0' && !running}
						<Alert.Root class="mb-2">
							<InfoIcon />
							<Alert.Title><h4>Tips: The bot chose not to respond.</h4></Alert.Title>
							<Alert.Description>
								This situation happens when the bot reviews all task triggers and identifies one
								task as especially relevant to the user's message in the selected channel. However,
								after considering the action associated with that task, the bot still decides that
								the best response is no response at all. If you feel that the bot is triggering the
								wrong task, or that the correct task is triggered but its action is not what you
								expect, you can create a new proposal to improve either the trigger or the action as
								appropriate.
							</Alert.Description>
						</Alert.Root>
					{/if}
					{#if displayedBotResponse === '' && triggeredTaskId === '0' && !running}
						<Alert.Root class="mb-2">
							<InfoIcon />
							<Alert.Title><h4>Tips: No task is triggered.</h4></Alert.Title>
							<Alert.Description>
								This situation happens when the bot reviews all task triggers and finds that none
								apply to the user's message in the selected channel. If you think a particular task
								should have been triggered, you can create a new proposal to improve its trigger.
							</Alert.Description>
						</Alert.Root>
					{/if}
					<div class="mb-2 flex items-center">
						<HashIcon class="mr-2 size-4" />
						<h4 class="font-medium">
							{displayedChannel.startsWith('#') ? displayedChannel.slice(1) : displayedChannel}
						</h4>
					</div>
					<div class="mb-4 flex">
						<UserIcon class="mt-1 mr-2 size-4 flex-none" />
						<p>{displayedUserMessage}</p>
					</div>
					{#if running}
						<div class="mb-2 flex items-center">
							<LoaderIcon class="mr-2 size-4 animate-spin" />
							<p>Loading bot response...</p>
						</div>
					{:else}
						<div class="mb-2 flex w-full items-center">
							<WrenchIcon class="mr-2 size-4" />
							<h4 class="font-medium">
								{triggeredTaskId in playgroundTasks
									? playgroundTasks[triggeredTaskId].name
									: 'No Task is Triggered'}
							</h4>
						</div>
						<div class="flex w-full">
							{#if displayedBotResponse !== ''}
								<BotIcon class="mt-1 mr-2 size-4 flex-none" />
								<p>{displayedBotResponse}</p>
							{:else if displayedBotResponse === '' && triggeredTaskId !== '0'}
								<BotOffIcon class="mt-1 mr-2 size-4 flex-none" />
								<p>The bot chose not to respond.</p>
							{/if}
						</div>
						<div class="mt-4 flex items-center gap-2">
							<!-- <form method="POST" use:enhance action="?/createCase" class="hidden">
									<Form.Field {form} name="channel">
										<Form.Control>
											{#snippet children({ props })}
												<Input type="hidden" {...props} value={displayedChannel} />
											{/snippet}
										</Form.Control>
										<Form.Description />
										<Form.FieldErrors />
									</Form.Field>
									<Form.Field {form} name="userMessage">
										<Form.Control>
											{#snippet children({ props })}
												<Input type="hidden" {...props} value={displayedUserMessage} />
											{/snippet}
										</Form.Control>
										<Form.Description />
										<Form.FieldErrors />
									</Form.Field>
									<Form.Field {form} name="realUserMessage">
										<Form.Control>
											{#snippet children({ props })}
												<Checkbox class="hidden" {...props} checked={false} />
											{/snippet}
										</Form.Control>
										<Form.Description />
										<Form.FieldErrors />
									</Form.Field>
									<Form.Field {form} name="taskHistoryId">
										<Form.Control>
											{#snippet children({ props })}
												<Input type="hidden" {...props} value={data.latestTasks.id} />
											{/snippet}
										</Form.Control>
										<Form.Description />
										<Form.FieldErrors />
									</Form.Field>
									<Form.Field {form} name="triggeredTaskId">
										<Form.Control>
											{#snippet children({ props })}
												<Input type="hidden" {...props} value={triggeredTaskId} />
											{/snippet}
										</Form.Control>
										<Form.Description />
										<Form.FieldErrors />
									</Form.Field>
									<Form.Field {form} name="botResponse">
										<Form.Control>
											{#snippet children({ props })}
												<Input type="hidden" {...props} value={displayedBotResponse} />
											{/snippet}
										</Form.Control>
										<Form.Description />
										<Form.FieldErrors />
									</Form.Field>
									<Form.Field {form} name="source">
										<Form.Control>
											{#snippet children({ props })}
												<Input type="hidden" {...props} value="playground" />
											{/snippet}
										</Form.Control>
										<Form.Description />
										<Form.FieldErrors />
									</Form.Field>
									<Form.Field {form} name="proposalEditId">
										<Form.Control>
											{#snippet children({ props })}
												<Input type="hidden" {...props} value="" />
											{/snippet}
										</Form.Control>
										<Form.Description />
										<Form.FieldErrors />
									</Form.Field>
									<Form.Field {form} name="proposalId">
										<Form.Control>
											{#snippet children({ props })}
												<Input type="hidden" {...props} value="" />
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
											disabled={running || !showCase || disableCreateCaseButton || savedCase}
											class="mb-2"
										>
											Save this case
										</Form.Button>
									{/if}
								</form> -->
							<Dialog.Root>
								<Dialog.Trigger
									class={`${buttonVariants({ variant: 'default' })} hover:cursor-pointer`}
									disabled={!isTaskTested}
								>
									<LightbulbIcon class="size-4" />
									New Proposal
								</Dialog.Trigger>
								<Dialog.Content class="flex max-h-[80vh] flex-col">
									<Dialog.Header>
										<Dialog.Title><h2>Initiate a new proposal</h2></Dialog.Title>
										<Dialog.Description class="text-foreground text-sm md:text-base">
											{#if isTaskChanged}
												Describe why you are proposing this edit to the bot. For example, you might
												want to address an issue you've noticed or suggest new edits to improve its
												functionality.
											{:else}
												Describe the issue you've observed with the current bot's behavior, and
												explain how you would like it to be improved.
											{/if}
										</Dialog.Description>
									</Dialog.Header>
									<div class="min-h-0 flex-1 overflow-y-auto p-1">
										<h3 class="mb-1">Initiator</h3>
										<Input disabled class="mb-3 w-full" value={data.user?.userName} />
										<form method="POST" use:enhanceProposal action="?/createProposal">
											<Form.Field form={formProposal} name="title">
												<Form.Control>
													{#snippet children({ props })}
														<Form.Label><h3>Proposal Title</h3></Form.Label>
														<Input {...props} bind:value={$formDataProposal.title} />
													{/snippet}
												</Form.Control>
												<Form.Description></Form.Description>
												<Form.FieldErrors />
											</Form.Field>
											<Form.Field form={formProposal} name="description" class="mt-4">
												<Form.Control>
													{#snippet children({ props })}
														<Form.Label><h3>Description</h3></Form.Label>
														<Textarea {...props} bind:value={$formDataProposal.description} />
													{/snippet}
												</Form.Control>
												<Form.Description />
												<Form.FieldErrors />
											</Form.Field>
											<Form.Field form={formProposal} name="taskHistoryId">
												<Form.Control>
													{#snippet children({ props })}
														<Input type="hidden" {...props} value={data.latestTasks.id} />
													{/snippet}
												</Form.Control>
												<Form.Description />
												<Form.FieldErrors />
											</Form.Field>
											<!-- Form Field for Create Case -->
											<Form.Field form={formProposal} name="channel">
												<Form.Control>
													{#snippet children({ props })}
														<Input type="hidden" {...props} value={displayedChannel} />
													{/snippet}
												</Form.Control>
												<Form.Description />
												<Form.FieldErrors />
											</Form.Field>
											<Form.Field form={formProposal} name="userMessage">
												<Form.Control>
													{#snippet children({ props })}
														<Input type="hidden" {...props} value={displayedUserMessage} />
													{/snippet}
												</Form.Control>
												<Form.Description />
												<Form.FieldErrors />
											</Form.Field>
											<Form.Field form={formProposal} name="realUserMessage">
												<Form.Control>
													{#snippet children({ props })}
														<Checkbox class="hidden" {...props} checked={false} />
													{/snippet}
												</Form.Control>
												<Form.Description />
												<Form.FieldErrors />
											</Form.Field>
											<Form.Field form={formProposal} name="triggeredTaskId">
												<Form.Control>
													{#snippet children({ props })}
														<Input type="hidden" {...props} value={triggeredTaskId} />
													{/snippet}
												</Form.Control>
												<Form.Description />
												<Form.FieldErrors />
											</Form.Field>
											<Form.Field form={formProposal} name="botResponse">
												<Form.Control>
													{#snippet children({ props })}
														<Input type="hidden" {...props} value={displayedBotResponse} />
													{/snippet}
												</Form.Control>
												<Form.Description />
												<Form.FieldErrors />
											</Form.Field>
											<Form.Field form={formProposal} name="source">
												<Form.Control>
													{#snippet children({ props })}
														<Input type="hidden" {...props} value="playground" />
													{/snippet}
												</Form.Control>
												<Form.Description />
												<Form.FieldErrors />
											</Form.Field>
											<Form.Field form={formProposal} name="proposalEditId">
												<Form.Control>
													{#snippet children({ props })}
														<Input type="hidden" {...props} value="" />
													{/snippet}
												</Form.Control>
												<Form.Description />
												<Form.FieldErrors />
											</Form.Field>
											<Form.Field form={formProposal} name="proposalId">
												<Form.Control>
													{#snippet children({ props })}
														<Input type="hidden" {...props} value="" />
													{/snippet}
												</Form.Control>
												<Form.Description />
												<Form.FieldErrors />
											</Form.Field>
											{#if isTaskChanged}
												<Label class="mt-4"><h3>Review your proposed edits:</h3></Label>
												<p class="text-muted-foreground mt-1">
													Check to make sure the edits are indeed what you'd like to propose. If
													not, close the dialog and undo any unintended edits. Tasks that have not
													been edited are not shown.
												</p>
												<div class="flex flex-col gap-6 pt-4 text-sm">
													{#each [...Object.keys(data.latestTasks.tasks).sort(), ...('new' in playgroundTasks && !isTaskEmpty(playgroundTasks['new']) ? ['new'] : [])] as taskId (taskId)}
														{#if !_.isEqualWith(data.latestTasks.tasks[taskId], playgroundTasks[taskId], trimTaskCustomizer)}
															<TaskDiffSection
																oldTask={data.latestTasks.tasks[taskId]}
																newTask={playgroundTasks[taskId]}
															/>
														{/if}
													{/each}
												</div>
											{/if}
											<Form.Button
												disabled={disableCreateProposalBtn || !isTaskTested}
												class="mt-4 hover:cursor-pointer"
											>
												{#if disableCreateProposalBtn}
													<LoaderCircleIcon class="size-4 animate-spin" />
												{/if}
												Submit
											</Form.Button>
										</form>
									</div>
								</Dialog.Content>
							</Dialog.Root>
						</div>
					{/if}
				{/if}
			</div>
			<div class="flex-shrink-0 border-t bg-white p-4">
				<div class="flex flex-col gap-2">
					<Select.Root type="single" bind:value={selectedChannel}>
						<Select.Trigger class="w-[180px]">
							{selectedChannel === '' ? 'Select a channel' : selectedChannel}
						</Select.Trigger>
						<Select.Content>
							{#each data.guild.channels
								.map((channel: string) => (channel.startsWith('#') ? channel : `#${channel}`))
								.sort() as discordChannel (discordChannel)}
								<Select.Item value={discordChannel} label={discordChannel} />
							{/each}
						</Select.Content>
					</Select.Root>
					<Textarea placeholder="Enter user message ... " bind:value={enteredUserMessage} />
					<Button
						class="w-fit self-end hover:cursor-pointer"
						disabled={running ||
							enteredUserMessage.trim() === '' ||
							selectedChannel === '' ||
							hasTaskMissingField}
						onclick={async () => {
							running = true;
							showCase = true;
							displayedChannel = selectedChannel;
							displayedUserMessage = enteredUserMessage.trim();
							playgroundTasks = trimWhiteSpaceInTasks(playgroundTasks);
							const response = await fetch('/api/bot', {
								method: 'POST',
								body: JSON.stringify({
									channel: displayedChannel,
									userMessage: displayedUserMessage,
									tasks: playgroundTasks,
									soures: 'playground'
								}),
								headers: {
									'Content-Type': 'application/json'
								}
							});

							const { taskId, botResponse } = await response.json();
							triggeredTaskId = taskId;
							displayedBotResponse = botResponse;
							running = false;
							// disableCreateCaseButton = false;
							disableCreateProposalBtn = false;
							// savedCase = false;
							enteredUserMessage = '';
							testedTasks =
								'new' in playgroundTasks && isTaskEmpty(playgroundTasks['new'])
									? _.omit(playgroundTasks, ['new'])
									: $state.snapshot(playgroundTasks);
						}}
					>
						{#if running}
							<LoaderCircleIcon class="size-4 animate-spin" />
						{:else}
							<BotMessageSquareIcon class="size-4" />
						{/if}
						Bot Response
					</Button>
				</div>
			</div>
		</div>
	</div>
</div>
