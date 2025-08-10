<script lang="ts">
	// import lodash for object comparison
	import _ from 'lodash';

	// import my components and functions
	import CaseCard from '$lib/components/CaseCard.svelte';
	import TaskSection from '$lib/components/TaskSection.svelte';
	import TaskDiffSection from '$lib/components/TaskDiffSection.svelte';
	import {
		trimTaskCustomizer,
		trimWhiteSpaceInTasks,
		isTaskEmpty,
		isTaskMissingField
	} from '$lib/tasks';

	// import ui components
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import { type CarouselAPI } from '$lib/components/ui/carousel/context.js';
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
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';

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
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import CogIcon from '@lucide/svelte/icons/cog';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import XIcon from '@lucide/svelte/icons/x';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
	import ThumbsDownIcon from '@lucide/svelte/icons/thumbs-down';
	import InfoIcon from '@lucide/svelte/icons/info';
	import FolderCogIcon from '@lucide/svelte/icons/folder-cog';
	import FlameIcon from '@lucide/svelte/icons/flame';
	import DiffIcon from '@lucide/svelte/icons/diff';
	import LandPlotIcon from '@lucide/svelte/icons/land-plot';
	import EyeClosedIcon from '@lucide/svelte/icons/eye-closed';
	import SmileIcon from '@lucide/svelte/icons/smile';
	import CircleCheckBigIcon from '@lucide/svelte/icons/circle-check-big';
	import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
	import EyeIcon from '@lucide/svelte/icons/eye';

	// import types
	import type { PageProps } from './$types';

	// import svelte features
	import { onMount } from 'svelte';
	import { tick } from 'svelte';
	import { invalidateAll, goto } from '$app/navigation';
	import { slide } from 'svelte/transition';
	import { page } from '$app/state';

	// data props
	let { data }: PageProps = $props();

	// state for the proposal
	let editedTasks = $state<Tasks>(
		data.edits.length > 0 ? data.edits[0].tasks : data.originalTasks.tasks
	);
	let testedTasks = $state<Tasks | undefined>(undefined);
	let testCases = $state(data.testCases);
	let upvotes = $state(data.edits.length > 0 ? data.edits[0].upvotes : []);
	let downvotes = $state(data.edits.length > 0 ? data.edits[0].downvotes : []);

	let reloadProposalState = () => {
		editedTasks = data.edits.length > 0 ? data.edits[0].tasks : data.originalTasks.tasks;
		testCases = data.testCases;
		upvotes = data.edits.length > 0 ? data.edits[0].upvotes : [];
		downvotes = data.edits.length > 0 ? data.edits[0].downvotes : [];
		editQuestionnaire = [];
	};

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
	let generatedCases = $state<any[]>(
		data.edits.length > 0 && data.edits[0].generatedCaseCache
			? data.edits[0].generatedCaseCache
			: []
	);
	let generatedCaseRefs = $state<any[]>([]);
	let editMode = $state(false);
	let viewHistory = $state(false);
	let overheated = $state(false);
	let deployingProposal = $state(false);
	let closingProposal = $state(false);
	let closeAlertOpen = $state(false);
	let reopeningProposal = $state(false);
	let reopenAlertOpen = $state(false);
	let api = $state<CarouselAPI>();
	let previousTestCaseCount = $state(data.testCases.length);
	let editQuestionnaire = $state<string[]>([]);

	// scroll to the end whenever a new test case is saved
	$effect(() => {
		if (api) {
			api.on('slidesChanged', () => {
				if (testCases.length > previousTestCaseCount) {
					api!.scrollTo(testCases.length);
				}
				previousTestCaseCount = testCases.length;
			});
		}
	});

	let editScope = $state(
		(data.edits.length > 0
			? Object.keys(data.edits[0].tasks).filter(
					(key) =>
						!_.isEqualWith(
							data.edits[0].tasks[key],
							data.originalTasks.tasks[key],
							trimTaskCustomizer
						)
				)
			: []
		).sort((a, b) => {
			if (a === 'new') return 1;
			if (b === 'new') return -1;
			return a.localeCompare(b);
		})
	);

	let tasksWithMissingFields = $derived(
		Object.entries(editedTasks)
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

	let editedTasksWithoutEmptyNewTask = $derived(
		'new' in editedTasks && isTaskEmpty(editedTasks['new'])
			? _.omit(editedTasks, ['new'])
			: editedTasks
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

		(async () => {
			// If there's a cache of generated cases from a previous edit, load them
			// and update their bot responses based on the current tasks.
			if (data.edits.length > 0 && data.edits[0].generatedCaseCache) {
				// Wait for the DOM to update so that generatedCaseRefs is populated by the #each block
				await tick();

				if (generatedCaseRefs.length === generatedCases.length) {
					generatedCaseRefs.forEach((ref, i) => {
						if (ref) {
							ref.setTmpBotResponse(
								trimWhiteSpaceInTasks(data.edits[0].tasks),
								generatedCases[i].triggeredTask,
								generatedCases[i].botResponse,
								[],
								[]
							);
						}
					});
				}
			}
		})();

		return () => window.removeEventListener('resize', updateSheetWidth);
	});

	// Add New Case to the Test Suite when the Case doesn't already exist
	let createAndAddNewTestCase = async (
		generatedId: string,
		tmpTasks: Tasks,
		channel: string,
		userMessage: string,
		triggeredTaskId: string,
		botResponse: string,
		thumbsUp: string[],
		thumbsDown: string[],
		issue: string
	) => {
		let resCase;
		if (
			data.edits.length > 0
				? _.isEqualWith(tmpTasks, data.edits[0].tasks, trimTaskCustomizer)
				: _.isEqualWith(tmpTasks, data.originalTasks.tasks, trimTaskCustomizer)
		) {
			resCase = await fetch(`/api/guilds/${page.params.guildId}/cases`, {
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
							thumbsDown: thumbsDown,
							generatedId: generatedId,
							issue: issue
						}
					}
				}),
				headers: {
					'Content-Type': 'appplication/json'
				}
			});
		} else {
			resCase = await fetch(`/api/guilds/${page.params.guildId}/cases`, {
				method: 'POST',
				body: JSON.stringify({
					formCase: {
						data: {
							channel: channel,
							realUserMessage: false,
							source: 'proposal',
							userMessage: userMessage,
							botResponse: '',
							proposalEditId: '',
							proposalId: '',
							taskHistoryId: '',
							triggeredTaskId: '',
							generatedId: generatedId,
							issue: issue
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
		const resNewCase = await fetch(`/api/guilds/${page.params.guildId}/cases/${resCaseData.id}`);
		const newCase = await resNewCase.json();
		const res = await fetch(`/api/guilds/${page.params.guildId}/proposals/${data.proposal.id}`, {
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
					? !_.isEqualWith(tmpTasks, data.edits[0].tasks, trimTaskCustomizer)
					: !_.isEqualWith(tmpTasks, data.originalTasks.tasks, trimTaskCustomizer)
			) {
				await tick();
				const ref = testCaseRefs[testCaseRefs.length - 1];
				ref.setTmpBotResponse(tmpTasks, triggeredTaskId, botResponse, thumbsUp, thumbsDown);
			}
		}
	};

	let removeCaseFunction = async (caseId: string) => {
		const res = await fetch(`/api/guilds/${page.params.guildId}/proposals/${data.proposal.id}`, {
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
		thumbsDown: string[],
		issue: string
	) => {
		await createAndAddNewTestCase(
			generatedId,
			trimWhiteSpaceInTasks(tmpTasks),
			channel,
			userMessage,
			triggeredTaskId,
			botResponse,
			thumbsUp,
			thumbsDown,
			issue
		);

		const idx = generatedCases.findIndex((c) => c.tmpId === generatedId);
		if (idx !== -1) {
			generatedCases = [...generatedCases.slice(0, idx), ...generatedCases.slice(idx + 1)];
			generatedCaseRefs = [...generatedCaseRefs.slice(0, idx), ...generatedCaseRefs.slice(idx + 1)];
		}

		if (data.edits.length > 0 && _.isEqualWith(tmpTasks, data.edits[0].tasks, trimTaskCustomizer)) {
			await fetch(
				`/api/guilds/${page.params.guildId}/proposals/${data.proposal.id}/edits/${data.edits[0].id}`,
				{
					method: 'PATCH',
					body: JSON.stringify({
						action: 'removeCaseCache',
						generatedId: generatedId
					}),
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);
		}
	};

	// Run Tests
	let runTest = async () => {
		runningTest = true;
		testedTasks = $state.snapshot(trimWhiteSpaceInTasks(editedTasksWithoutEmptyNewTask));
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
		const resCaseGenerator = await fetch(`/api/guilds/${page.params.guildId}/caseGenerator`, {
			method: 'POST',
			body: JSON.stringify({
				oldTasks: data.originalTasks.tasks,
				newTasks: trimWhiteSpaceInTasks(tasks),
				proposalId: data.proposal.id,
				editId:
					data.edits.length > 0 && _.isEqualWith(tasks, data.edits[0].tasks, trimTaskCustomizer)
						? data.edits[0].id
						: ''
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
					trimWhiteSpaceInTasks(tasks),
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
		editScope = (
			data.edits.length > 0
				? Object.keys(data.edits[0].tasks).filter(
						(key) =>
							!_.isEqualWith(
								data.edits[0].tasks[key],
								data.originalTasks.tasks[key],
								trimTaskCustomizer
							)
					)
				: []
		).sort((a, b) => {
			if (a === 'new') return 1;
			if (b === 'new') return -1;
			return a.localeCompare(b);
		});
	};

	// Save Proposal
	let saveProposal = async () => {
		savingEdit = true;
		const resEdit = await fetch(
			`/api/guilds/${page.params.guildId}/proposals/${data.proposal.id}/edits`,
			{
				method: 'POST',
				body: JSON.stringify({
					tasks: trimWhiteSpaceInTasks(editedTasksWithoutEmptyNewTask),
					editQuestionnaire: editQuestionnaire
				}),
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
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
		closingProposal = true;
		await fetch(`/api/guilds/${page.params.guildId}/proposals/${data.proposal.id}`, {
			method: 'PATCH',
			body: JSON.stringify({
				action: 'closeProposal'
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});
		await invalidateAll();
		reloadProposalState();
		closeAlertOpen = false;
		closingProposal = false;
	};

	let reopenProposal = async () => {
		reopeningProposal = true;
		await fetch(`/api/guilds/${page.params.guildId}/proposals/${data.proposal.id}`, {
			method: 'PATCH',
			body: JSON.stringify({
				action: 'reopenProposal'
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});
		await invalidateAll();
		reloadProposalState();
		reopenAlertOpen = false;
		reopeningProposal = false;
	};

	let deployProposal = async () => {
		deployingProposal = true;
		if (
			data.edits.length === 0 ||
			upvotes.length < data.guild.deploy_threshold ||
			_.isNil(data.user?.userId)
		) {
			return;
		}

		const changedTasks = _.pickBy(
			data.edits[0].tasks,
			(task, taskId) => !_.isEqualWith(task, data.originalTasks.tasks[taskId], trimTaskCustomizer)
		);

		const resTaskHistory = await fetch(`/api/guilds/${page.params.guildId}/taskHistory`, {
			method: 'POST',
			body: JSON.stringify({
				formTaskHistory: {
					data: {
						changedTasks: trimWhiteSpaceInTasks(changedTasks)
					}
				},
				caseOnly: true
			}),
			headers: {
				'Content-Type': 'appplication/json'
			}
		});
		if (resTaskHistory.ok) {
			await fetch(`/api/guilds/${page.params.guildId}/proposals/${data.proposal.id}`, {
				method: 'PATCH',
				body: JSON.stringify({
					action: 'deployProposal',
					proposalEditId: data.edits[0].id
				}),
				headers: {
					'Content-Type': 'application/json'
				}
			});
			goto(`/guilds/${page.params.guildId}/tasks`);
		}
		deployingProposal = false;
	};

	const editQuestionnaireItems = [
		{
			id: 'case_self',
			label: 'address specific cases I entered myself'
		},
		{
			id: 'case_test',
			label: 'address specific saved or generated test cases'
		},
		{
			id: 'issue_self',
			label: 'address general issues I thought of myself'
		},
		{
			id: 'issue_others',
			label: 'address general issues that someone else raised'
		},
		{
			id: 'other',
			label: 'other'
		}
	];
</script>

<div class="flex h-screen w-full flex-col">
	<div class="sticky top-0 z-10 bg-white">
		<div class="flex items-center justify-between p-3">
			<div class="flex items-center">
				<Button href={`/guilds/${page.params.guildId}/proposals`} variant="ghost" size="icon">
					<ChevronLeftIcon />
				</Button>
				<h2 class="text-xl font-bold">Proposal: {data.proposal.title}</h2>
			</div>
			<div class="flex items-center gap-x-2">
				{#if data.proposal.open || (!data.proposal.open && !data.proposal.deployed)}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="ghost" class="hover:cursor-pointer">
									<EllipsisVerticalIcon />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content>
							{#if data.proposal.open}
								<DropdownMenu.Item
									class="hover:cursor-pointer"
									onclick={() => (closeAlertOpen = true)}
								>
									<span class="text-my-pink">Close Proposal</span>
								</DropdownMenu.Item>
							{:else if !data.proposal.open && !data.proposal.deployed}
								<DropdownMenu.Item
									class="hover:cursor-pointer"
									onclick={() => (reopenAlertOpen = true)}
								>
									Reopen Proposal
								</DropdownMenu.Item>
							{/if}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
					<AlertDialog.Root bind:open={closeAlertOpen}>
						<AlertDialog.Content>
							<AlertDialog.Header>
								<AlertDialog.Title><h3>Are you absolutely sure?</h3></AlertDialog.Title>
								<AlertDialog.Description class="text-foreground text-base">
									This action will temporarily close the proposal. A notification will be sent to
									the Discord thread to inform everyone that the proposal has been closed. You can
									reopen it later if needed.
								</AlertDialog.Description>
							</AlertDialog.Header>
							<AlertDialog.Footer>
								<AlertDialog.Cancel disabled={closingProposal} class="hover:cursor-pointer">
									Cancel
								</AlertDialog.Cancel>
								<AlertDialog.Action
									class={`${buttonVariants({ variant: 'destructive' })} hover:cursor-pointer`}
									onclick={async () => {
										await closeProposal();
									}}
									disabled={closingProposal}
								>
									{#if closingProposal}
										<LoaderCircleIcon class="size-4 animate-spin" />
									{/if}
									Close
								</AlertDialog.Action>
							</AlertDialog.Footer>
						</AlertDialog.Content>
					</AlertDialog.Root>
					<AlertDialog.Root bind:open={reopenAlertOpen}>
						<AlertDialog.Content>
							<AlertDialog.Header>
								<AlertDialog.Title><h3>Are you absolutely sure?</h3></AlertDialog.Title>
								<AlertDialog.Description class="text-foreground text-base">
									This action will reopen the proposal. A notification will be sent to the Discord
									thread to inform everyone that the proposal has been reopened. You can close it
									later if needed.
								</AlertDialog.Description>
							</AlertDialog.Header>
							<AlertDialog.Footer>
								<AlertDialog.Cancel disabled={reopeningProposal} class="hover:cursor-pointer">
									Cancel
								</AlertDialog.Cancel>
								<AlertDialog.Action
									class={`${buttonVariants({ variant: 'default' })} hover:cursor-pointer`}
									onclick={async () => {
										await reopenProposal();
									}}
									disabled={reopeningProposal}
								>
									{#if reopeningProposal}
										<LoaderCircleIcon class="size-4 animate-spin" />
									{/if}
									Reopen
								</AlertDialog.Action>
							</AlertDialog.Footer>
						</AlertDialog.Content>
					</AlertDialog.Root>
				{/if}
				<Button
					href={`https://discord.com/channels/${page.params.guildId}/${data.proposal.threadId}`}
					target="_blank"
					rel="noopener noreferrer"
					class="mr-1 hover:cursor-pointer"
				>
					<ExternalLinkIcon class="size-4" />Discuss
				</Button>
			</div>
		</div>
		<Separator />
	</div>
	<div class="grid h-full flex-auto md:grid-cols-5">
		<div class="overflow-auto border-r p-2 md:col-span-2">
			<div class="mb-4 p-2">
				{#if !data.proposal.open}
					{#if data.proposal.deployed}
						<Alert.Root class="border-my-green text-my-green mb-2">
							<CircleCheckBigIcon />
							<Alert.Title>
								<h4>This proposal has been successfully deployed!</h4>
							</Alert.Title>
							<Alert.Description class="text-my-green">
								<p>This proposal is now permanently closed and is available for viewing only.</p>
							</Alert.Description>
						</Alert.Root>
					{:else}
						<Alert.Root class="border-my-pink text-my-pink mb-2">
							<TriangleAlertIcon />
							<Alert.Title><h4>This proposal has been closed.</h4></Alert.Title>
							<Alert.Description class="text-my-pink">
								<p>
									This proposal is now temporarily closed and available for viewing only. To reopen
									it, click the three-dot button in the upper-right corner.
								</p>
							</Alert.Description>
						</Alert.Root>
					{/if}
				{/if}
				{#if !editMode && data.edits.length === 0}
					<Alert.Root class="border-primary text-primary mb-2">
						<InfoIcon />
						<Alert.Title>
							<h4>Get Started</h4>
						</Alert.Title>
						<Alert.Description class="text-primary">
							<p>
								Go ahead and make an edit to implement the proposed change. Once you've done that,
								take a look at the auto-generated test cases to see how your edit affects the bot's
								behavior.
							</p>
						</Alert.Description>
					</Alert.Root>
				{/if}
				<h3>Description</h3>
				<p class="text-muted-foreground mb-1 text-sm">
					Initiated by {data.proposal.initiator} at {new Date(
						data.proposal.createAt
					).toLocaleString([], {
						year: 'numeric',
						month: 'numeric',
						day: 'numeric',
						hour: '2-digit',
						minute: '2-digit',
						hour12: false
					})}
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
								Last edited by {data.edits[0].editor} at {new Date(
									data.edits[0].createAt
								).toLocaleString([], {
									year: 'numeric',
									month: 'numeric',
									day: 'numeric',
									hour: '2-digit',
									minute: '2-digit',
									hour12: false
								})}
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
							class="w-24 justify-start hover:cursor-pointer"
							onclick={() => (editMode = true)}
						>
							<PencilIcon class="mr-2 size-4" />Edit
						</Button>
					{/if}
				</div>

				{#if !editMode}
					<div class="flex flex-col gap-6 pt-4">
						{#each [...Object.keys(_.omit( editedTasks, ['new'] )).sort(), ...('new' in editedTasks ? ['new'] : [])] as taskId (taskId)}
							{#if !_.isEqualWith(data.originalTasks.tasks[taskId], editedTasks[taskId], trimTaskCustomizer)}
								<TaskDiffSection
									oldTask={data.originalTasks.tasks[taskId]}
									newTask={editedTasks[taskId]}
								/>
							{/if}
						{/each}
					</div>
				{:else}
					<div class="flex flex-col gap-6 pt-4">
						{#each editScope as taskId (taskId)}
							<TaskSection
								id={taskId}
								bind:name={editedTasks[taskId].name}
								bind:trigger={editedTasks[taskId].trigger}
								bind:action={editedTasks[taskId].action}
							/>
						{/each}
					</div>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger class="my-2 w-full">
							<Button variant="secondary" size="sm" class="w-full hover:cursor-pointer">
								<WrenchIcon />view more or hide tasks
							</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-full">
							<DropdownMenu.Group class="w-full">
								<DropdownMenu.Label class="w-full">
									Select a task to view or hide
								</DropdownMenu.Label>
								<DropdownMenu.Separator />
								{#each [...Object.keys(data.originalTasks.tasks).sort(), 'new'] as taskId (taskId)}
									{#if taskId === 'new' ? true : !isTaskEmpty(data.originalTasks.tasks[taskId])}
										<DropdownMenu.Item
											onclick={() => {
												if (editScope.includes(taskId)) {
													editScope = editScope.filter((i) => i !== taskId);
													if (
														taskId === 'new' &&
														'new' in editedTasks &&
														isTaskEmpty(editedTasks['new'])
													) {
														editedTasks = _.omit(editedTasks, ['new']);
													}
												} else {
													if (!(taskId in editedTasks)) {
														// taskId can only be 'new'
														editedTasks[taskId] = {
															name: '',
															trigger: '',
															action: ''
														};
													}
													editScope.push(taskId);
													editScope = editScope.sort((a, b) => {
														if (a === 'new') return 1;
														if (b === 'new') return -1;
														return a.localeCompare(b);
													});
												}
											}}
										>
											<div
												class={`${tasksWithMissingFields.includes(taskId) ? 'text-my-pink' : ''} flex w-full items-center justify-between`}
											>
												{#if taskId !== 'new'}
													{#if isTaskEmpty(editedTasks[taskId])}
														<p class="mr-2">
															Task: {data.originalTasks.tasks[taskId].name} (deleted)
														</p>
													{:else if editedTasks[taskId].name.trim() === ''}
														<p class="mr-2">Task: (no task name entered)</p>
													{:else}
														<p class="mr-2">Task: {editedTasks[taskId].name.trim()}</p>
													{/if}
												{:else if !('new' in editedTasks)}
													<p class="mr-2">Add New Task</p>
												{:else if isTaskEmpty(editedTasks['new'])}
													<p class="mr-2">New Task: (no content entered)</p>
												{:else if editedTasks['new'].name.trim() === ''}
													<p class="mr-2">New Task: (no task name entered)</p>
												{:else}
													<p class="mr-2">New Task: {editedTasks[taskId].name.trim()}</p>
												{/if}
												{#if editScope.includes(taskId)}
													<EyeIcon />
												{:else}
													<EyeClosedIcon />
												{/if}
											</div>
										</DropdownMenu.Item>
									{/if}
								{/each}
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{/if}
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
									// if (resVote.ok) {
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
									// }
									const resVote = await fetch(
										`/api/guilds/${page.params.guildId}/proposals/${data.proposal.id}`,
										{
											method: 'PATCH',
											body: JSON.stringify({
												action: 'voteProposal',
												vote: value,
												proposalEditId: data.edits[0].id
											}),
											headers: {
												'Content-Type': 'application/json'
											}
										}
									);
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
									class={`${buttonVariants({ variant: 'secondary' })} w-24 justify-start hover:cursor-pointer`}
									disabled={upvotes.length < data.guild.deploy_threshold}
								>
									<LandPlotIcon class="size-4" />
									Deploy
								</AlertDialog.Trigger>
								<AlertDialog.Content class="flex max-h-[80vh] flex-col">
									<AlertDialog.Header>
										<AlertDialog.Title>
											<h2 class="text-left">Are you sure you want to deploy this proposed edit?</h2>
										</AlertDialog.Title>
									</AlertDialog.Header>
									<div class="min-h-0 flex-1 overflow-y-auto">
										<AlertDialog.Description class="text-foreground text-sm md:text-base">
											Review the changes compared to the original tasks and latest tasks below to
											ensure they are correct. Once deployed, the bot will behave according to the
											proposed edit in your Discord server.
										</AlertDialog.Description>
										<Accordion.Root type="single" class="my-2">
											<Accordion.Item value="item-1">
												<Accordion.Trigger class="text-muted-foreground py-1">
													<div class="flex items-center">
														<InfoIcon class="mr-2 size-4" />
														<p>What's the difference between the original and latest tasks?</p>
													</div>
												</Accordion.Trigger>
												<Accordion.Content class="text-muted-foreground pl-6">
													The original task refers to the version in place when this proposal was
													first initiated, while the latest task is the currently deployed version
													that determines how the bot behaves on Discord now. They might be
													different if another proposal has been deployed in the time between the
													initiation of this proposal and now.
												</Accordion.Content>
											</Accordion.Item>
											<Accordion.Item value="item-2">
												<Accordion.Trigger class="text-muted-foreground py-1">
													<div class="flex items-center">
														<InfoIcon class="mr-2 size-4" />
														<p>Tasks that have not been edited are not shown.</p>
													</div>
												</Accordion.Trigger>
												<Accordion.Content class="text-muted-foreground pl-6">
													The following list only includes tasks that are edited by this proposal.
													Any new tasks introduced in the latest tasks that are not part of this
													proposal are also not shown.
												</Accordion.Content>
											</Accordion.Item>
										</Accordion.Root>
										<Tabs.Root value="original" class="mt-1">
											<Tabs.List class="w-full">
												<Tabs.Trigger value="original">
													<span class="hidden md:inline">Compare with</span>Original Tasks
												</Tabs.Trigger>
												<Tabs.Trigger value="latest">
													<span class="hidden md:inline">Compare with</span>Latest Tasks
												</Tabs.Trigger>
											</Tabs.List>
											<Tabs.Content value="original">
												<div class="mt-2 flex flex-col gap-6 text-sm">
													{#each [...Object.keys(data.originalTasks.tasks).sort(), ...('new' in data.edits[0].tasks ? ['new'] : [])] as taskId (taskId)}
														{#if !_.isEqualWith(data.originalTasks.tasks[taskId], data.edits[0].tasks[taskId], trimTaskCustomizer)}
															<TaskDiffSection
																oldTask={data.originalTasks.tasks[taskId]}
																newTask={data.edits[0].tasks[taskId]}
															/>
														{/if}
													{/each}
												</div>
											</Tabs.Content>
											<Tabs.Content value="latest">
												{#if _.isEqualWith(data.originalTasks.tasks, _.pick(data.latestTasks.tasks, Object.keys(data.originalTasks.tasks)), trimTaskCustomizer)}
													<Alert.Root class="border-primary text-primary">
														<SmileIcon />
														<Alert.Description class="text-primary">
															The original tasks in this proposal are identical to the latest tasks{#if _.difference(Object.keys(data.latestTasks.tasks), Object.keys(data.originalTasks.tasks)).length > 0}
																(excluding any new tasks that were added recently and are not part
																of this proposal){/if}. There's no need to review them again if
															you've already done so.
														</Alert.Description>
													</Alert.Root>
												{/if}
												<div class="mt-2 flex flex-col gap-6 text-sm">
													<!-- Ignore new tasks introduced in the latest tasks that are not part of this
													proposal -->
													{#each [...Object.keys(data.originalTasks.tasks).sort(), ...('new' in data.edits[0].tasks ? ['new'] : [])] as taskId (taskId)}
														{#if !_.isEqualWith(data.latestTasks.tasks[taskId], data.edits[0].tasks[taskId], trimTaskCustomizer) && !_.isEqualWith(data.originalTasks.tasks[taskId], data.edits[0].tasks[taskId], trimTaskCustomizer)}
															<TaskDiffSection
																oldTask={data.latestTasks.tasks[taskId]}
																newTask={data.edits[0].tasks[taskId]}
															/>
														{/if}
													{/each}
												</div>
											</Tabs.Content>
										</Tabs.Root>
									</div>
									<AlertDialog.Footer>
										<AlertDialog.Cancel disabled={deployingProposal} class="hover:cursor-pointer"
											>Cancel</AlertDialog.Cancel
										>
										<AlertDialog.Action
											class="hover:cursor-pointer"
											disabled={upvotes.length < data.guild.deploy_threshold || deployingProposal}
											onclick={async () => {
												await deployProposal();
											}}
										>
											{#if deployingProposal}
												<LoaderCircleIcon class="size-4 animate-spin" />
											{/if}
											Deploy
										</AlertDialog.Action>
									</AlertDialog.Footer>
								</AlertDialog.Content>
							</AlertDialog.Root>
						</div>
					{/if}
				{:else}
					{#if tasksWithMissingFields.length > 0}
						<Alert.Root class="border-my-pink text-my-pink my-1">
							<TriangleAlertIcon />
							<Alert.Description class="text-my-pink">
								<h4>Task fields must not be left empty.</h4>
								<ul class="list-inside list-disc text-sm">
									{#each tasksWithMissingFields as taskId (taskId)}
										{#if taskId === 'new'}
											<li>
												New Task: {editedTasks[taskId].name.trim() === ''
													? '(no task name entered)'
													: editedTasks[taskId].name}
											</li>
										{:else}
											<li>
												Task: {editedTasks[taskId].name.trim() === ''
													? '(no task name entered)'
													: editedTasks[taskId].name}
											</li>
										{/if}
									{/each}
								</ul>
							</Alert.Description>
						</Alert.Root>
					{/if}
					<div class="mt-2 flex items-center justify-between">
						<!-- Test Button -->
						<Button
							class="hover:cursor-pointer"
							disabled={(data.edits.length > 0
								? _.isEqualWith(
										editedTasksWithoutEmptyNewTask,
										data.edits[0].tasks,
										trimTaskCustomizer
									)
								: _.isEqualWith(
										editedTasksWithoutEmptyNewTask,
										data.originalTasks.tasks,
										trimTaskCustomizer
									)) ||
								_.isEqualWith(editedTasksWithoutEmptyNewTask, testedTasks, trimTaskCustomizer) ||
								runningTest ||
								generatingCase ||
								savingEdit ||
								tasksWithMissingFields.length > 0}
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
							<!-- Reset Button -->
							<Button
								class="hover:cursor-pointer"
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
							<!-- Diff Button -->
							<Dialog.Root>
								<Dialog.Trigger
									class={`${buttonVariants({ variant: 'secondary' })} hover:cursor-pointer`}
									disabled={(data.edits.length > 0
										? _.isEqualWith(
												editedTasksWithoutEmptyNewTask,
												data.edits[0].tasks,
												trimTaskCustomizer
											)
										: _.isEqualWith(
												editedTasksWithoutEmptyNewTask,
												data.originalTasks.tasks,
												trimTaskCustomizer
											)) ||
										runningTest ||
										generatingCase ||
										savingEdit}
								>
									<DiffIcon />
									Diff
								</Dialog.Trigger>
								<Dialog.Content class="flex max-h-[80vh] flex-col">
									<Dialog.Header class="text-left">
										<Dialog.Title><h2>Compare the differences</h2></Dialog.Title>
										<Dialog.Description class="text-foreground text-sm md:text-base">
											The highlighted and strikethrough text indicates the edits you made, either to
											the most recent proposed edit or to the original tasks in place when this
											proposal was first initiated. Tasks that have not been edited are not shown.
										</Dialog.Description>
									</Dialog.Header>
									<div class="min-h-0 flex-1 overflow-y-auto">
										<Tabs.Root value="edit">
											<Tabs.List class="w-full">
												<Tabs.Trigger value="edit">
													<span class="hidden md:inline">Compare with</span>Latest Edit
												</Tabs.Trigger>
												<Tabs.Trigger value="original">
													<span class="hidden md:inline">Compare with</span>Original Tasks
												</Tabs.Trigger>
											</Tabs.List>
											<Tabs.Content value="edit">
												{#if data.edits.length > 0}
													<div class="mt-2 flex flex-col gap-6 text-sm">
														{#each [...Object.keys(data.originalTasks.tasks).sort(), ...('new' in editedTasks ? ['new'] : [])] as taskId (taskId)}
															{#if !_.isEqualWith(data.edits[0].tasks[taskId], editedTasks[taskId], trimTaskCustomizer)}
																<TaskDiffSection
																	oldTask={data.edits[0].tasks[taskId]}
																	newTask={editedTasks[taskId]}
																/>
															{/if}
														{/each}
													</div>
												{:else}
													<p class="text-muted-foreground text-sm">
														No edits have been proposed yet.
													</p>
												{/if}
											</Tabs.Content>
											<Tabs.Content value="original">
												<div class="mt-2 flex flex-col gap-6 text-sm">
													{#each [...Object.keys(data.originalTasks.tasks).sort(), ...('new' in editedTasks ? ['new'] : [])] as taskId (taskId)}
														{#if !_.isEqualWith(data.originalTasks.tasks[taskId], editedTasks[taskId], trimTaskCustomizer)}
															<TaskDiffSection
																oldTask={data.originalTasks.tasks[taskId]}
																newTask={editedTasks[taskId]}
															/>
														{/if}
													{/each}
												</div>
											</Tabs.Content>
										</Tabs.Root>
									</div>
								</Dialog.Content>
							</Dialog.Root>
							<!-- Save Button -->
							<AlertDialog.Root>
								<AlertDialog.Trigger
									class={`${buttonVariants({ variant: 'secondary' })} hover:cursor-pointer`}
									disabled={(data.edits.length > 0
										? _.isEqualWith(editedTasks, data.edits[0].tasks, trimTaskCustomizer)
										: _.isEqualWith(editedTasks, data.originalTasks.tasks, trimTaskCustomizer)) ||
										_.isNil(testedTasks) ||
										!_.isEqualWith(testedTasks, editedTasks, trimTaskCustomizer) ||
										runningTest ||
										generatingCase ||
										savingEdit}
								>
									<SaveIcon class="size-4" />Save
								</AlertDialog.Trigger>
								<AlertDialog.Content class="flex max-h-[80vh] flex-col">
									<AlertDialog.Header>
										<AlertDialog.Title>
											<h2 class="text-left">Are you sure you want to save this edit?</h2>
										</AlertDialog.Title>
									</AlertDialog.Header>
									<div class="min-h-0 flex-1 overflow-y-auto">
										<AlertDialog.Description class="text-foreground text-sm md:text-base">
											Review the changes compared to the latest edit and the original tasks below to
											ensure they are correct. Once saved, your edit will replace the most recent
											proposed edit and become the new version that others can vote to approve for
											deployment.
										</AlertDialog.Description>
										<Tabs.Root value="edit" class="mt-4">
											<Tabs.List class="w-full">
												<Tabs.Trigger value="edit">
													<span class="hidden md:inline">Compare with</span>Latest Edit
												</Tabs.Trigger>
												<Tabs.Trigger value="original">
													<span class="hidden md:inline">Compare with</span>Original Tasks
												</Tabs.Trigger>
											</Tabs.List>
											<Tabs.Content value="edit">
												{#if data.edits.length > 0}
													<div class="mt-2 flex flex-col gap-6 text-sm">
														{#each [...Object.keys(data.originalTasks.tasks).sort(), ...('new' in editedTasks ? ['new'] : [])] as taskId (taskId)}
															{#if !_.isEqualWith(data.edits[0].tasks[taskId], editedTasks[taskId], trimTaskCustomizer)}
																<TaskDiffSection
																	oldTask={data.edits[0].tasks[taskId]}
																	newTask={editedTasks[taskId]}
																/>
															{/if}
														{/each}
													</div>
												{:else}
													<p class="text-muted-foreground text-sm">
														No edits have been proposed yet.
													</p>
												{/if}
											</Tabs.Content>
											<Tabs.Content value="original">
												<div class="mt-2 flex flex-col gap-6 text-sm">
													{#each [...Object.keys(data.originalTasks.tasks).sort(), ...('new' in editedTasks ? ['new'] : [])] as taskId (taskId)}
														{#if !_.isEqualWith(data.originalTasks.tasks[taskId], editedTasks[taskId], trimTaskCustomizer)}
															<TaskDiffSection
																oldTask={data.originalTasks.tasks[taskId]}
																newTask={editedTasks[taskId]}
															/>
														{/if}
													{/each}
												</div>
											</Tabs.Content>
										</Tabs.Root>
										<div class="mt-6 flex flex-col gap-2">
											<div class="mb-1">
												<h4>Questionnaire: What motivated you to make this edit?</h4>
												<p>I am making this edit to...</p>
											</div>
											{#each editQuestionnaireItems as item (item.id)}
												<div class="flex items-center gap-3">
													<Checkbox
														id={item.id}
														value={item.id}
														onCheckedChange={(v) => {
															if (v) {
																editQuestionnaire.push(item.id);
															} else {
																editQuestionnaire = editQuestionnaire.filter(
																	(id) => id !== item.id
																);
															}
														}}
													/>
													<Label for={item.id}>{item.label}</Label>
												</div>
											{/each}
										</div>
									</div>
									<AlertDialog.Footer>
										<AlertDialog.Cancel disabled={savingEdit} class="hover:cursor-pointer"
											>Cancel</AlertDialog.Cancel
										>
										<AlertDialog.Action
											class="hover:cursor-pointer"
											disabled={savingEdit || editQuestionnaire.length === 0}
											onclick={async () => {
												await saveProposal();
											}}
										>
											{#if savingEdit}
												<LoaderCircleIcon class="size-4 animate-spin" />
											{/if}
											Save
										</AlertDialog.Action>
									</AlertDialog.Footer>
								</AlertDialog.Content>
							</AlertDialog.Root>
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
							class="w-24 justify-start hover:cursor-pointer"
							onclick={() => (viewHistory = true)}
						>
							<BookOpenIcon class="mr-2 size-4" />View
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
														latest
													{:else}
														view
													{/if}
												</Dialog.Trigger>
												<Dialog.Content class="flex max-h-[80vh] flex-col">
													<Dialog.Header class="text-left">
														<Dialog.Title><h2>Edit made by {edit.editor}</h2></Dialog.Title>
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
														<Dialog.Description class="text-foreground text-sm md:text-base">
															The highlighted and strikethrough text indicates the edits you made,
															either to the previous edit or to the original tasks in place when
															this proposal was first initiated. Tasks that have not been edited are
															not shown.
														</Dialog.Description>
													</Dialog.Header>
													<div class="min-h-0 flex-1 overflow-y-auto">
														<Tabs.Root value="previous">
															<Tabs.List class="w-full">
																<Tabs.Trigger value="previous">
																	<span class="hidden md:inline">Compare with</span>Previous Edit
																</Tabs.Trigger>
																<Tabs.Trigger value="original">
																	<span class="hidden md:inline">Compare with</span>Original Tasks
																</Tabs.Trigger>
															</Tabs.List>
															<Tabs.Content value="previous">
																{#if i === data.edits.length - 1}
																	<p class="text-muted-foreground text-sm">
																		This is the very first edit. There are no previous edits.
																	</p>
																{:else}
																	<div class="mt-2 flex flex-col gap-6 text-sm">
																		{#each [...Object.keys(_.omit( data.edits[i + 1].tasks, ['new'] )).sort(), ...('new' in edit.tasks || 'new' in data.edits[i + 1].tasks ? ['new'] : [])] as taskId (taskId)}
																			{#if !_.isEqualWith(data.edits[i + 1].tasks[taskId], edit.tasks[taskId], trimTaskCustomizer)}
																				<TaskDiffSection
																					oldTask={data.edits[i + 1].tasks[taskId]}
																					newTask={edit.tasks[taskId]}
																				/>
																			{/if}
																		{/each}
																	</div>
																{/if}
															</Tabs.Content>
															<Tabs.Content value="original">
																<div class="mt-2 flex flex-col gap-6 text-sm">
																	{#each [...Object.keys(data.originalTasks.tasks).sort(), ...('new' in edit.tasks ? ['new'] : [])] as taskId (taskId)}
																		{#if !_.isEqualWith(data.originalTasks.tasks[taskId], edit.tasks[taskId], trimTaskCustomizer)}
																			<TaskDiffSection
																				oldTask={data.originalTasks.tasks[taskId]}
																				newTask={edit.tasks[taskId]}
																			/>
																		{/if}
																	{/each}
																</div>
															</Tabs.Content>
														</Tabs.Root>
													</div>
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
							it's not. If you notice any issues, try editing the tasks to address them. If the
							bot's responses are already satisfactory, feel free to upvote the proposed edit to
							support its deployment.
						</Popover.Content>
					</Popover.Root>
				</div>
				{#if (data.edits.length > 0 ? !_.isEqualWith(editedTasksWithoutEmptyNewTask, data.edits[0].tasks, trimTaskCustomizer) : !_.isEqualWith(editedTasks, data.originalTasks.tasks, trimTaskCustomizer)) && !_.isEqualWith(editedTasksWithoutEmptyNewTask, testedTasks, trimTaskCustomizer)}
					<Alert.Root class="border-primary text-primary mt-1">
						<TriangleAlertIcon />
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
								These cases are saved collaboratively by everyone to evaluate how the bot behaves
								based on the proposed edits. You can give a thumbs up or thumbs down on each case to
								indicate whether you think the bot's response is good or bad. You can also see how
								others have reacted to each case. The purpose of these cases is to help you decide
								whether to upvote or downvote the latest proposed edit for deployment.
							</Popover.Content>
						</Popover.Root>
					</div>
					{#if testCases.length === 0}
						<div class="flex flex-1 items-center justify-center rounded-md border-1">
							<p class="text-muted-foreground">No cases have been saved to the test suite.</p>
						</div>
					{:else}
						<div class="flex-1">
							<Carousel.Root
								opts={{
									align: 'start'
								}}
								class="mx-auto h-full w-4/5 max-w-screen md:w-5/6"
								setApi={(emblaApi) => (api = emblaApi)}
							>
								<Carousel.Content class="h-full">
									{#each testCases as testCase, i (`${testCase.id}-${data.edits.length}`)}
										<Carousel.Item class="xl:basis-1/2">
											<CaseCard
												bind:this={testCaseRefs[i]}
												{..._.omit(testCase, ['generatedId'])}
												testCaseBadge={true}
												tasks={editedTasks}
												edits={data.edits}
												originalTasks={data.originalTasks.tasks}
												taskHistoryId={data.proposal.taskHistoryId}
												user={data.user}
												removeCaseFunction={data.proposal.open ? removeCaseFunction : undefined}
											/>
										</Carousel.Item>
									{/each}
								</Carousel.Content>
								<Carousel.Previous />
								<Carousel.Next />
							</Carousel.Root>
						</div>
					{/if}
				</div>
				<div class="flex flex-col p-4 md:h-1/2">
					<div class="flex items-center justify-between pb-2">
						<div class="flex items-center gap-2">
							<h4>
								Generated test cases ( {#if generatingCase}
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
									These cases are automatically generated to help identify potential issues with the
									most recent edit made to the proposal. When you are editing, these cases are
									regenerated based on your current edit. You can review the generated test cases
									and save any relevant ones as saved test cases, which will then be visible to
									anyone visiting this proposal page for collaborative review. Please note that
									generated test cases are temporary and will only become visible to others if you
									explicitly save them as test cases.
								</Popover.Content>
							</Popover.Root>
						</div>
						<Button
							variant="secondary"
							class="hover:cursor-pointer"
							disabled={generatingCase ||
								(data.edits.length === 0 &&
									_.isEqualWith(
										editedTasksWithoutEmptyNewTask,
										data.originalTasks.tasks,
										trimTaskCustomizer
									)) ||
								tasksWithMissingFields.length > 0 ||
								savingEdit}
							hidden={!data.proposal.open}
							onclick={async () => {
								await generateCases($state.snapshot(editedTasksWithoutEmptyNewTask));
							}}
						>
							<FolderCogIcon class="size-4" />
							Generate
						</Button>
					</div>
					{#if generatingCase}
						<div class="flex flex-1 flex-col items-center justify-center rounded-md border-1">
							<CogIcon class="stroke-muted-foreground mr-2 size-10 animate-spin" />
							<p class="text-muted-foreground mt-2">Generating cases ...</p>
							<p class="text-muted-foreground text-sm">
								This typically takes 10-20 seconds. Please wait.
							</p>
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
							<p class="text-muted-foreground">No cases have been generated.</p>
						</div>
					{/if}
					<Carousel.Root
						opts={{
							align: 'start'
						}}
						class="mx-auto min-h-0 w-4/5 max-w-screen md:w-5/6"
					>
						<Carousel.Content>
							{#each generatedCases as generatedCase, i (generatedCase.tmpId)}
								<Carousel.Item class="xl:basis-1/2">
									<CaseCard
										bind:this={generatedCaseRefs[i]}
										channel={generatedCase.channel}
										userMessage={generatedCase.userMessage}
										tasks={editedTasks}
										checkingBadge={generatedCase.rating >= 3 ? true : false}
										user={data.user}
										generatedId={generatedCase.tmpId}
										issue={generatedCase.issue}
										{addGeneratedCaseFunction}
									/>
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
						<h4>Enter other cases manually</h4>
						<ChevronUpIcon class="mr-4 size-4" />
					</Sheet.Trigger>
					<Sheet.Content
						class="ml-auto"
						side="bottom"
						style="width: {sheetWidth}px; max-width: 100vw;"
					>
						<Sheet.Header>
							<Sheet.Title><h3>Enter other cases manually</h3></Sheet.Title>
							<Sheet.Description>
								{#if !showCase}
									If you want to enter a new case, simply leave the case ID field blank. When the
									case ID field is not empty, the system will use the entered ID to search for an
									existing case.
								{/if}
								{#if showCase && !showAddCaseSuccess}
									{#if data.edits.length === 0}
										{#if _.isEqualWith(editedTasksWithoutEmptyNewTask, data.originalTasks.tasks, trimTaskCustomizer)}
											This response is generated based on the bot's original tasks prior to any
											proposed edits.
										{:else}
											This response is generated based on your current, unsaved edit.
										{/if}
									{:else if _.isEqualWith(editedTasksWithoutEmptyNewTask, data.edits[0].tasks, trimTaskCustomizer)}
										This response is generated based on the latest edit to the bot.
									{:else}
										This response is generated based on your current, unsaved edit.
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
								<Label class="text-right text-base"><h4>Check an existing case</h4></Label>
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
								<Label class="text-right text-base"><h4>Check a new case</h4></Label>
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
									<ToggleGroup.Item
										value="thumbsUp"
										class="data-[state=on]:bg-my-green px-3 hover:cursor-pointer"
									>
										<ThumbsUpIcon class="size-4" />good response
									</ToggleGroup.Item>
									<ToggleGroup.Item
										value="thumbsDown"
										class="data-[state=on]:bg-my-pink px-3 hover:cursor-pointer"
									>
										<ThumbsDownIcon class="size-4" />bad response
									</ToggleGroup.Item>
								</ToggleGroup.Root>
							</div>
						{/if}
						<Sheet.Footer>
							<div class="flex items-center justify-between">
								<Button
									class="hover:cursor-pointer"
									disabled={showCase ||
										checkingCaseManually ||
										(!enteredCaseId.trim() && !enteredUserMessage.trim() && !selectedChannel) ||
										(enteredCaseId.trim() === '' &&
											(!enteredUserMessage.trim() || !selectedChannel)) ||
										runningTest ||
										savingEdit ||
										tasksWithMissingFields.length > 0}
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
													const res = await fetch(
														`/api/guilds/${page.params.guildId}/cases/${enteredCaseId}`
													);
													if (res.ok) {
														fetchCase = await res.json();
														if (fetchCase) {
															if (
																data.edits.length > 0
																	? _.isEqualWith(
																			editedTasksWithoutEmptyNewTask,
																			data.edits[0].tasks,
																			trimTaskCustomizer
																		)
																	: _.isEqualWith(
																			editedTasksWithoutEmptyNewTask,
																			data.originalTasks.tasks,
																			trimTaskCustomizer
																		)
															) {
																let botResponses = [];
																try {
																	const resBotResponses = await fetch(
																		`/api/guilds/${page.params.guildId}/cases/${fetchCase.id}/botResponses?taskHistoryId=${data.proposal.taskHistoryId}&proposalId=${data.proposal.id}`,
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
																		`/api/guilds/${page.params.guildId}/cases/${fetchCase.id}/botResponses`,
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
																		tasks: editedTasksWithoutEmptyNewTask,
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
													showCaseErrorMessage = 'An error occurred. Please try again later.';
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
														? _.isEqualWith(
																editedTasksWithoutEmptyNewTask,
																data.edits[0].tasks,
																trimTaskCustomizer
															)
														: _.isEqualWith(
																editedTasksWithoutEmptyNewTask,
																data.originalTasks.tasks,
																trimTaskCustomizer
															)
												) {
													tmpTasks =
														data.edits.length > 0 ? data.edits[0].tasks : data.originalTasks.tasks;
												} else {
													tmpTasks = editedTasksWithoutEmptyNewTask;
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
										class="hover:cursor-pointer"
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
										class="hover:cursor-pointer"
										variant="secondary"
										disabled={!showCase || checkingCaseManually || showAddCaseSuccess || addingCase}
										onclick={async () => {
											addingCase = true;

											if (!fetchCase) {
												await createAndAddNewTestCase(
													'',
													editedTasksWithoutEmptyNewTask,
													displayedChannel,
													displayedUserMessage,
													displayedTaskId,
													displayedBotResponse,
													displayedThumbsUp,
													displayedThumbsDown,
													''
												);
												showAddCaseSuccess = true;
											} else {
												const res = await fetch(
													`/api/guilds/${page.params.guildId}/proposals/${data.proposal.id}`,
													{
														method: 'PATCH',
														body: JSON.stringify({
															action: 'addCase',
															caseId: fetchCase.id
														}),
														headers: {
															'Content-Type': 'application/json'
														}
													}
												);
												if (res.ok) {
													testCases.push(fetchCase);
													if (
														data.edits.length > 0
															? !_.isEqualWith(
																	editedTasksWithoutEmptyNewTask,
																	data.edits[0].tasks,
																	trimTaskCustomizer
																)
															: !_.isEqualWith(
																	editedTasksWithoutEmptyNewTask,
																	data.originalTasks.tasks,
																	trimTaskCustomizer
																)
													) {
														await tick();
														const ref = testCaseRefs[testCaseRefs.length - 1];
														ref.setTmpBotResponse(
															$state.snapshot(editedTasksWithoutEmptyNewTask),
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
