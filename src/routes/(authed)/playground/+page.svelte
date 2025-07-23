<script lang="ts">
	// import lodash for object comparison
	import _ from 'lodash';

	// import my components
	import TaskSection from '$lib/components/TaskSection.svelte';
	import TaskDiffSection from '$lib/components/TaskDiffSection.svelte';

	// import my functions
	import { checkEmptyTask, trimTaskCustomizer, trimWhiteSpaceInTasks } from '$lib/tasks';

	// import ui components
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	// import lucide icons
	import UndoIcon from '@lucide/svelte/icons/undo';
	import BotMessageSquareIcon from '@lucide/svelte/icons/bot-message-square';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import HashIcon from '@lucide/svelte/icons/hash';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import BotIcon from '@lucide/svelte/icons/bot';
	import BotOffIcon from '@lucide/svelte/icons/bot-off';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import LightbulbIcon from '@lucide/svelte/icons/lightbulb';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import DiffIcon from '@lucide/svelte/icons/diff';

	// import form-related things
	import { createCaseSchema, playgroundCreateProposalSchema } from '$lib/schema';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	// import types
	import type { PageProps } from './$types';

	// data props
	let { data }: PageProps = $props();

	// initialize create case form
	let disableCreateCaseButton = $state(true);
	const form = superForm(data.form, {
		validators: zodClient(createCaseSchema),
		onSubmit() {
			disableCreateCaseButton = true;
		},
		onError() {
			disableCreateCaseButton = false;
		},
		onUpdated() {
			disableCreateCaseButton = true;
			savedCase = true;
		}
	});
	const { form: formData, enhance } = form;

	// initialize create proposal form
	let disableCreateProposalBtn = $state(true);
	const formProposal = superForm(data.formProposal, {
		validators: zodClient(playgroundCreateProposalSchema),
		onSubmit({ formData }) {
			disableCreateProposalBtn = true;
			if (isTaskChanged) formData.set('editedTasks', JSON.stringify(playgroundTasks));
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
	let playgroundTasks = $state(data.latestTasks.tasks);
	let testedTasks = $state<Tasks | undefined>(undefined);
	let isTaskChanged = $derived(
		!_.isEqualWith(playgroundTasks, data.latestTasks.tasks, trimTaskCustomizer)
	);
	let scope = $state('overall');
	let selectedChannel = $state('');
	let displayedChannel = $state('');
	let enteredUserMessage = $state('');
	let displayedUserMessage = $state('');
	let displayedBotResponse = $state('');
	let triggeredTaskId = $state('');
	let running = $state(false);
	let showCase = $state(false);
	let savedCase = $state(false);

	let scopes = $derived([
		{ value: 'overall', label: 'All Tasks' },
		// { value: 'triggers', label: 'Triggers' },
		...Object.entries(playgroundTasks).map(([taskId, task]) => ({
			value: taskId,
			label: `Task: ${playgroundTasks[taskId].name}`
		}))
	]);

	let removeTaskFunction = (taskId: string) => {
		playgroundTasks = _.omit(playgroundTasks, [taskId]);
	};
</script>

<div class="flex h-screen w-full flex-col">
	<div class="sticky top-0 z-10 bg-white">
		<div class="flex items-center justify-between p-4">
			<h2 class="text-xl font-bold">Playground</h2>
		</div>
		<Separator />
	</div>
	<div class="grid flex-1 md:grid-cols-5">
		<div class="border-r p-4 md:col-span-2">
			<ScrollArea class="h-full w-full">
				<h4 class="font-medium">Scope</h4>
				<div class="pt-2">
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
				<div class="pt-2">
					{#each [...Object.keys(_.omit( playgroundTasks, ['new'] )).sort(), ...('new' in playgroundTasks ? ['new'] : [])] as taskId (taskId)}
						{#if scope === 'overall' || scope === 'triggers' || scope === taskId}
							<div class="pt-4">
								<TaskSection
									id={taskId}
									bind:name={playgroundTasks[taskId].name}
									bind:trigger={playgroundTasks[taskId].trigger}
									bind:action={playgroundTasks[taskId].action}
									triggersOnly={scope === 'triggers'}
									{removeTaskFunction}
								/>
							</div>
						{/if}
					{/each}
				</div>
				<Button
					class="mt-2 w-full hover:cursor-pointer"
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
				<div class="flex items-center gap-2 pt-2">
					<Dialog.Root>
						<Dialog.Trigger
							class={`${buttonVariants({ variant: 'secondary' })} hover:cursor-pointer`}
							disabled={!isTaskChanged}
						>
							<DiffIcon />
							Diff
						</Dialog.Trigger>
						<Dialog.Content class="max-h-[80vh]">
							<Dialog.Header>
								<Dialog.Title>Compare the differences</Dialog.Title>
								<Dialog.Description>
									The highlighted and strikethrough text indicates the edits you made to the current
									bot instructions.
								</Dialog.Description>
							</Dialog.Header>
							<ScrollArea class="h-[50vh] w-full">
								{#each [...Object.keys(data.latestTasks.tasks).sort(), ...('new' in playgroundTasks ? ['new'] : [])] as taskId (taskId)}
									<div class="pt-4">
										<TaskDiffSection
											oldTask={data.latestTasks.tasks[taskId]}
											newTask={playgroundTasks[taskId]}
										/>
									</div>
								{/each}
							</ScrollArea>
						</Dialog.Content>
					</Dialog.Root>
					<Button
						class="hover:cursor-pointer"
						variant="secondary"
						disabled={!isTaskChanged}
						onclick={() => {
							playgroundTasks = data.latestTasks.tasks;
						}}
					>
						<UndoIcon class="size-4" />
						Reset
					</Button>
				</div>
			</ScrollArea>
		</div>
		<div class="p-4 md:col-span-3">
			<div class="flex h-full flex-col justify-between">
				<div class="flex-1">
					{#if isTaskChanged}
						<Alert.Root class="border-primary text-primary mb-2">
							<PencilIcon />
							<Alert.Title><h4>Heads up! You've edited the bot.</h4></Alert.Title>
							<Alert.Description class="text-primary">
								The bot in this playground will now behave according to your edit. You can enter
								example user messages in a selected channel to see how the bot responds. Note that
								changing the task name will not impact the bot's response.
							</Alert.Description>
						</Alert.Root>
					{/if}
					{#if checkEmptyTask(playgroundTasks)}
						<Alert.Root class="border-my-pink text-my-pink mb-2">
							<TriangleAlertIcon />
							<Alert.Description class="text-my-pink">
								Task fields must not be left empty.
							</Alert.Description>
						</Alert.Root>
					{/if}
					{#if showCase}
						<div class="mb-1 flex items-center">
							<HashIcon class="mr-2 size-4" />
							<h4 class="font-semibold">Channel: {displayedChannel}</h4>
						</div>
						<div class="flex items-center">
							<UserRoundIcon class="mr-2 size-4" />
							<h4 class="font-semibold">User Message</h4>
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
								<h4 class="font-semibold">Triggered Task:</h4>

								<h4 class="ml-1 font-semibold">
									{triggeredTaskId in playgroundTasks
										? playgroundTasks[triggeredTaskId].name
										: 'No Task is Triggered'}
								</h4>
							</div>
							{#if triggeredTaskId !== '0'}
								{#if displayedBotResponse === ''}
									<div class="mb-3 flex items-center">
										<BotOffIcon class="mr-2 size-4 flex-none" />
										<p>The bot chose not to respond.</p>
									</div>
								{:else}
									<div class="flex items-center">
										<BotIcon class="mr-2 size-4" />
										<h4 class="font-semibold">Bot's Response</h4>
									</div>
									<p class="mb-3 pl-6">{displayedBotResponse}</p>
								{/if}
							{/if}
							<div class="flex items-center gap-2">
								<form method="POST" use:enhance action="?/createCase" class="hidden">
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
								</form>
								<Dialog.Root>
									<Dialog.Trigger
										class={`${buttonVariants({ variant: 'default' })} hover:cursor-pointer`}
										disabled={!_.isEqualWith(playgroundTasks, testedTasks, trimTaskCustomizer)}
									>
										<LightbulbIcon class="size-4" />
										New Proposal
									</Dialog.Trigger>
									<Dialog.Content class="max-h-[80vh]">
										<Dialog.Header>
											<Dialog.Title>Initiate a New Proposal</Dialog.Title>
											<Dialog.Description>
												Describe the issue you've observed with the current bot's behavior, and
												explain how you would like it to be improved.
											</Dialog.Description>
										</Dialog.Header>
										<form method="POST" use:enhanceProposal action="?/createProposal">
											<Form.Field form={formProposal} name="title">
												<Form.Control>
													{#snippet children({ props })}
														<Form.Label>Proposal Title</Form.Label>
														<Input {...props} bind:value={$formDataProposal.title} />
													{/snippet}
												</Form.Control>
												<Form.Description></Form.Description>
												<Form.FieldErrors />
											</Form.Field>
											<Form.Field form={formProposal} name="initiator">
												<Form.Control>
													{#snippet children({ props })}
														<Form.Label>Initiator</Form.Label>
														<Input {...props} value={data.user?.userName} readonly />
													{/snippet}
												</Form.Control>
												<Form.Description></Form.Description>
												<Form.FieldErrors />
											</Form.Field>
											<Form.Field form={formProposal} name="description">
												<Form.Control>
													{#snippet children({ props })}
														<Form.Label>Description</Form.Label>
														<Textarea {...props} bind:value={$formDataProposal.description} />
													{/snippet}
												</Form.Control>
												<Form.Description></Form.Description>
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
												<Label>Review your proposed edit:</Label>
												<ScrollArea class="mt-1 mb-3 h-[40%] w-full text-sm">
													{#each [...Object.keys(data.latestTasks.tasks).sort(), ...('new' in playgroundTasks ? ['new'] : [])] as taskId (taskId)}
														<div class="pt-4">
															<TaskDiffSection
																oldTask={data.latestTasks.tasks[taskId]}
																newTask={playgroundTasks[taskId]}
															/>
														</div>
													{/each}
												</ScrollArea>
											{/if}
											<Form.Button
												disabled={disableCreateProposalBtn ||
													!_.isEqualWith(playgroundTasks, testedTasks, trimTaskCustomizer)}
											>
												{#if disableCreateProposalBtn}
													<LoaderCircleIcon class="size-4 animate-spin" />
												{/if}
												Submit
											</Form.Button>
										</form>
									</Dialog.Content>
								</Dialog.Root>
							</div>
						{/if}
					{/if}
				</div>
				<div class="flex flex-col gap-2">
					<Select.Root type="single" bind:value={selectedChannel}>
						<Select.Trigger class="w-[180px]">
							{selectedChannel === '' ? 'Select a channel' : selectedChannel}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="#introducion" label="#introducion" />
							<Select.Item value="#general" label="#general" />
							<Select.Item value="#random" label="#random" />
							<Select.Item value="#faq" label="#faq" />
						</Select.Content>
					</Select.Root>
					<Textarea placeholder="Enter user message ... " bind:value={enteredUserMessage} />
					<Button
						class="w-fit self-end hover:cursor-pointer"
						disabled={running ||
							enteredUserMessage.trim() === '' ||
							selectedChannel === '' ||
							checkEmptyTask(playgroundTasks)}
						onclick={async () => {
							running = true;
							showCase = true;
							displayedChannel = selectedChannel;
							displayedUserMessage = enteredUserMessage;
							playgroundTasks = trimWhiteSpaceInTasks(playgroundTasks);
							const response = await fetch('/api/bot', {
								method: 'POST',
								body: JSON.stringify({
									channel: selectedChannel,
									userMessage: enteredUserMessage,
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
							disableCreateCaseButton = false;
							disableCreateProposalBtn = false;
							savedCase = false;
							enteredUserMessage = '';
							testedTasks = $state.snapshot(playgroundTasks);
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
