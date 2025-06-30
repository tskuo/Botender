<script lang="ts">
	// import lodash for object comparison
	import _ from 'lodash';

	// import my components
	import CaseCard from '$lib/components/CaseCard.svelte';
	import TaskSection from '$lib/components/TaskSection.svelte';

	// import ui components
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';

	// import lucide icons
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import ArrowBigUpIcon from '@lucide/svelte/icons/arrow-big-up';
	import ArrowBigDownIcon from '@lucide/svelte/icons/arrow-big-down';
	import PlayIcon from '@lucide/svelte/icons/play';
	import BotMessageSquareIcon from '@lucide/svelte/icons/bot-message-square';
	import UndoIcon from '@lucide/svelte/icons/undo';
	import SaveIcon from '@lucide/svelte/icons/save';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import HashIcon from '@lucide/svelte/icons/hash';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import BotIcon from '@lucide/svelte/icons/bot';
	import BotOffIcon from '@lucide/svelte/icons/bot-off';
	import PaintbrushIcon from '@lucide/svelte/icons/paintbrush';
	import FolderPlusIcon from '@lucide/svelte/icons/folder-plus';
	import FolderCheckIcon from '@lucide/svelte/icons/folder-check';
	import UserIcon from '@lucide/svelte/icons/user';
	import UserCheckIcon from '@lucide/svelte/icons/user-check';

	// import types
	import type { PageProps } from './$types';

	// import svelte features
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';

	// data props
	let { data }: PageProps = $props();

	// state for the proposal
	let editedTasks = $state(data.edits.length > 0 ? data.edits[0].tasks : data.originalTasks.tasks);
	let testCases = $state(data.testCases);
	let upvotes = $state(data.edits.length > 0 ? data.edits[0].upvotes : []);
	let downvotes = $state(data.edits.length > 0 ? data.edits[0].downvotes : []);

	let reloadProposalState = () => {
		editedTasks = data.edits.length > 0 ? data.edits[0].tasks : data.originalTasks.tasks;
		testCases = data.testCases;
		upvotes = data.edits.length > 0 ? data.edits[0].upvotes : [];
		downvotes = data.edits.length > 0 ? data.edits[0].downvotes : [];
	};

	// state for checking cases manually
	let enteredCaseId = $state('');
	let selectedChannel = $state('');
	let enteredUserMessage = $state('');
	let checkingCaseManually = $state(false);
	let showCaseError = $state(false);
	let showCaseErrorMessage = $state('');
	let showCase = $state(false);
	let fetchCase: Case | undefined;
	let fetchCaseBotResponse: BotResponse | undefined;
	let displayedChannel = $state('');
	let displayedUserMessage = $state('');
	let displayedBotResponse = $state('');
	let displayedTaskId = $state('');
	let showAddCaseSuccess = $state(false);
	let addingCase = $state(false);

	let clearManualCasePanel = () => {
		enteredCaseId = '';
		selectedChannel = '';
		enteredUserMessage = '';
		checkingCaseManually = false;
		showCaseError = false;
		showCaseErrorMessage = '';
		showCase = false;
		fetchCase = undefined;
		fetchCaseBotResponse = undefined;
		displayedChannel = '';
		displayedUserMessage = '';
		displayedBotResponse = '';
		displayedTaskId = '';
		showAddCaseSuccess = false;
	};

	// sync the sheet
	let rightCol: HTMLDivElement | null = null;
	let sheetWidth = $state(0);

	// Update width on mount and on resize
	function updateSheetWidth() {
		if (rightCol) {
			sheetWidth = rightCol.offsetWidth;
		}
	}

	onMount(() => {
		// Set manual testing sheet width
		updateSheetWidth();
		window.addEventListener('resize', updateSheetWidth);
		return () => window.removeEventListener('resize', updateSheetWidth);
	});

	let removeCaseFuntion = async (caseId: string) => {
		const res = await fetch(`/api/proposals/${data.proposal.id}`, {
			method: 'PATCH',
			body: JSON.stringify({
				action: 'removeCase',
				caseId: caseId
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (res.ok) {
			testCases = testCases.filter((c: Case) => c.id !== caseId);
		}
	};
</script>

<div class="flex h-screen w-full flex-col">
	<div class="sticky top-0 z-10 bg-white">
		<div class="flex items-center p-3">
			<Button href="/proposals" variant="ghost" size="icon">
				<ChevronLeftIcon />
			</Button>
			<h2 class="text-xl font-bold">Proposal: {data.proposal.title}</h2>
		</div>
		<Separator />
	</div>
	<div class="grid h-full flex-auto md:grid-cols-5">
		<div class="overflow-auto border-r p-2 md:col-span-2">
			<div class="mb-2 p-2">
				<h3>Description</h3>
				<p class="text-muted-foreground mb-1 text-sm">
					{data.proposal.initiator} initiated at {new Date(data.proposal.createAt).toLocaleString(
						[],
						{
							year: 'numeric',
							month: 'numeric',
							day: 'numeric',
							hour: '2-digit',
							minute: '2-digit',
							hour12: false
						}
					)}
				</p>
				<p>{data.proposal.description}</p>
			</div>
			<div class="mb-2 p-2">
				<h3>Discussion</h3>
				{#if data.proposal.discussionSummary === ''}
					<p class="text-muted-foreground text-sm">No one has joined the discussion yet.</p>
				{:else}
					<p>Summary: {data.proposal.discussionSummary}</p>
				{/if}
			</div>
			<div class="mb-2 p-2">
				<h3>Proposed Edit</h3>
				{#if data.edits.length === 0}
					<p class="text-muted-foreground text-sm">
						No edits have been proposed yet. The following are the original task prompts.
					</p>
				{:else}
					<p class="text-muted-foreground">
						{#if data.edits.length === 1}
							1 person has proposed the following edit
						{:else}
							{data.edits.length} people have collaboratively proposed the following edits
						{/if}
					</p>
				{/if}
				{#each Object.entries(editedTasks) as [taskId, task] (taskId)}
					<div class="pt-4">
						<TaskSection
							bind:name={editedTasks[taskId].name}
							bind:trigger={editedTasks[taskId].trigger}
							bind:action={editedTasks[taskId].action}
						/>
					</div>
				{/each}
				<p class="text-muted-foreground my-1 text-sm">
					To save new edits, you must first run tests to check the updated bot responses.
				</p>
				<div class="mt-2 flex items-center justify-between">
					<Button
						disabled={data.edits.length > 0
							? _.isEqual(editedTasks, data.edits[0].tasks)
							: _.isEqual(editedTasks, data.originalTasks.tasks)}
					>
						<PlayIcon class="size-4" />Test
					</Button>
					<div class="flex items-center gap-2">
						<Button
							variant="secondary"
							disabled={data.edits.length > 0
								? _.isEqual(editedTasks, data.edits[0].tasks)
								: _.isEqual(editedTasks, data.originalTasks.tasks)}
							onclick={() => {
								if (data.edits.length > 0) {
									editedTasks = data.edits[0].tasks;
								} else {
									editedTasks = data.originalTasks.tasks;
								}
							}}
						>
							<UndoIcon class="size-4" />Reset
						</Button>
						<Button
							variant="secondary"
							disabled={data.edits.length > 0
								? _.isEqual(editedTasks, data.edits[0].tasks)
								: _.isEqual(editedTasks, data.originalTasks.tasks)}
							onclick={async () => {
								const response = await fetch(`/api/proposals/${data.proposal.id}/edits`, {
									method: 'POST',
									body: JSON.stringify({
										tasks: editedTasks,
										editor: data.user?.userId
									}),
									headers: {
										'Content-Type': 'application/json'
									}
								});
								if (response.ok) {
									await invalidateAll();
									reloadProposalState();
								}
							}}
						>
							<SaveIcon class="size-4" />Save
						</Button>
					</div>
				</div>
			</div>
			<div class="mb-2 p-2">
				<h3>Edit History</h3>
				<Table.Root>
					{#if data.edits.length === 0}
						<Table.Caption>No edits have been proposed yet.</Table.Caption>
					{/if}
					<Table.Header>
						<Table.Row class="hover:bg-trasparent">
							<Table.Head><h4>Edit</h4></Table.Head>
							<Table.Head><h4>Editor</h4></Table.Head>
							<Table.Head><h4>Time</h4></Table.Head>
							<Table.Head><h4>Voting</h4></Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.edits as edit, i (edit.id)}
							<Table.Row class="hover:bg-trasparent">
								{#if i === 0}
									<Table.Cell>current</Table.Cell>
								{:else}
									<Table.Cell>
										<Dialog.Root>
											<Dialog.Trigger class="hover:cursor-pointer hover:underline">
												view
											</Dialog.Trigger>
											<Dialog.Content>
												<Dialog.Header>
													<Dialog.Title>Edit made by {edit.editor}</Dialog.Title>
													<Dialog.Description>
														<p>
															{new Date(edit.createAt).toLocaleString([], {
																year: 'numeric',
																month: 'numeric',
																day: 'numeric',
																hour: '2-digit',
																minute: '2-digit',
																hour12: false
															})}
														</p>
														{#each Object.entries(edit.tasks) as [taskId, task] (taskId)}
															<div class="pt-4">
																<TaskSection
																	name={edit.tasks[taskId].name}
																	trigger={edit.tasks[taskId].trigger}
																	action={edit.tasks[taskId].action}
																	readonly={true}
																/>
															</div>
														{/each}
													</Dialog.Description>
												</Dialog.Header>
											</Dialog.Content>
										</Dialog.Root>
									</Table.Cell>
								{/if}
								<Table.Cell>{edit.editor}</Table.Cell>
								<Table.Cell>
									{new Date(edit.createAt).toLocaleString([], {
										year: 'numeric',
										month: 'numeric',
										day: 'numeric',
										hour: '2-digit',
										minute: '2-digit',
										hour12: false
									})}
								</Table.Cell>
								{#if i === 0}
									<Table.Cell>
										<ToggleGroup.Root
											type="single"
											value={upvotes.includes(data.user?.userId)
												? 'upvote'
												: downvotes.includes(data.user?.userId)
													? 'downvote'
													: undefined}
											onValueChange={async (value) => {
												const resVote = await fetch(`/api/proposals/${data.proposal.id}`, {
													method: 'PATCH',
													body: JSON.stringify({
														action: 'voteProposal',
														vote: value,
														proposalEditId: edit.id
													}),
													headers: {
														'Content-Type': 'application/json'
													}
												});
												if (resVote.ok) {
													if (value === 'upvote') {
														upvotes.push(data.user?.userId);
														downvotes = downvotes.filter((u: string) => u !== data.user?.userId);
													} else if (value === 'downvote') {
														downvotes.push(data.user?.userId);
														upvotes = upvotes.filter((u: string) => u !== data.user?.userId);
													} else {
														upvotes = upvotes.filter((u: string) => u !== data.user?.userId);
														downvotes = downvotes.filter((u: string) => u !== data.user?.userId);
													}
												}
											}}
										>
											<ToggleGroup.Item
												value="upvote"
												class="data-[state=on]:text-primary mr-4 rounded-md hover:cursor-pointer data-[state=on]:bg-transparent"
											>
												<ArrowBigUpIcon
													class="size-4 {upvotes.includes(data.user?.userId)
														? 'fill-primary border-primary'
														: ''}"
												/>
												<p>{upvotes.length}</p>
											</ToggleGroup.Item>
											<ToggleGroup.Item
												value="downvote"
												class="data-[state=on]:text-primary rounded-md hover:cursor-pointer data-[state=on]:bg-transparent"
											>
												<ArrowBigDownIcon
													class="size-4 {downvotes.includes(data.user?.userId)
														? 'fill-primary border-primary'
														: ''}"
												/>
												<p>{downvotes.length}</p>
											</ToggleGroup.Item>
										</ToggleGroup.Root>
									</Table.Cell>
								{:else}
									<Table.Cell>
										<div class="text-muted-foreground mx-2 flex items-center">
											<ArrowBigUpIcon
												class="mr-2 size-4 {edit.upvotes.includes(data.user?.userId)
													? 'fill-current'
													: ''}"
											/>
											<p class="mr-8">{edit.upvotes.length}</p>
											<ArrowBigDownIcon
												class="mr-2 size-4 {edit.downvotes.includes(data.user?.userId)
													? 'fill-current'
													: ''}"
											/>
											<p>{edit.downvotes.length}</p>
										</div>
									</Table.Cell>
								{/if}
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</div>
		<div class="flex h-full flex-col overflow-hidden md:col-span-3" bind:this={rightCol}>
			<div class="flex-1 overflow-hidden">
				<div class="p-4 md:h-1/2">
					<div class="mb-2 md:mb-0 md:flex md:justify-between">
						<div>
							<h3>Check test cases</h3>
							<p class="text-muted-foreground mb-1">
								{testCases.length} test
								{testCases.length === 1 ? 'case' : 'cases'} in total in the test suite
							</p>
						</div>
						<ToggleGroup.Root
							size="lg"
							variant="outline"
							type="single"
							class="mx-auto self-start md:mr-0"
						>
							<ToggleGroup.Item value="good" class="px-8 text-lg">- good</ToggleGroup.Item>
							<ToggleGroup.Item value="bad" class="px-8 text-lg">- bad</ToggleGroup.Item>
							<ToggleGroup.Item value="tbd" class="px-8 text-lg">- tbd</ToggleGroup.Item>
						</ToggleGroup.Root>
					</div>
					{#if testCases.length === 0}
						<div class="flex h-full items-center justify-center">
							<p class="text-muted-foreground">No cases have been added to the test suite yet.</p>
						</div>
					{:else}
						<Carousel.Root
							opts={{
								align: 'start'
							}}
							class="mx-auto w-4/5 max-w-screen md:w-5/6"
						>
							<Carousel.Content>
								{#each testCases as testCase (testCase.id)}
									<Carousel.Item class="xl:basis-1/2">
										<div class="p-1">
											<CaseCard
												{...testCase}
												testCaseBadge={true}
												tasks={data.originalTasks.tasks}
												edits={data.edits}
												taskHistoryId={data.proposal.taskHistoryId}
												user={data.user}
												{removeCaseFuntion}
											/>
										</div>
									</Carousel.Item>
								{/each}
							</Carousel.Content>
							<Carousel.Previous />
							<Carousel.Next />
						</Carousel.Root>
					{/if}
				</div>
				<Separator />
				<div class="p-4 md:h-1/2">
					<h3>Check other cases for possible side effects from the proposed edit</h3>
					<p class="text-muted-foreground mb-1">
						0 cases have been suggested. You may add (+) relevant cases to the test cases.
					</p>
					<!-- <Carousel.Root
						opts={{
							align: 'start'
						}}
						class="mx-auto w-4/5 max-w-screen md:w-5/6"
					>
						<Carousel.Content>
							{#each Array(5) as _, i (i)}
								<Carousel.Item class="xl:basis-1/2">
									<div class="p-1">
										<CaseCard
											id={'xxx'}
											channel={'#introduction'}
											userMessage={'This is Sebastian writing. I am currently building up a research group in Berlin with a focus on the intersection of data engineering and ML. We have a postdoc opening in my group, which I would like to share here:'}
											triggeredTask={'Welcome Newcomers'}
											botResponse={'Welcome to our community! We have channels for sports, plants, and cafe discussions. Feel free to join any of them!'}
										/>
									</div>
								</Carousel.Item>
							{/each}
						</Carousel.Content>
						<Carousel.Previous />
						<Carousel.Next />
					</Carousel.Root> -->
				</div>
			</div>
			<div class="w-full shrink-0">
				<Sheet.Root>
					<Sheet.Trigger
						class="flex w-full items-center justify-between border-t py-2 pl-4 text-left hover:cursor-pointer"
					>
						<h3>Check other cases manually</h3>
						<ChevronUpIcon class="mr-4 size-4" />
					</Sheet.Trigger>
					<Sheet.Content
						class="ml-auto"
						side="bottom"
						style="width: {sheetWidth}px; max-width: 100vw;"
					>
						<Sheet.Header>
							<Sheet.Title><h3>Check other cases manually</h3></Sheet.Title>
							<Sheet.Description>
								{#if !showCase}
									The system will search for an existing case using the entered case ID when it is
									not empty. Leave the case ID field empty when trying a new case.
								{/if}
								{#if showCase && !showAddCaseSuccess}
									The response is generated based on the most recent proposed edit of the proposal.
									If no proposed edit has been made, it is based on the initial prompt.
								{/if}
								{#if showCaseError}
									<Alert.Root variant="destructive" class="border-destructive mt-2">
										<TriangleAlertIcon class="size-4" />
										<Alert.Title>Error</Alert.Title>
										<Alert.Description>{showCaseErrorMessage}</Alert.Description>
									</Alert.Root>
								{/if}
								{#if showAddCaseSuccess}
									<Alert.Root class="text-primary border-primary mt-2">
										<FolderCheckIcon class="size-4" />
										<Alert.Title>Success! The case has been added to the test suite.</Alert.Title>
										<Alert.Description class="text-primary">
											Click clear to check another case or close the sheet.
										</Alert.Description>
									</Alert.Root>
								{/if}
							</Sheet.Description>
						</Sheet.Header>
						{#if !showCase}
							<div class="grid flex-1 auto-rows-min gap-3 px-4">
								<Label class="text-right">Check an existing case</Label>
								<Input
									id="caseId"
									placeholder="Case ID"
									bind:value={enteredCaseId}
									onkeydown={() => {
										showCaseError = false;
									}}
								/>
								<div class="flex items-center justify-between py-4">
									<Separator class="flex-[0.48]" />
									<p>OR</p>
									<Separator class="flex-[0.48]" />
								</div>
								<Label class="text-right">Check a new case</Label>
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
							</div>
						{:else}
							<div class="px-4">
								<div class="mb-2 flex items-center">
									<HashIcon class="mr-2 size-4" />
									<h4 class="font-medium">
										{displayedChannel.startsWith('#')
											? displayedChannel.slice(1)
											: displayedChannel}
									</h4>
								</div>
								<div class="mb-4 flex">
									<!-- {#if realUserMessage}
										<UserCheckIcon class="mt-1 mr-2 size-4 flex-none" />
									{:else} -->
									<UserIcon class="mt-1 mr-2 size-4 flex-none" />
									<!-- {/if} -->
									<p>{displayedUserMessage}</p>
								</div>
								<div class="mb-2 flex w-full items-center">
									<WrenchIcon class="mr-2 size-4" />
									<h4 class="font-medium">
										{displayedTaskId in data.originalTasks.tasks
											? data.originalTasks.tasks[displayedTaskId].name
											: 'No Task is Triggered'}
									</h4>
								</div>
								<div class="flex w-full">
									{#if displayedBotResponse !== ''}
										<BotIcon class="mt-1 mr-2 size-4 flex-none" />

										<p>{displayedBotResponse}</p>
									{:else if displayedBotResponse === '' && displayedTaskId !== '0'}
										<BotOffIcon class="mt-1 mr-2 size-4 flex-none" />
										<p>The bot chose not to respond.</p>
									{/if}
								</div>
							</div>
						{/if}
						<Sheet.Footer>
							<div class="flex items-center justify-between">
								<Button
									disabled={showCase ||
										checkingCaseManually ||
										(!enteredCaseId.trim() && !enteredUserMessage.trim() && !selectedChannel)}
									onclick={async () => {
										checkingCaseManually = true;
										showCaseError = false;
										enteredCaseId = enteredCaseId.trim();
										enteredUserMessage = enteredUserMessage.trim();
										if (enteredCaseId) {
											if (testCases.find((c) => c.id === enteredCaseId)) {
												showCaseError = true;
												showCaseErrorMessage = `The case with ID ${enteredCaseId} is already included in the test suite.`;
											} else {
												try {
													const res = await fetch(`/api/cases/${enteredCaseId}`);

													if (res.ok) {
														fetchCase = await res.json();
														if (fetchCase) {
															let botResponses = [];
															try {
																const resBotResponses = await fetch(
																	`/api/cases/${fetchCase.id}/botResponses?taskHistoryId=${data.proposal.taskHistoryId}&proposalId=${data.proposal.id}`,
																	{
																		method: 'GET',
																		headers: {
																			'Content-Type': 'application/json'
																		}
																	}
																);
																const resData = await resBotResponses.json();
																botResponses = resData.botResponses;
															} catch (e) {
																showCaseError = true;
																showCaseErrorMessage = 'An error occurred. Please try again.';
															}

															if (data.edits.length > 0) {
																fetchCaseBotResponse = botResponses.find(
																	(b: BotResponse) =>
																		b.proposalEditId === data.edits[0].id &&
																		b.proposalId === data.proposal.id
																);
															} else {
																fetchCaseBotResponse = botResponses.find(
																	(b: BotResponse) =>
																		b.taskHistoryId === data.proposal.taskHistoryId
																);
															}
															if (fetchCaseBotResponse) {
																// botResposne already exists
																displayedChannel = fetchCase.channel;
																displayedUserMessage = fetchCase.userMessage;
																displayedTaskId = fetchCaseBotResponse.triggeredTask;
																displayedBotResponse = fetchCaseBotResponse.botResponse;
																showCase = true;
															} else {
																// generate bot response
																const resBot = await fetch('/api/bot', {
																	method: 'POST',
																	body: JSON.stringify({
																		channel: fetchCase.channel,
																		userMessage: fetchCase.userMessage,
																		tasks:
																			data.edits.length > 0
																				? data.edits[0].tasks
																				: data.originalTasks.tasks,
																		soures: 'proposal'
																	}),
																	headers: {
																		'Content-Type': 'application/json'
																	}
																});
																const { taskId, botResponse } = await resBot.json();

																const resBotResponse = await fetch(
																	`/api/cases/${fetchCase.id}/botResponses`,
																	{
																		method: 'POST',
																		body: JSON.stringify({
																			botResponse: botResponse,
																			proposalEditId: data.edits.length > 0 ? data.edits[0].id : '',
																			proposalId: data.edits.length > 0 ? data.proposal.id : '',
																			taskHistoryId:
																				data.edits.length > 0 ? '' : data.proposal.taskHistoryId,
																			triggeredTaskId: taskId
																		}),
																		headers: {
																			'Content-Type': 'application/json'
																		}
																	}
																);
																displayedChannel = fetchCase.channel;
																displayedUserMessage = fetchCase.userMessage;
																displayedTaskId = taskId;
																displayedBotResponse = botResponse;
																showCase = true;
															}
														}
													} else {
														showCaseError = true;
														showCaseErrorMessage = `The case with ID ${enteredCaseId} doesn't exist.`;
													}
												} catch (e) {
													showCaseError = true;
													showCaseErrorMessage = 'An error occurred. Please try again.';
												}
											}
										} else {
											if (!enteredUserMessage) {
												showCaseError = true;
												showCaseErrorMessage =
													'If you are not entering an existing case ID, please enter the user message you would like to check.';
											} else if (!selectedChannel) {
												showCaseError = true;
												showCaseErrorMessage =
													'If you are not entering an existing case ID, please select a channel you would like to check.';
											} else {
												const resBot = await fetch('/api/bot', {
													method: 'POST',
													body: JSON.stringify({
														channel: selectedChannel,
														userMessage: enteredUserMessage,
														tasks:
															data.edits.length > 0
																? data.edits[0].tasks
																: data.originalTasks.tasks,
														soures: 'proposal'
													}),
													headers: {
														'Content-Type': 'application/json'
													}
												});
												const { taskId, botResponse } = await resBot.json();
												displayedChannel = selectedChannel;
												displayedUserMessage = enteredUserMessage;
												displayedTaskId = taskId;
												displayedBotResponse = botResponse;
												showCase = true;
											}
										}
										checkingCaseManually = false;
									}}
								>
									{#if checkingCaseManually}
										<LoaderCircleIcon class="size-4 animate-spin" />
									{:else}
										<BotMessageSquareIcon class="size-4" />
									{/if}
									Generate Response
								</Button>
								<div>
									<Button
										variant="secondary"
										disabled={checkingCaseManually || addingCase}
										onclick={() => {
											clearManualCasePanel();
										}}
									>
										<PaintbrushIcon class="size-4" />
										Clear
									</Button>
									<Button
										variant="secondary"
										disabled={!showCase || checkingCaseManually || showAddCaseSuccess || addingCase}
										onclick={async () => {
											addingCase = true;

											if (!fetchCase) {
												// create case first if no existing case
												const resCase = await fetch('/api/cases', {
													method: 'POST',
													body: JSON.stringify({
														formCase: {
															data: {
																channel: displayedChannel,
																realUserMessage: false,
																userMessage: displayedUserMessage,
																botResponse: displayedBotResponse,
																proposalEditId: data.edits.length > 0 ? data.edits[0].id : '',
																proposalId: data.edits.length > 0 ? data.proposal.id : '',
																taskHistoryId:
																	data.edits.length > 0 ? '' : data.proposal.taskHistoryId,
																triggeredTaskId: displayedTaskId,
																source: 'proposal'
															}
														}
													}),
													headers: {
														'Content-Type': 'appplication/json'
													}
												});
												const resCaseData = await resCase.json();
												const resNewCase = await fetch(`/api/cases/${resCaseData.id}`);
												const newCase = await resNewCase.json();
												const res = await fetch(`/api/proposals/${data.proposal.id}`, {
													method: 'PATCH',
													body: JSON.stringify({
														action: 'addCase',
														caseId: newCase.id
													}),
													headers: {
														'Content-Type': 'application/json'
													}
												});
												if (res.ok) {
													testCases.push(newCase);
													showAddCaseSuccess = true;
												}
											} else {
												const res = await fetch(`/api/proposals/${data.proposal.id}`, {
													method: 'PATCH',
													body: JSON.stringify({
														action: 'addCase',
														caseId: fetchCase.id
													}),
													headers: {
														'Content-Type': 'application/json'
													}
												});
												if (res.ok) {
													testCases.push(fetchCase);
													showAddCaseSuccess = true;
												}
											}
											addingCase = false;
										}}
									>
										{#if addingCase}
											<LoaderCircleIcon class="size-4 animate-spin" />
										{:else}
											<FolderPlusIcon class="size-4" />
										{/if}
										Add to Test Suite
									</Button>
								</div>
							</div>
							<!-- <Sheet.Close class={buttonVariants({ variant: 'outline' })}>Save changes</Sheet.Close> -->
						</Sheet.Footer>
					</Sheet.Content>
				</Sheet.Root>
			</div>
		</div>
	</div>
</div>
