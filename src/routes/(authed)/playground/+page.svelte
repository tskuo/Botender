<script lang="ts">
	// import lodash for object comparison
	import _ from 'lodash';

	// import my components
	import TaskSection from '$lib/components/TaskSection.svelte';

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

	// import form-related things
	import { playgroundCreateCaseSchema, playgroundCreateProposalSchema } from '$lib/schema';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	// import types
	import type { PageProps } from './$types';

	// data props
	let { data }: PageProps = $props();

	// initialize create case form
	let disableCreateCaseButton = $state(true);
	const form = superForm(data.form, {
		validators: zodClient(playgroundCreateCaseSchema),
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
		onSubmit() {
			disableCreateProposalBtn = true;
		},
		onError() {
			disableCreateProposalBtn = false;
		},
		onUpdated() {
			disableCreateProposalBtn = true;
		}
	});
	const { form: formDataProposal, enhance: enhanceProposal } = formProposal;

	// initialize states
	let playgroundTasks = $state(data.latestTasks.tasks);
	let isTaskChanged = $derived(!_.isEqual(playgroundTasks, data.latestTasks.tasks));
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

	const scopes = [
		{ value: 'overall', label: 'Overall behaviors' },
		{ value: 'triggers', label: 'Triggers' }
	];

	for (const taskId in data.latestTasks.tasks) {
		scopes.push({ value: taskId, label: 'Task: ' + data.latestTasks.tasks[taskId].name });
	}
</script>

<div class="flex h-screen w-full flex-col">
	<div class="sticky top-0 z-10 bg-white">
		<div class="flex items-center justify-between p-3">
			<h2 class=" text-xl font-bold">Playground</h2>
			<!-- <Button
				variant="secondary"
				onclick={() => {
					showCase = false;
				}}
			>
				<PaintbrushIcon class="size-4" />
				Clear
			</Button> -->
		</div>
		<Separator />
	</div>

	<div class="grid flex-1 md:grid-cols-5">
		<div class="border-r p-2 md:col-span-2">
			<ScrollArea class="h-full w-full">
				{#if isTaskChanged}
					<div class="p-2">
						<Alert.Root class="border-primary text-primary">
							<PencilIcon />
							<Alert.Title><h4>Heads up! You've edited the bot's prompts</h4></Alert.Title>
							<Alert.Description class="text-primary">
								Your changes will affect the bot's responses here in the playground, but not on your
								community platform. To update the bot on your community platform, you'll need to
								initiate a proposal.
							</Alert.Description>
						</Alert.Root>
					</div>
				{/if}
				<h4 class="p-2 font-medium">Scope</h4>
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
					{#each Object.entries(playgroundTasks) as [taskId, task] (taskId)}
						{#if scope === 'overall' || scope === 'triggers' || scope === taskId}
							<div class="pt-4">
								<TaskSection
									bind:name={playgroundTasks[taskId].name}
									bind:trigger={playgroundTasks[taskId].trigger}
									bind:action={playgroundTasks[taskId].action}
									triggersOnly={scope === 'triggers'}
								/>
							</div>
						{/if}
					{/each}
				</div>
				<Button
					class="m-2"
					variant="secondary"
					disabled={!isTaskChanged}
					onclick={() => {
						playgroundTasks = data.latestTasks.tasks;
					}}
				>
					<UndoIcon class="size-4" />
					Reset
				</Button>
			</ScrollArea>
		</div>
		<div class="p-3 md:col-span-3">
			<div class="flex h-full flex-col justify-between">
				<div>
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
									<Dialog.Trigger class={buttonVariants({ variant: 'default' })}>
										<LightbulbIcon class="size-4" />
										New Proposal
									</Dialog.Trigger>
									<Dialog.Content>
										<Dialog.Header>
											<Dialog.Title>Initiate a new proposal</Dialog.Title>
											<Dialog.Description>
												Initiate a proposal based on the case you just entered and ran
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
														<Textarea
															{...props}
															bind:value={$formDataProposal.description}
															placeholder="Describe the issue you've noticed and/or suggest any changes you'd like to propose for the bot."
														/>
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
											<Form.Button disabled={disableCreateProposalBtn}>
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
						}}
					>
						{#if running}
							<LoaderCircleIcon class="size-4 animate-spin" />
						{:else}
							<BotMessageSquareIcon class="size-4" />
						{/if}
						Generate Response
					</Button>
				</div>
			</div>
		</div>
	</div>
</div>
