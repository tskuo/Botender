<script lang="ts">
	// import lodash for object comparison
	import _ from 'lodash';

	// import my components and functions
	import CaseCard from '$lib/components/CaseCard.svelte';
	import TaskSection from '$lib/components/TaskSection.svelte';
	import TaskDiffSection from '$lib/components/TaskDiffSection.svelte';
	import { checkEmptyTask, isTaskEmpty } from '$lib/tasks';

	// import ui components
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
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
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';

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
	import InfoIcon from '@lucide/svelte/icons/info';
	import FolderCogIcon from '@lucide/svelte/icons/folder-cog';
	import FlameIcon from '@lucide/svelte/icons/flame';
	import CheckIcon from '@lucide/svelte/icons/check';
	import DiffIcon from '@lucide/svelte/icons/diff';
	import LandPlotIcon from '@lucide/svelte/icons/land-plot';
	import EyeClosedIcon from '@lucide/svelte/icons/eye-closed';

	import EyeIcon from '@lucide/svelte/icons/eye';

	// import types
	import type { PageProps } from './$types';

	// import svelte features
	import { onMount } from 'svelte';
	import { tick } from 'svelte';
	import { invalidateAll, goto } from '$app/navigation';
	import { slide } from 'svelte/transition';
	import { redirect } from '@sveltejs/kit';

	// data props
	let { data }: PageProps = $props();

	let DEPLOY_THRESHOLD = 2;

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
	let generatingCase = $state(false);
	let savingEdit = $state(false);
	let generatedCases = $state<any[]>([]);
	let generatedCaseRefs = $state<any[]>([]);
	let editMode = $state(false);
	let viewHistory = $state(false);
	let overheated = $state(false);

	let editScope = $state(
		data.edits.length > 0
			? Object.keys(data.edits[0].tasks).filter(
					(key) => !_.isEqual(data.edits[0].tasks[key], data.originalTasks.tasks[key])
				)
			: []
	);

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
		const promise1 = runTestCases(testedTasks);
		const promise2 = generateCases(testedTasks);
		await Promise.all([promise1, promise2]);
		runningTest = false;
	};

	let runTestCases = async (tasks: Tasks | undefined) => {
		const promises = testCaseRefs.map((ref) => ref.runTestForCase(tasks));
		await Promise.all(promises);
	};

	let generateCases = async (tasks: Tasks | undefined) => {
		generatingCase = true;
		overheated = false;
		generatedCases = [];
		if (_.isNil(tasks)) return;
		const resCaseGenerator = await fetch('/api/caseGenerator', {
			method: 'POST',
			body: JSON.stringify({
				oldTasks: data.originalTasks.tasks,
				newTasks: tasks
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
					tasks,
					$state.snapshot(generatedCases[i].triggeredTask),
					$state.snapshot(generatedCases[i].botResponse),
					[],
					[]
				);
			});
		} else {
			overheated = true;
		}
		generatingCase = false;
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
		editScope =
			data.edits.length > 0
				? Object.keys(data.edits[0].tasks).filter(
						(key) => !_.isEqual(data.edits[0].tasks[key], data.originalTasks.tasks[key])
					)
				: [];
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

	let closeProposal = async () => {
		await fetch(`/api/proposals/${data.proposal.id}`, {
			method: 'PATCH',
			body: JSON.stringify({
				action: 'closeProposal'
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});
		goto(`/proposals`);
	};

	let deployProposal = async () => {
		if (data.edits.length === 0 || upvotes.length < DEPLOY_THRESHOLD || _.isNil(data.user.userId)) {
			return;
		}
		const resTaskHistory = await fetch('/api/taskHistory', {
			method: 'POST',
			body: JSON.stringify({
				formTaskHistory: {
					data: {
						tasks: data.edits[0].tasks,
						creator: data.user.userId
					}
				},
				caseOnly: true
			}),
			headers: {
				'Content-Type': 'appplication/json'
			}
		});
		if (resTaskHistory.ok) {
			await fetch(`/api/proposals/${data.proposal.id}`, {
				method: 'PATCH',
				body: JSON.stringify({
					action: 'closeProposal'
				}),
				headers: {
					'Content-Type': 'application/json'
				}
			});
			goto(`/tasks`);
		}
	};

	let removeTaskFunction = (taskId: string) => {
		editScope = editScope.filter((i) => i !== taskId);
		editedTasks = _.omit(editedTasks, [taskId]);
	};

	let hideTaskFunction = (taskId: string) => {
		editScope = editScope.filter((i) => i !== taskId);
		if (taskId in editedTasks) {
			if (isTaskEmpty(editedTasks[taskId])) {
				editedTasks = _.omit(editedTasks, [taskId]);
			}
		}
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
			<Button
				class="mr-1 hover:cursor-pointer"
				onclick={() => {
					console.log($state.snapshot(editedTasks));
				}}><ExternalLinkIcon class="size-4" />Discuss</Button
			>
		</div>
		<Separator />
	</div>
	<div class="grid h-full flex-auto md:grid-cols-5">
		<div class="overflow-auto border-r p-2 md:col-span-2">
			<div class="mb-4 p-2">
				{#if !data.proposal.open}
					<Alert.Root class="border-my-pink text-my-pink mb-2">
						<TriangleAlertIcon />
						<Alert.Title><h4>This proposal has been closed.</h4></Alert.Title>
						<Alert.Description class="text-my-pink">
							<p>This proposal is now available for viewing only.</p>
						</Alert.Description>
					</Alert.Root>
				{/if}
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
			<div class="mb-4 p-2">
				<div class="flex items-center justify-between">
					<div>
						<h3>Proposed Edit</h3>
						{#if editMode}
							<p class="text-primary text-sm">You are currently making edits</p>
						{:else if data.edits.length === 0}
							<p class="text-muted-foreground text-sm">No edits have been proposed yet</p>
						{:else}
							<p class="text-muted-foreground text-sm">
								Last edited by {data.edits[0].editor}
							</p>
						{/if}
					</div>
					{#if editMode}
						<Button
							disabled={runningTest || savingEdit || generatingCase}
							hidden={!data.proposal.open}
							variant="ghost"
							size="icon"
							class="hover:cursor-pointer"
							onclick={() => {
								resetEdit();
								editMode = false;
							}}
						>
							<XIcon />
						</Button>
					{:else}
						<Button
							disabled={generatingCase || runningTest}
							hidden={!data.proposal.open}
							variant="secondary"
							class="hover:cursor-pointer"
							onclick={() => (editMode = true)}
						>
							<PencilIcon class="size-4" />Edit
						</Button>
					{/if}
				</div>
				{#if !editMode}
					{#each [...Object.keys(data.originalTasks.tasks).sort(), ...('new' in editedTasks ? ['new'] : [])] as taskId (taskId)}
						{#if !_.isEqual(data.originalTasks.tasks[taskId], editedTasks[taskId])}
							<div class="pt-4">
								<TaskDiffSection
									oldTask={data.originalTasks.tasks[taskId]}
									newTask={editedTasks[taskId]}
								/>
							</div>
						{/if}
					{/each}
				{:else}
					{#each editScope as taskId (taskId)}
						<div class="pt-4">
							<TaskSection
								id={taskId}
								bind:name={editedTasks[taskId].name}
								bind:trigger={editedTasks[taskId].trigger}
								bind:action={editedTasks[taskId].action}
								{hideTaskFunction}
							/>
						</div>
					{/each}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger class="my-2 w-full">
							<Button variant="secondary" size="sm" class="w-full hover:cursor-pointer">
								<PlusIcon />edit more tasks
							</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-full">
							<DropdownMenu.Group class="w-full">
								<DropdownMenu.Label class="w-full">Select a task to edit</DropdownMenu.Label>
								<DropdownMenu.Separator />
								{#each [...Object.keys(data.originalTasks.tasks).sort(), 'new'] as taskId (taskId)}
									<DropdownMenu.Item
										onclick={() => {
											if (editScope.includes(taskId)) {
												editScope = editScope.filter((i) => i !== taskId);
											} else {
												if (!(taskId in editedTasks)) {
													editedTasks[taskId] = {
														name: '',
														trigger: '',
														action: ''
													};
												}
												editScope.push(taskId);
												editScope = editScope
													.filter((i) => i !== 'new') // Remove 'new' from the array
													.sort() // Sort the remaining keys
													.concat(editScope.includes('new') ? ['new'] : []); // Add 'new' at the end if it exists
											}
										}}
									>
										<div class="flex w-full items-center justify-between">
											{#if taskId in editedTasks}
												<p class="mr-2">Task: {editedTasks[taskId].name}</p>
											{:else if taskId === 'new'}
												<p class="mr-2">New Task</p>
											{:else}
												<p class="mr-2">Task: {data.originalTasks.tasks[taskId].name} (deleted)</p>
											{/if}
											{#if editScope.includes(taskId)}
												<EyeIcon />
											{:else if !editScope.includes(taskId) && taskId !== 'new'}
												<EyeClosedIcon />
											{/if}
										</div>
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{/if}
				<!-- {#if editMode}
					{#if (_.isNil(testedTasks) && (data.edits.length > 0 ? !_.isEqual(editedTasks, data.edits[0].tasks) : !_.isEqual(editedTasks, data.originalTasks.tasks))) || (!_.isNil(testedTasks) && !_.isEqual(testedTasks, editedTasks))}
						<div class="text-primary my-1 flex items-center text-sm">
							<TriangleAlertIcon class="mr-2 size-4" />
							<p>Run test and generate before saving new edits to observe how the bot behaves</p>
						</div>
					{/if}
				{/if} -->
				{#if !editMode}
					{#if data.edits.length > 0 && data.proposal.open}
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
							<AlertDialog.Root>
								<AlertDialog.Trigger
									class={buttonVariants()}
									disabled={upvotes.length < DEPLOY_THRESHOLD}
								>
									<LandPlotIcon class="size-4" />
									Deploy
								</AlertDialog.Trigger>
								<AlertDialog.Content>
									<AlertDialog.Header>
										<AlertDialog.Title>
											Are you sure you want to deploy this proposed edit?
										</AlertDialog.Title>
										<AlertDialog.Description>
											Review the changes to the original and latest tasks below to ensure they are
											correct. If you are satisfied, click the submit button to confirm deployment.
										</AlertDialog.Description>
									</AlertDialog.Header>
									<Tabs.Root value="original" class="mt-2 w-full">
										<Tabs.List class="w-full">
											<Tabs.Trigger value="original">Compare with Original Tasks</Tabs.Trigger>
											<Tabs.Trigger value="latest">Compare with Latest Tasks</Tabs.Trigger>
										</Tabs.List>
										<Tabs.Content value="original">
											<ScrollArea class="h-[50vh] w-full">
												{#each [...Object.keys(data.originalTasks.tasks).sort(), ...('new' in data.edits[0].tasks ? ['new'] : [])] as taskId (taskId)}
													<div class="pt-4">
														<TaskDiffSection
															oldTask={data.originalTasks.tasks[taskId]}
															newTask={data.edits[0].tasks[taskId]}
														/>
													</div>
												{/each}
											</ScrollArea>
										</Tabs.Content>
										<Tabs.Content value="latest">
											<ScrollArea class="h-[50vh] w-full">
												{#each [...Object.keys(data.latestTasks.tasks).sort(), ...('new' in data.edits[0].tasks ? ['new'] : [])] as taskId (taskId)}
													<div class="pt-4">
														<TaskDiffSection
															oldTask={data.latestTasks.tasks[taskId]}
															newTask={data.edits[0].tasks[taskId]}
														/>
													</div>
												{/each}
											</ScrollArea>
										</Tabs.Content>
									</Tabs.Root>
									<AlertDialog.Footer>
										<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
										<AlertDialog.Action
											disabled={upvotes.length < DEPLOY_THRESHOLD}
											onclick={async () => {
												deployProposal();
											}}>Submit</AlertDialog.Action
										>
									</AlertDialog.Footer>
								</AlertDialog.Content>
							</AlertDialog.Root>
						</div>
					{/if}
				{:else}
					{#if checkEmptyTask(editedTasks)}
						<Alert.Root class="border-my-pink text-my-pink my-1">
							<TriangleAlertIcon />
							<Alert.Description class="text-my-pink">
								Task fields must not be left empty.
							</Alert.Description>
						</Alert.Root>
					{/if}
					<div class="mt-2 flex items-center justify-between">
						<!-- Test Button -->
						<Button
							disabled={(data.edits.length > 0
								? _.isEqual(editedTasks, data.edits[0].tasks)
								: _.isEqual(editedTasks, data.originalTasks.tasks)) ||
								_.isEqual(editedTasks, testedTasks) ||
								runningTest ||
								generatingCase ||
								savingEdit ||
								checkEmptyTask(editedTasks)}
							onclick={async () => {
								await runTest();
							}}
						>
							{#if runningTest}
								<LoaderCircleIcon class="size-4 animate-spin" />Test + Generate
							{:else}
								<PlayIcon class="size-4" />Test + Generate
							{/if}
						</Button>
						<div class="flex items-center gap-2">
							<!-- Diff Button -->
							<Dialog.Root>
								<Dialog.Trigger
									class={`${buttonVariants({ variant: 'secondary' })} hover:cursor-pointer`}
									disabled={(data.edits.length > 0
										? _.isEqual(editedTasks, data.edits[0].tasks)
										: _.isEqual(editedTasks, data.originalTasks.tasks)) ||
										runningTest ||
										generatingCase ||
										savingEdit}
								>
									<DiffIcon />
									Diff
								</Dialog.Trigger>
								<Dialog.Content class="max-h-[80vh]">
									<Dialog.Header>
										<Dialog.Title>Compare the differences</Dialog.Title>
										<Dialog.Description>
											The highlighted and strikethrough text indicates the edits you made to the
											current bot instructions.
										</Dialog.Description>
									</Dialog.Header>
									<ScrollArea class="h-[50vh] w-full">
										{#each [...Object.keys(data.originalTasks.tasks).sort(), ...('new' in editedTasks ? ['new'] : [])] as taskId (taskId)}
											<div class="pt-4">
												<TaskDiffSection
													oldTask={data.originalTasks.tasks[taskId]}
													newTask={editedTasks[taskId]}
												/>
											</div>
										{/each}
									</ScrollArea>
								</Dialog.Content>
							</Dialog.Root>
							<!-- Reset Button -->
							<Button
								variant="secondary"
								disabled={(data.edits.length > 0
									? _.isEqual(editedTasks, data.edits[0].tasks)
									: _.isEqual(editedTasks, data.originalTasks.tasks)) ||
									runningTest ||
									generatingCase ||
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
									generatingCase ||
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
						<Button
							variant="ghost"
							class="hover:cursor-pointer"
							size="icon"
							onclick={() => (viewHistory = false)}
						>
							<XIcon />
						</Button>
					{:else}
						<Button
							variant="secondary"
							class="hover:cursor-pointer"
							onclick={() => (viewHistory = true)}
						>
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
															<p class="mt-2">
																<Alert.Root>
																	<InfoIcon />
																	<Alert.Title><h4>Original Task v.s. Latest Task</h4></Alert.Title>
																	<Alert.Description>
																		The original task refers to the version in place when this
																		proposal was first initiated, while the latest task is the
																		currently deployed version that determines how the bot behaves
																		within your community platform now.
																	</Alert.Description>
																</Alert.Root>
															</p>
															<Tabs.Root value="original" class="mt-2 w-full">
																<Tabs.List class="w-full">
																	<Tabs.Trigger value="original">
																		Compare with Original Tasks
																	</Tabs.Trigger>
																	<Tabs.Trigger value="latest">
																		Compare with Latest Tasks
																	</Tabs.Trigger>
																</Tabs.List>
																<Tabs.Content value="original">
																	<ScrollArea class="h-[50vh] w-full">
																		{#each [...Object.keys(data.originalTasks.tasks).sort(), ...('new' in edit.tasks ? ['new'] : [])] as taskId (taskId)}
																			<div class="pt-4">
																				<TaskDiffSection
																					oldTask={data.originalTasks.tasks[taskId]}
																					newTask={edit.tasks[taskId]}
																				/>
																			</div>
																		{/each}
																	</ScrollArea>
																</Tabs.Content>
																<Tabs.Content value="latest">
																	<ScrollArea class="h-[50vh] w-full">
																		{#each [...Object.keys(data.latestTasks.tasks).sort(), ...('new' in edit.tasks ? ['new'] : [])] as taskId (taskId)}
																			<div class="pt-4">
																				<TaskDiffSection
																					oldTask={data.latestTasks.tasks[taskId]}
																					newTask={edit.tasks[taskId]}
																				/>
																			</div>
																		{/each}
																	</ScrollArea>
																</Tabs.Content>
															</Tabs.Root>
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
				<div class="flex items-center gap-2">
					<h3>Check how the bot would behave in these cases</h3>
					<Popover.Root>
						<Popover.Trigger>
							<InfoIcon class="text-muted-foreground size-4 hover:cursor-pointer" />
						</Popover.Trigger>
						<Popover.Content class="text-sm">
							For each case, give a thumbs up if the bot's response is good, or a thumbs down if
							it's not. If you notice any issues, try editing the prompt to address them. If the
							bot's responses are already satisfactory, feel free to upvote the proposed edit to
							support its deployment.
						</Popover.Content>
					</Popover.Root>
				</div>
				{#if (data.edits.length > 0 ? _.isEqual(editedTasks, data.edits[0].tasks) : _.isEqual(editedTasks, data.originalTasks.tasks)) || _.isEqual(editedTasks, testedTasks)}
					<!-- <Alert.Root class="text-muted-foreground mt-1">
						<InfoIcon />
						<Alert.Title>Heads up!</Alert.Title>
						<Alert.Description>
							For each case, give a thumbs up if the bot's response is good, or a thumbs down if
							it's not. If you notice any issues, try editing the prompt to address them. If the
							bot's responses are already satisfactory, feel free to upvote the proposed edit to
							support its deployment.
						</Alert.Description>
					</Alert.Root> -->
				{:else}
					<Alert.Root class="border-primary text-primary mt-1">
						<TriangleAlertIcon />
						<!-- <Alert.Title>Heads up!</Alert.Title> -->
						<Alert.Description class="text-primary">
							Before saving new edits, run test + generate to see the bot's updated responses and
							review generated cases to identify any potential issues with your edit.
						</Alert.Description>
					</Alert.Root>
				{/if}
			</div>
			<div class="flex-1 overflow-hidden">
				<div class="flex flex-col p-4 md:h-1/2">
					<div class="flex items-center gap-2 pb-2">
						<h4>Saved test cases ( {testCases.length} )</h4>
						<Popover.Root>
							<Popover.Trigger>
								<InfoIcon class="text-muted-foreground size-4 hover:cursor-pointer" />
							</Popover.Trigger>
							<Popover.Content class="text-sm">
								Cases saved collectively by everyone to observe how the bot behaves based on the
								proposed edits.
							</Popover.Content>
						</Popover.Root>
					</div>
					{#if testCases.length === 0}
						<div class="flex flex-1 items-center justify-center rounded-md border-1">
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
												tasks={editedTasks}
												edits={data.edits}
												taskHistoryId={data.proposal.taskHistoryId}
												user={data.user}
												removeCaseFunction={data.proposal.open ? removeCaseFunction : undefined}
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
					<div class="flex items-center justify-between pb-2">
						<div class="flex items-center gap-2">
							<h4>
								Generated cases ( {#if generatingCase}
									—
								{:else}
									{generatedCases.length}
								{/if} )
							</h4>
							<Popover.Root>
								<Popover.Trigger>
									<InfoIcon class="text-muted-foreground size-4 hover:cursor-pointer" />
								</Popover.Trigger>
								<Popover.Content class="text-sm">
									Cases generated to uncover potential issues with the proposed edits. You can save
									relevant ones as test cases.
								</Popover.Content>
							</Popover.Root>
						</div>
						<Button
							variant="secondary"
							class="hover:cursor-pointer"
							disabled={generatingCase ||
								(data.edits.length === 0 && _.isEqual(editedTasks, data.originalTasks.tasks)) ||
								checkEmptyTask(editedTasks)}
							hidden={!data.proposal.open}
							onclick={async () => {
								await generateCases($state.snapshot(editedTasks));
							}}
						>
							<FolderCogIcon class="size-4" />
							Generate
						</Button>
					</div>
					{#if generatingCase}
						<div
							class="flex flex-1 flex-col items-center justify-center gap-y-2 rounded-md border-1"
						>
							<CogIcon class="stroke-muted-foreground mr-2 size-10 animate-spin" />
							<p class="text-muted-foreground">generating cases ...</p>
						</div>
					{:else if overheated}
						<div
							class="flex flex-1 flex-col items-center justify-center gap-y-2 rounded-md border-1"
						>
							<FlameIcon class="stroke-muted-foreground size-10" />
							<p class="text-muted-foreground">
								The generator has overheated. Please try again later.
							</p>
						</div>
					{:else if generatedCases.length === 0}
						<div class="flex flex-1 items-center justify-center rounded-md border-1">
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
											checkingBadge={generatedCase.rating >= 2 ? true : false}
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
			<div class="w-full shrink-0" hidden={!data.proposal.open}>
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
										savingEdit ||
										checkEmptyTask(editedTasks)}
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
									Bot Response
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
