<script lang="ts">
	// import lodash for object comparison
	import _ from 'lodash';

	// import my components
	import CaseCard from '$lib/components/CaseCard.svelte';
	import TaskSection from '$lib/components/TaskSection.svelte';
	import TaskDiffSection from '$lib/components/TaskDiffSection.svelte';

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
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import CogIcon from '@lucide/svelte/icons/cog';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import XIcon from '@lucide/svelte/icons/x';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
	import ThumbsDownIcon from '@lucide/svelte/icons/thumbs-down';

	// import types
	import type { PageProps } from './$types';

	// import svelte features
	import { onMount } from 'svelte';
	import { tick } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { slide } from 'svelte/transition';

	// data props
	let { data }: PageProps = $props();

	// state for the proposal
	let editedTasks = $state(data.edits.length > 0 ? data.edits[0].tasks : data.originalTasks.tasks);
	let testedTasks = $state<Tasks | undefined>(undefined);
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
	let displayedThumbsUp = $state<string[]>([]);
	let displayedThumbsDown = $state<string[]>([]);
	let showAddCaseSuccess = $state(false);
	let addingCase = $state(false);
	let testCaseRefs = $state<any[]>([]);
	let runningTest = $state(false);
	let savingEdit = $state(false);
	let generatedCases = $state([]);
	let generatedCaseRefs = $state<any[]>([]);
	let editMode = $state(false);
	let viewHistory = $state(false);

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
		displayedThumbsUp = [];
		displayedThumbsDown = [];
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

	// Add New Case to the Test Suite when the Case doesn't already exist
	let createAndAddNewTestCase = async (
		tmpTasks: Tasks,
		channel: string,
		userMessage: string,
		triggeredTaskId: string,
		botResponse: string,
		thumbsUp: string[],
		thumbsDown: string[]
	) => {
		let resCase;
		if (
			data.edits.length > 0
				? _.isEqual(tmpTasks, data.edits[0].tasks)
				: _.isEqual(tmpTasks, data.originalTasks.tasks)
		) {
			resCase = await fetch('/api/cases', {
				method: 'POST',
				body: JSON.stringify({
					formCase: {
						data: {
							channel: channel,
							realUserMessage: false,
							source: 'proposal',
							userMessage: userMessage,
							botResponse: botResponse,
							proposalEditId: data.edits.length > 0 ? data.edits[0].id : '',
							proposalId: data.edits.length > 0 ? data.proposal.id : '',
							taskHistoryId: data.edits.length > 0 ? '' : data.proposal.taskHistoryId,
							triggeredTaskId: triggeredTaskId,
							thumbsUp: thumbsUp,
							thumbsDown: thumbsDown
						}
					}
				}),
				headers: {
					'Content-Type': 'appplication/json'
				}
			});
		} else {
			resCase = await fetch('/api/cases', {
				method: 'POST',
				body: JSON.stringify({
					formCase: {
						data: {
							channel: channel,
							realUserMessage: false,
							userMessage: userMessage,
							botResponse: '',
							proposalEditId: '',
							proposalId: '',
							taskHistoryId: '',
							triggeredTaskId: '',
							source: 'proposal'
						}
					},
					caseOnly: true
				}),
				headers: {
					'Content-Type': 'appplication/json'
				}
			});
		}
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
			if (
				data.edits.length > 0
					? !_.isEqual(tmpTasks, data.edits[0].tasks)
					: !_.isEqual(tmpTasks, data.originalTasks.tasks)
			) {
				await tick();
				const ref = testCaseRefs[testCaseRefs.length - 1];
				ref.setTmpBotResponse(tmpTasks, triggeredTaskId, botResponse, thumbsUp, thumbsDown);
			}
		}
	};

	let removeCaseFunction = async (caseId: string) => {
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
			testCaseRefs = testCaseRefs.slice(0, testCases.length);
		}
	};

	let addGeneratedCaseFunction = async (
		generatedId: string,
		tmpTasks: Tasks,
		channel: string,
		userMessage: string,
		triggeredTaskId: string,
		botResponse: string,
		thumbsUp: string[],
		thumbsDown: string[]
	) => {
		await createAndAddNewTestCase(
			tmpTasks,
			channel,
			userMessage,
			triggeredTaskId,
			botResponse,
			thumbsUp,
			thumbsDown
		);

		const idx = generatedCases.findIndex((c) => c.tmpId === generatedId);
		if (idx !== -1) {
			generatedCases = [...generatedCases.slice(0, idx), ...generatedCases.slice(idx + 1)];
			generatedCaseRefs = [...generatedCaseRefs.slice(0, idx), ...generatedCaseRefs.slice(idx + 1)];
		}
	};

	// Run Tests
	let runTest = async () => {
		runningTest = true;
		testedTasks = $state.snapshot(editedTasks);
		generatedCases = [];
		const promises = testCaseRefs.map((ref) => ref.runTestForCase($state.snapshot(editedTasks)));
		await Promise.all(promises);

		const resCaseGenerator = await fetch('/api/caseGenerator', {
			method: 'POST',
			body: JSON.stringify({
				oldTasks: data.originalTasks.tasks,
				newTasks: $state.snapshot(editedTasks)
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (resCaseGenerator.ok) {
			const caseGeneratorData = await resCaseGenerator.json();
			generatedCases = caseGeneratorData.cases;
			console.log($state.snapshot(generatedCases));
			await tick();
			generatedCaseRefs = generatedCaseRefs.slice(0, $state.snapshot(generatedCases.length));
			generatedCaseRefs.forEach((ref, i) => {
				ref.setTmpBotResponse(
					$state.snapshot(editedTasks),
					$state.snapshot(generatedCases[i].triggeredTask),
					$state.snapshot(generatedCases[i].botResponse),
					[],
					[]
				);
			});
		}

		runningTest = false;
	};

	// Reset Edit
	let resetEdit = () => {
		if (data.edits.length > 0) {
			editedTasks = data.edits[0].tasks;
		} else {
			editedTasks = data.originalTasks.tasks;
		}
		testCaseRefs.forEach((ref) => ref.resetTestForCase());
		testedTasks = undefined;
		generatedCases = [];
	};

	// Save Proposal
	let saveProposal = async () => {
		savingEdit = true;
		const resEdit = await fetch(`/api/proposals/${data.proposal.id}/edits`, {
			method: 'POST',
			body: JSON.stringify({
				tasks: editedTasks,
				editor: data.user?.userId
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});
		if (resEdit.ok) {
			const resEditData = await resEdit.json();
			const promises = testCaseRefs.map((ref) =>
				ref.saveTmpBotResponse(data.proposal.id, resEditData.id)
			);
			await Promise.all(promises);
			await invalidateAll();
			reloadProposalState();
		}
		generatedCases = [];
		editMode = false;
		savingEdit = false;
	};
</script>

<div class="flex h-screen w-full flex-col">
	<div class="sticky top-0 z-10 bg-white">
		<div class="flex items-center justify-between p-3">
			<div class="flex items-center">
				<Button href="/proposals" variant="ghost" size="icon">
					<ChevronLeftIcon />
				</Button>
				<h2 class="text-xl font-bold">Proposal: {data.proposal.title}</h2>
			</div>
			<Button class="mr-1"><ExternalLinkIcon class="size-4" />Discuss</Button>
		</div>
		<Separator />
	</div>
	<div class="grid h-full flex-auto md:grid-cols-5">
		<div class="overflow-auto border-r p-2 md:col-span-2">
			<div class="mb-4 p-2">
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
			<!-- <div class="mb-4 p-2">
				<div class="flex items-center justify-between">
					<div>
						<h3>Discussion</h3>
						{#if data.proposal.discussionSummary === ''}
							<p class="text-muted-foreground text-sm">No one has joined the discussion yet</p>
						{/if}
					</div>
					<Button variant="secondary">
						<ExternalLinkIcon class="size-4" />Join
					</Button>
				</div>
				{#if data.proposal.discussionSummary}
					<p>Summary: {data.proposal.discussionSummary}</p>
				{/if}
			</div> -->
			<div class="mb-4 p-2">
				<div class="flex items-center justify-between">
					<div>
						<h3>Proposed Edit</h3>
						{#if data.edits.length === 0}
							<p class="text-muted-foreground text-sm">
								No edits have been proposed yet. The following are the original task prompts
							</p>
						{:else}
							<p class="text-muted-foreground text-sm">
								Last edited by {data.edits[0].editor}
							</p>
						{/if}
					</div>
					{#if editMode}
						<Button
							disabled={runningTest || savingEdit}
							variant="ghost"
							size="icon"
							onclick={() => {
								resetEdit();
								editMode = false;
							}}
						>
							<XIcon />
						</Button>
					{:else}
						<Button variant="secondary" onclick={() => (editMode = true)}>
							<PencilIcon class="size-4" />Edit
						</Button>
					{/if}
				</div>
				{#if !editMode}
					{#each Object.entries(editedTasks).sort() as [taskId, task] (taskId)}
						{#if !_.isEqual(editedTasks[taskId], data.originalTasks.tasks[taskId])}
							<div class="pt-4">
								<TaskDiffSection
									oldName={data.originalTasks.tasks[taskId].name}
									oldTrigger={data.originalTasks.tasks[taskId].trigger}
									oldAction={data.originalTasks.tasks[taskId].action}
									newName={editedTasks[taskId].name}
									newTrigger={editedTasks[taskId].trigger}
									newAction={editedTasks[taskId].action}
								/>
							</div>
						{/if}
					{/each}
				{:else}
					{#each Object.entries(editedTasks).sort() as [taskId, task] (taskId)}
						{#if !_.isEqual(editedTasks[taskId], data.originalTasks.tasks[taskId])}
							<div class="pt-4">
								<TaskSection
									bind:name={editedTasks[taskId].name}
									bind:trigger={editedTasks[taskId].trigger}
									bind:action={editedTasks[taskId].action}
								/>
							</div>
						{/if}
					{/each}
					<Button class="my-2 w-full" variant="secondary" size="sm">
						<PlusIcon class="size-4" />
					</Button>
				{/if}
				{#if editMode}
					{#if (_.isNil(testedTasks) && (data.edits.length > 0 ? !_.isEqual(editedTasks, data.edits[0].tasks) : !_.isEqual(editedTasks, data.originalTasks.tasks))) || (!_.isNil(testedTasks) && !_.isEqual(testedTasks, editedTasks))}
						<div class="text-primary my-1 flex items-center text-sm">
							<TriangleAlertIcon class="mr-2 size-4" />
							<p>Run tests before saving new edits to observe how the bot behaves</p>
						</div>
					{/if}
				{/if}
				{#if !editMode}
					{#if data.edits.length > 0}
						<div class="mt-2 flex items-center justify-between">
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
											proposalEditId: data.edits[0].id
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
										class="size-6 {upvotes.includes(data.user?.userId)
											? 'fill-primary stroke-primary'
											: ''}"
									/>
									<p>{upvotes.length}</p>
								</ToggleGroup.Item>
								<ToggleGroup.Item
									value="downvote"
									class="data-[state=on]:text-primary rounded-md hover:cursor-pointer data-[state=on]:bg-transparent"
								>
									<ArrowBigDownIcon
										class="size-6 {downvotes.includes(data.user?.userId)
											? 'fill-primary stroke-primary'
											: ''}"
									/>
									<p>{downvotes.length}</p>
								</ToggleGroup.Item>
							</ToggleGroup.Root>
						</div>
					{/if}
				{:else}
					<div class="mt-2 flex items-center justify-between">
						<!-- Test Button -->
						<Button
							disabled={(data.edits.length > 0
								? _.isEqual(editedTasks, data.edits[0].tasks)
								: _.isEqual(editedTasks, data.originalTasks.tasks)) ||
								_.isEqual(editedTasks, testedTasks) ||
								runningTest ||
								savingEdit}
							onclick={async () => {
								await runTest();
							}}
						>
							{#if runningTest}
								<LoaderCircleIcon class="size-4 animate-spin" />Test
							{:else}
								<PlayIcon class="size-4" />Test
							{/if}
						</Button>
						<div class="flex items-center gap-2">
							<!-- Reset Button -->
							<Button
								variant="secondary"
								disabled={(data.edits.length > 0
									? _.isEqual(editedTasks, data.edits[0].tasks)
									: _.isEqual(editedTasks, data.originalTasks.tasks)) ||
									runningTest ||
									savingEdit}
								onclick={() => {
									resetEdit();
								}}
							>
								<UndoIcon class="size-4" />Reset
							</Button>
							<!-- Save Button -->
							<Button
								variant="secondary"
								disabled={(data.edits.length > 0
									? _.isEqual(editedTasks, data.edits[0].tasks)
									: _.isEqual(editedTasks, data.originalTasks.tasks)) ||
									_.isNil(testedTasks) ||
									!_.isEqual(testedTasks, editedTasks) ||
									runningTest ||
									savingEdit}
								onclick={async () => {
									await saveProposal();
								}}
							>
								{#if savingEdit}
									<LoaderCircleIcon class="size-4 animate-spin" />Save
								{:else}
									<SaveIcon class="size-4" />Save
								{/if}
							</Button>
						</div>
					</div>
				{/if}
			</div>
			<div class="mb-2 p-2">
				<div class="flex items-center justify-between">
					<div>
						<h3>Edit History</h3>
						<p class="text-muted-foreground text-sm">
							{data.edits.length} edit{data.edits.length > 1 ? 's have' : ' has'} been made
						</p>
					</div>
					{#if viewHistory}
						<Button variant="ghost" size="icon" onclick={() => (viewHistory = false)}>
							<XIcon />
						</Button>
					{:else}
						<Button variant="secondary" onclick={() => (viewHistory = true)}>
							<BookOpenIcon class="size-4" />View
						</Button>
					{/if}
				</div>
				{#if viewHistory}
					<div transition:slide>
						<Table.Root class="mt-2">
							{#if data.edits.length === 0}
								<Table.Caption>No edits have been proposed yet</Table.Caption>
							{/if}
							<Table.Header>
								<Table.Row class="hover:bg-trasparent">
									<Table.Head><h4>Edit</h4></Table.Head>
									<Table.Head><h4>Editor</h4></Table.Head>
									<Table.Head><h4>Time</h4></Table.Head>
									<Table.Head><h4>Votes</h4></Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each data.edits as edit, i (edit.id)}
									<Table.Row class="hover:bg-trasparent">
										<Table.Cell>
											<Dialog.Root>
												<Dialog.Trigger class="hover:cursor-pointer hover:underline">
													{#if i === 0}
														current
													{:else}
														view
													{/if}
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
															{#each Object.entries(edit.tasks).sort() as [taskId, task] (taskId)}
																<div class="pt-4">
																	<TaskDiffSection
																		oldName={data.originalTasks.tasks[taskId].name}
																		oldTrigger={data.originalTasks.tasks[taskId].trigger}
																		oldAction={data.originalTasks.tasks[taskId].action}
																		newName={edit.tasks[taskId].name}
																		newTrigger={edit.tasks[taskId].trigger}
																		newAction={edit.tasks[taskId].action}
																	/>
																</div>
															{/each}
														</Dialog.Description>
													</Dialog.Header>
												</Dialog.Content>
											</Dialog.Root>
										</Table.Cell>
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
												<div class="flex items-center">
													<ArrowBigUpIcon
														class="mr-2 size-4 {upvotes.includes(data.user?.userId)
															? 'fill-current'
															: ''}"
													/>
													<p class="mr-8">{upvotes.length}</p>
													<ArrowBigDownIcon
														class="mr-2 size-4 {downvotes.includes(data.user?.userId)
															? 'fill-current'
															: ''}"
													/>
													<p>{downvotes.length}</p>
												</div>
											</Table.Cell>
										{:else}
											<Table.Cell>
												<div class="flex items-center">
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
				{/if}
			</div>
		</div>
		<div class="flex flex-col overflow-hidden md:col-span-3" bind:this={rightCol}>
			<div class="px-4 pt-4">
				<h3>Check how the bot would behave in these cases</h3>
				{#if (data.edits.length > 0 ? _.isEqual(editedTasks, data.edits[0].tasks) : _.isEqual(editedTasks, data.originalTasks.tasks)) || _.isEqual(editedTasks, testedTasks)}
					<p class="text-muted-foreground text-sm">
						Give a thumbs up if the bot's response is good, or a thumbs down if it is bad. If you
						find any issues, edit the prompt to fix them.
					</p>
				{:else}
					<!-- <div class="text-primary flex items-center text-sm">
						<TriangleAlertIcon class="mr-2 size-4" />
						<p>
							Run tests to see the bot's updated responses and review generated cases to identify
							any potential issues with your changes
						</p>
					</div> -->
					<Alert.Root class="border-primary text-primary mt-1">
						<TriangleAlertIcon />
						<Alert.Title>
							Run tests to see the bot's updated responses and review generated cases to identify
							any potential issues with your changes.
						</Alert.Title>
						<!-- <Alert.Description class="text-primary">
							Run tests to see the bot's updated responses and review generated cases to identify
							any potential issues with your changes.
						</Alert.Description> -->
					</Alert.Root>
				{/if}
			</div>
			<div class="flex-1 overflow-hidden">
				<div class="flex flex-col p-4 md:h-1/2">
					<h4 class="pb-2">Saved test cases ( {testCases.length} )</h4>
					{#if testCases.length === 0}
						<div
							class="flex flex-1 items-center justify-center rounded-md border-1
"
						>
							<p class="text-muted-foreground">No cases have been saved to the test suite yet</p>
						</div>
					{:else}
						<Carousel.Root
							opts={{
								align: 'start'
							}}
							class="mx-auto w-4/5 max-w-screen md:w-5/6"
						>
							<Carousel.Content>
								{#each testCases as testCase, i (`${testCase.id}-${data.edits.length}`)}
									<Carousel.Item class="xl:basis-1/2">
										<div class="p-1">
											<CaseCard
												bind:this={testCaseRefs[i]}
												{...testCase}
												testCaseBadge={true}
												tasks={data.originalTasks.tasks}
												edits={data.edits}
												taskHistoryId={data.proposal.taskHistoryId}
												user={data.user}
												{removeCaseFunction}
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
				<div class="flex flex-col p-4 md:h-1/2">
					<h4 class="pb-2">
						Generated cases ( {#if runningTest}
							—
						{:else}
							{generatedCases.length}
						{/if} )
					</h4>
					{#if runningTest}
						<div
							class="flex flex-1 flex-col items-center justify-center gap-y-2 rounded-md border-1
"
						>
							<CogIcon class="stroke-muted-foreground mr-2 size-10 animate-spin" />
							<p class="text-muted-foreground">generating cases ...</p>
						</div>
					{:else if generatedCases.length === 0}
						<div
							class="flex flex-1 items-center justify-center rounded-md border-1
"
						>
							<p class="text-muted-foreground">No cases have been generated</p>
						</div>
					{/if}
					<Carousel.Root
						opts={{
							align: 'start'
						}}
						class="mx-auto w-4/5 max-w-screen md:w-5/6"
					>
						<Carousel.Content>
							{#each generatedCases as generatedCase, i (generatedCase.tmpId)}
								<Carousel.Item class="xl:basis-1/2">
									<div class="p-1">
										<CaseCard
											bind:this={generatedCaseRefs[i]}
											channel={generatedCase.channel}
											userMessage={generatedCase.userMessage}
											tasks={editedTasks}
											checkingBadge={generatedCase.label}
											user={data.user}
											generatedId={generatedCase.tmpId}
											{addGeneratedCaseFunction}
										/>
									</div>
								</Carousel.Item>
							{/each}
						</Carousel.Content>
						{#if generatedCases.length !== 0}
							<Carousel.Previous />
							<Carousel.Next />
						{/if}
					</Carousel.Root>
				</div>
			</div>
			<div class="w-full shrink-0">
				<Sheet.Root
					onOpenChangeComplete={(openSheet) => {
						if (!openSheet) clearManualCasePanel();
					}}
				>
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
									{#if data.edits.length === 0}
										{#if _.isEqual(editedTasks, data.originalTasks.tasks)}
											The response is generated by the current bot
										{:else}
											The response is generated based on your unsaved edit
										{/if}
									{:else if _.isEqual(editedTasks, data.edits[0].tasks)}
										The response is generated by the bot according to the latest proposed edit
									{:else}
										The response is generated based on your unsaved edit
									{/if}
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
										<Select.Item value="#general" label="#general" />
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
									<UserIcon class="mt-1 mr-2 size-4 flex-none" />
									<p>{displayedUserMessage}</p>
								</div>
								<div class="mb-2 flex w-full items-center">
									<WrenchIcon class="mr-2 size-4" />
									<h4 class="font-medium">
										{displayedTaskId in editedTasks
											? editedTasks[displayedTaskId].name
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
								<ToggleGroup.Root
									disabled={showAddCaseSuccess}
									type="single"
									class="mt-6"
									variant="outline"
									value={displayedThumbsUp.includes(data.user?.userId)
										? 'thumbsUp'
										: displayedThumbsDown.includes(data.user?.userId)
											? 'thumbsDown'
											: undefined}
									onValueChange={(value) => {
										if (value === 'thumbsUp') {
											displayedThumbsUp = [data.user?.userId];
											displayedThumbsDown = [];
										} else if (value === 'thumbsDown') {
											displayedThumbsUp = [];
											displayedThumbsDown = [data.user?.userId];
										} else {
											displayedThumbsUp = [];
											displayedThumbsDown = [];
										}
									}}
								>
									<ToggleGroup.Item value="thumbsUp" class="data-[state=on]:bg-my-green px-3">
										<ThumbsUpIcon class="size-4" />good response
									</ToggleGroup.Item>
									<ToggleGroup.Item value="thumbsDown" class="data-[state=on]:bg-my-pink px-3">
										<ThumbsDownIcon class="size-4" />bad response
									</ToggleGroup.Item>
								</ToggleGroup.Root>
							</div>
						{/if}
						<Sheet.Footer>
							<div class="flex items-center justify-between">
								<Button
									disabled={showCase ||
										checkingCaseManually ||
										(!enteredCaseId.trim() && !enteredUserMessage.trim() && !selectedChannel) ||
										runningTest ||
										savingEdit}
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
															if (
																data.edits.length > 0
																	? _.isEqual(editedTasks, data.edits[0].tasks)
																	: _.isEqual(editedTasks, data.originalTasks.tasks)
															) {
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
																				proposalEditId:
																					data.edits.length > 0 ? data.edits[0].id : '',
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
															} else {
																// generate bot response
																const resBot = await fetch('/api/bot', {
																	method: 'POST',
																	body: JSON.stringify({
																		channel: fetchCase.channel,
																		userMessage: fetchCase.userMessage,
																		tasks: editedTasks,
																		soures: 'proposal'
																	}),
																	headers: {
																		'Content-Type': 'application/json'
																	}
																});
																const { taskId, botResponse } = await resBot.json();
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
												let tmpTasks;
												if (
													data.edits.length > 0
														? _.isEqual(editedTasks, data.edits[0].tasks)
														: _.isEqual(editedTasks, data.originalTasks.tasks)
												) {
													tmpTasks =
														data.edits.length > 0 ? data.edits[0].tasks : data.originalTasks.tasks;
												} else {
													tmpTasks = editedTasks;
												}

												const resBot = await fetch('/api/bot', {
													method: 'POST',
													body: JSON.stringify({
														channel: selectedChannel,
														userMessage: enteredUserMessage,
														tasks: tmpTasks,
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
									<!-- Clear Button -->
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
									<!-- Add to Test Suite Button -->
									<Button
										variant="secondary"
										disabled={!showCase || checkingCaseManually || showAddCaseSuccess || addingCase}
										onclick={async () => {
											addingCase = true;

											if (!fetchCase) {
												await createAndAddNewTestCase(
													editedTasks,
													displayedChannel,
													displayedUserMessage,
													displayedTaskId,
													displayedBotResponse,
													displayedThumbsUp,
													displayedThumbsDown
												);
												showAddCaseSuccess = true;
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
													if (
														data.edits.length > 0
															? !_.isEqual(editedTasks, data.edits[0].tasks)
															: !_.isEqual(editedTasks, data.originalTasks.tasks)
													) {
														await tick();
														const ref = testCaseRefs[testCaseRefs.length - 1];
														ref.setTmpBotResponse(
															$state.snapshot(editedTasks),
															displayedTaskId,
															displayedBotResponse,
															displayedThumbsUp,
															displayedThumbsDown
														);
													}

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
										Save as Test Case
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
