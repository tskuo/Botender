<script lang="ts">
	// import lodash for object comparison
	import _ from 'lodash';

	// import ui components
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';

	// import lucide icons
	import HashIcon from '@lucide/svelte/icons/hash';
	import UserIcon from '@lucide/svelte/icons/user';
	import UserCheckIcon from '@lucide/svelte/icons/user-check';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import BotIcon from '@lucide/svelte/icons/bot';
	import BotOffIcon from '@lucide/svelte/icons/bot-off';
	import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
	import ThumbsDownIcon from '@lucide/svelte/icons/thumbs-down';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import BotMessageSquareIcon from '@lucide/svelte/icons/bot-message-square';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import FolderPlusIcon from '@lucide/svelte/icons/folder-plus';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';

	// import svelte features
	import { onMount } from 'svelte';

	// import svelte stores
	import { page } from '$app/state';
	import { trimTaskCustomizer, isTaskEmpty } from '$lib/tasks';

	let {
		id = '',
		channel = '',
		createdAt = new Date(),
		realUserMessage = false,
		userMessage = '',
		taskHistoryId = '',
		edits = [],
		originalTasks = {},
		tasks = {},
		testCaseBadge = false,
		checkingBadge = false,
		user,
		generatedId = undefined,
		removeCaseFunction = undefined,
		addGeneratedCaseFunction = () => {}
	} = $props();

	// temporary bot response based on unsaved edits
	let tmpBotResponse = $state<BotResponse | undefined>(undefined);
	let tmpTasks = $state<Tasks | undefined>(undefined);
	let loadingBotResponse = $state(true);
	let botResponses = $state([]);
	let removing = $state(false);
	let adding = $state(false);
	$effect(() => {
		if (tmpTasks && 'new' in tmpTasks && isTaskEmpty(tmpTasks['new'])) {
			console.log('tmpTasks has an empty new task:', id, tmpTasks);
		}
	});

	const textLengthCap = 100;

	export async function runTestForCase(editedTasks: Tasks) {
		loadingBotResponse = true;
		if (!_.isEqualWith(editedTasks, tmpTasks, trimTaskCustomizer)) {
			const resBot = await fetch('/api/bot', {
				method: 'POST',
				body: JSON.stringify({
					channel: channel,
					userMessage: userMessage,
					tasks: editedTasks,
					soures: 'proposal'
				}),
				headers: {
					'Content-Type': 'application/json'
				}
			});
			if (resBot.ok) {
				const { taskId, botResponse } = await resBot.json();
				tmpTasks = editedTasks;
				tmpBotResponse = {
					id: 'tmp',
					botResponse: botResponse,
					createAt: '',
					proposalEditId: 'tmp',
					proposalId: page.params.proposalId,
					taskHistoryId: '',
					thumbsDown: [],
					thumbsUp: [],
					triggeredTask: taskId
				};
			}
		}
		loadingBotResponse = false;
	}

	export function resetTestForCase() {
		tmpTasks = undefined;
		tmpBotResponse = undefined;
	}

	export function setTmpBotResponse(
		editedTasks: Tasks,
		taskId: string,
		botResponse: string,
		thumbsUp: string[],
		thumbsDown: string[]
	) {
		tmpTasks = editedTasks;
		tmpBotResponse = {
			id: 'tmp',
			botResponse: botResponse,
			createAt: '',
			proposalEditId: 'tmp',
			proposalId: page.params.proposalId,
			taskHistoryId: '',
			thumbsDown: thumbsDown,
			thumbsUp: thumbsUp,
			triggeredTask: taskId
		};
	}

	export async function saveTmpBotResponse(proposalId: string, proposalEditId: string) {
		if (tmpBotResponse) {
			const resBotResponse = await fetch(
				`/api/guilds/${page.params.guildId}/cases/${id}/botResponses`,
				{
					method: 'POST',
					body: JSON.stringify({
						botResponse: tmpBotResponse.botResponse,
						proposalEditId: proposalEditId,
						proposalId: proposalId,
						taskHistoryId: '',
						thumbsDown: tmpBotResponse.thumbsDown,
						thumbsUp: tmpBotResponse.thumbsUp,
						triggeredTaskId: tmpBotResponse.triggeredTask
					}),
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);
			resetTestForCase();
		}
	}

	const loadBotResponses = async () => {
		if (generatedId !== undefined) {
			botResponses = [];
		} else if (page.url.pathname.includes('/cases')) {
			const res = await fetch(
				`/api/guilds/${page.params.guildId}/cases/${id}/botResponses?taskHistoryId=${taskHistoryId}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);
			if (!res.ok) {
				console.error(`Failed to fetch the latest bot response of case #${id}`, res.statusText);
				return;
			}
			const data = await res.json();
			botResponses = data.botResponses;
		} else if (page.url.pathname.includes('/proposals/')) {
			const proposalId = page.params.proposalId;
			const res = await fetch(
				`/api/guilds/${page.params.guildId}/cases/${id}/botResponses?taskHistoryId=${taskHistoryId}&proposalId=${proposalId}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);
			if (!res.ok) {
				console.error(`Failed to fetch the latest bot response of case #${id}`, res.statusText);
				return;
			}
			const data = await res.json();
			botResponses = data.botResponses;
		}

		loadingBotResponse = false;
	};

	const generateBotResponse = async (
		tasks: Tasks,
		proposalEditId = '',
		proposalId = '',
		taskHistoryId = ''
	) => {
		loadingBotResponse = true;
		const resBot = await fetch('/api/bot', {
			method: 'POST',
			body: JSON.stringify({
				channel: channel,
				userMessage: userMessage,
				tasks: tasks,
				soures: 'proposal'
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});
		const { taskId, botResponse } = await resBot.json();

		const resBotResponse = await fetch(
			`/api/guilds/${page.params.guildId}/cases/${id}/botResponses`,
			{
				method: 'POST',
				body: JSON.stringify({
					botResponse: botResponse,
					proposalEditId: proposalEditId,
					proposalId: proposalId,
					taskHistoryId: taskHistoryId,
					triggeredTaskId: taskId
				}),
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);

		if (resBotResponse.ok) {
			loadBotResponses();
		}
	};

	onMount(async () => {
		loadBotResponses();
	});
</script>

{#snippet botResponseSection(botResponse: BotResponse, renderTasks: Tasks = tasks, lengthCap = 0)}
	<div class="flex w-full items-center">
		<WrenchIcon class="mr-2 size-4" />
		<h4 class="font-medium">
			{botResponse.triggeredTask in renderTasks
				? renderTasks[botResponse.triggeredTask].name
				: 'No Task is Triggered'}
		</h4>
	</div>
	{#if botResponse.triggeredTask !== '0'}
		<div class="mt-2 flex w-full">
			{#if botResponse.botResponse !== ''}
				<BotIcon class="mt-1 mr-2 size-4 flex-none" />
				{#if lengthCap !== 0}
					{#if botResponse.botResponse.length <= lengthCap}
						{botResponse.botResponse}
					{:else}
						{botResponse.botResponse.substring(0, lengthCap)}...
					{/if}
				{:else}
					<p>{botResponse.botResponse}</p>
				{/if}
			{:else if botResponse.botResponse === '' && botResponse.triggeredTask !== '0'}
				<BotOffIcon class="mr-2 size-4 flex-none" />
				<p>The bot chose not to respond.</p>
			{/if}
		</div>
	{/if}
{/snippet}

{#snippet thumbsUpDownButtons(botResponse: BotResponse)}
	<ToggleGroup.Root
		type="single"
		class="mt-6 w-full"
		variant="outline"
		value={botResponse.thumbsUp.includes(user.userId)
			? 'thumbsUp'
			: botResponse.thumbsDown.includes(user.userId)
				? 'thumbsDown'
				: undefined}
		onValueChange={async (value) => {
			if (botResponse.id === 'tmp') {
				if (value === 'thumbsUp') {
					botResponse.thumbsUp = [user.userId];
					botResponse.thumbsDown = [];
				} else if (value === 'thumbsDown') {
					botResponse.thumbsUp = [];
					botResponse.thumbsDown = [user.userId];
				} else {
					botResponse.thumbsUp = [];
					botResponse.thumbsDown = [];
				}
			} else {
				const resBotResponse = await fetch(
					`/api/guilds/${page.params.guildId}/cases/${id}/botResponses/${botResponse.id}`,
					{
						method: 'PATCH',
						body: JSON.stringify({
							value: value
						}),
						headers: {
							'Content-Type': 'application/json'
						}
					}
				);

				if (resBotResponse.ok) {
					loadBotResponses();
				}
			}
		}}
	>
		<ToggleGroup.Item value="thumbsUp" class="data-[state=on]:bg-my-green hover:cursor-pointer">
			<ThumbsUpIcon class="size-4" />good response
		</ToggleGroup.Item>
		<ToggleGroup.Item value="thumbsDown" class="data-[state=on]:bg-my-pink hover:cursor-pointer">
			<ThumbsDownIcon class="size-4" />bad response
		</ToggleGroup.Item>
	</ToggleGroup.Root>
{/snippet}

{#snippet thumbsUpDownIcons(botResponse: BotResponse)}
	<div class="flex w-full items-center justify-around">
		<div
			class="flex items-center {botResponse.thumbsUp.includes(user.userId) ? 'text-my-green' : ''}"
		>
			<ThumbsUpIcon class="mr-2 size-5" />
			<p>{botResponse.thumbsUp.length}</p>
		</div>
		<div
			class="flex items-center {botResponse.thumbsDown.includes(user.userId) ? 'text-my-pink' : ''}"
		>
			<ThumbsDownIcon class="mr-2 size-5" />
			<p>{botResponse.thumbsDown.length}</p>
		</div>
	</div>
{/snippet}

<Dialog.Root>
	<Dialog.Trigger class="hover:cursor-pointer">
		<Card.Root class="hover:bg-muted/50 h-full w-full gap-3 text-left text-sm">
			<Card.Header>
				<!-- <Card.Title></Card.Title> -->
				<Card.Description class="flex justify-between">
					{#if checkingBadge}
						<Badge class="bg-discord-yellow text-black">worth checking</Badge>
					{/if}
					{#if testCaseBadge}
						<Badge>test case</Badge>
					{/if}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="mb-2 flex items-center">
					<HashIcon class="mr-2 size-4" />
					<h4 class="font-medium">
						{channel.startsWith('#') ? channel.slice(1) : channel}
					</h4>
				</div>
				<div class="mb-4 flex">
					{#if realUserMessage}
						<UserCheckIcon class="mt-1 mr-2 size-4 flex-none" />
					{:else}
						<UserIcon class="mt-1 mr-2 size-4 flex-none" />
					{/if}
					<p>
						{#if userMessage.length <= textLengthCap}
							{userMessage}
						{:else}
							{userMessage.substring(0, textLengthCap)}...
						{/if}
					</p>
				</div>
				{#if loadingBotResponse}
					<div class="mb-2 flex items-center">
						<LoaderIcon class="mr-2 size-4 animate-spin" />
						<p>Loading bot response...</p>
					</div>
				{:else}
					{#if page.url.pathname.includes('/cases')}
						{@const response = botResponses.find(
							(r: BotResponse) => r.taskHistoryId === taskHistoryId
						)}
						{#if response === undefined}
							<Alert.Root>
								<Alert.Description>
									No response has been generated by the most recent version of the bot.
								</Alert.Description>
							</Alert.Root>
						{:else}
							{@render botResponseSection(response, tasks, textLengthCap)}
						{/if}
					{/if}
					{#if page.url.pathname.includes('/proposals/')}
						{#if !_.isNil(tmpBotResponse)}
							{@render botResponseSection(tmpBotResponse, tmpTasks, textLengthCap)}
						{:else if edits.length > 0}
							{@const response = botResponses.find(
								(r: BotResponse) => r.proposalEditId === edits[0].id
							)}
							{#if response === undefined}
								<Alert.Root>
									<Alert.Description>
										No response has been generated based on the most recent edit to the bot.
									</Alert.Description>
								</Alert.Root>
							{:else}
								{@render botResponseSection(response, edits[0].tasks, textLengthCap)}
							{/if}
						{:else}
							{@const response = botResponses.find(
								(r: BotResponse) => r.taskHistoryId === taskHistoryId
							)}
							{#if response === undefined}
								<Alert.Root>
									<Alert.Description>
										No response has been generated based on the most recent edit to the bot.
									</Alert.Description>
								</Alert.Root>
							{:else}
								{@render botResponseSection(response, originalTasks, textLengthCap)}
							{/if}
						{/if}
					{/if}
				{/if}
			</Card.Content>
			{#if !loadingBotResponse}
				<Card.Footer>
					{#if page.url.pathname.includes('/cases')}
						{@const response = botResponses.find(
							(r: BotResponse) => r.taskHistoryId === taskHistoryId
						)}
						{#if response !== undefined}
							{@render thumbsUpDownIcons(response)}
						{/if}
					{/if}
					{#if page.url.pathname.includes('/proposals/')}
						{#if !_.isNil(tmpBotResponse)}
							{@render thumbsUpDownIcons(tmpBotResponse)}
						{:else if edits.length > 0}
							{@const response = botResponses.find(
								(r: BotResponse) => r.proposalEditId === edits[0].id
							)}
							{#if response !== undefined}
								{@render thumbsUpDownIcons(response)}
							{/if}
						{:else}
							{@const response = botResponses.find(
								(r: BotResponse) => r.taskHistoryId === taskHistoryId
							)}
							{#if response !== undefined}
								{@render thumbsUpDownIcons(response)}
							{/if}
						{/if}
					{/if}
				</Card.Footer>
			{/if}
		</Card.Root>
	</Dialog.Trigger>
	<Dialog.Content class="flex h-[80vh] flex-col overflow-y-auto">
		<Dialog.Header class="text-left">
			<Dialog.Title class="mb-2 flex gap-2">
				{#if checkingBadge}
					<Badge class="bg-discord-yellow text-black">worth checking</Badge>
				{/if}
				{#if testCaseBadge}
					<Badge>test case</Badge>
				{/if}
			</Dialog.Title>
			<Dialog.Description class="text-left">
				<div class="text-foreground w-full text-base">
					<div class="mb-2 flex items-center">
						<HashIcon class="mr-2 size-4" />
						<h4 class="font-medium">
							{channel.startsWith('#') ? channel.slice(1) : channel}
						</h4>
					</div>
					<div class="mb-4 flex">
						{#if realUserMessage}
							<UserCheckIcon class="mt-1 mr-2 size-4 flex-none" />
						{:else}
							<UserIcon class="mt-1 mr-2 size-4 flex-none" />
						{/if}
						<p>{userMessage}</p>
					</div>
					{#if loadingBotResponse}
						<div class="mb-2 flex items-center">
							<LoaderIcon class="mr-2 size-4 animate-spin" />
							<p>Loading bot response...</p>
						</div>
					{:else}
						{#if page.url.pathname === '/cases'}
							{@const response = botResponses.find(
								(r: BotResponse) => r.taskHistoryId === taskHistoryId
							)}
							{#if response === undefined}
								<Alert.Root>
									<Alert.Description>
										No response has been generated by the most recent version of the bot.
									</Alert.Description>
								</Alert.Root>
							{:else}
								{@render botResponseSection(response, tasks)}
								{@render thumbsUpDownButtons(response)}
							{/if}
						{/if}
						{#if page.url.pathname.includes('/proposals/')}
							{#if !_.isNil(tmpBotResponse)}
								{@render botResponseSection(tmpBotResponse, tmpTasks)}
								{@render thumbsUpDownButtons(tmpBotResponse)}
							{:else if edits.length > 0}
								{@const response = botResponses.find(
									(r: BotResponse) => r.proposalEditId === edits[0].id
								)}
								{#if response === undefined}
									<Button
										class="w-full hover:cursor-pointer"
										onclick={async () =>
											await generateBotResponse(
												edits[0].tasks,
												edits[0].id,
												page.params.proposalId,
												''
											)}
									>
										<BotMessageSquareIcon class="size-4" />Bot Response
									</Button>
								{:else}
									{@render botResponseSection(response, edits[0].tasks)}
									{@render thumbsUpDownButtons(response)}
								{/if}
							{:else}
								{@const response = botResponses.find(
									(r: BotResponse) => r.taskHistoryId === taskHistoryId
								)}
								{#if response === undefined}
									<Button
										class="w-full hover:cursor-pointer"
										onclick={async () =>
											await generateBotResponse(originalTasks, '', '', taskHistoryId)}
									>
										<BotMessageSquareIcon class="size-4" />Bot Response
									</Button>
								{:else}
									{@render botResponseSection(response, originalTasks)}
									{@render thumbsUpDownButtons(response)}
								{/if}
							{/if}
						{/if}
					{/if}
				</div>
			</Dialog.Description>
		</Dialog.Header>
		<!-- <Separator class="my-3" /> -->
		<div class="mt-6 flex-1">
			{#if page.url.pathname.includes('/proposals/') && generatedId === undefined}
				<div class="text-muted-foreground min-h-0 flex-1 text-sm">
					<Tabs.Root value="edit">
						<Tabs.List class="w-full">
							<Tabs.Trigger value="edit">
								<span class="hidden md:inline">Response by</span>Latest Edit
							</Tabs.Trigger>
							<Tabs.Trigger value="original">
								<span class="hidden md:inline">Response by</span>Original Tasks
							</Tabs.Trigger>
						</Tabs.List>
						<Tabs.Content value="edit" class="mt-1 rounded-md border p-4">
							{#if edits.length === 0}
								<p>No edits have been proposed yet.</p>
							{:else if _.isNil(tmpBotResponse)}
								<p>The response above is the version generated by the latest edit.</p>
							{:else if loadingBotResponse}
								<div class="flex items-center">
									<LoaderIcon class="mr-2 size-4 animate-spin" />
									<p>Loading bot response...</p>
								</div>
							{:else}
								{@const response = botResponses.find(
									(r: BotResponse) => r.proposalEditId === edits[0].id
								)}
								{#if response === undefined}
									<Button
										class="w-full hover:cursor-pointer"
										variant="secondary"
										onclick={async () =>
											await generateBotResponse(
												edits[0].tasks,
												edits[0].id,
												page.params.proposalId,
												''
											)}
									>
										<BotMessageSquareIcon class="size-4" />Bot Response
									</Button>
								{:else}
									{@render botResponseSection(response, edits[0].tasks)}
								{/if}
							{/if}
						</Tabs.Content>
						<Tabs.Content value="original" class="mt-1 rounded-md border p-4">
							{#if edits.length === 0 && _.isNil(tmpBotResponse)}
								<p>The response above is the version generated by the original tasks.</p>
							{:else if loadingBotResponse}
								<div class="flex items-center">
									<LoaderIcon class="mr-2 size-4 animate-spin" />
									<p>Loading bot response...</p>
								</div>
							{:else}
								{@const response = botResponses.find(
									(r: BotResponse) => r.taskHistoryId === taskHistoryId
								)}
								{#if response === undefined}
									<Button
										class="w-full hover:cursor-pointer"
										variant="secondary"
										onclick={async () =>
											await generateBotResponse(originalTasks, '', '', taskHistoryId)}
									>
										<BotMessageSquareIcon class="size-4" />Bot Response
									</Button>
								{:else}
									{@render botResponseSection(response, originalTasks)}
								{/if}
							{/if}
						</Tabs.Content>
					</Tabs.Root>
					<!-- 
					<h4 class="mt-6">Bot responses from all edits and the original prompt:</h4>
					<Accordion.Root type="single" class="w-full">
						{#if !_.isNil(tmpBotResponse)}
							<Accordion.Item value="edit-tmp">
								<Accordion.Trigger>Proposed edit (current)</Accordion.Trigger>
								<Accordion.Content class="flex flex-col gap-4 text-balance">
									{#if loadingBotResponse}
										<div class="mb-2 flex items-center">
											<LoaderIcon class="mr-2 size-4 animate-spin" />
											<p>Loading bot response...</p>
										</div>
									{:else}
										{@render botResponseSection(tmpBotResponse, tmpTasks)}
									{/if}
								</Accordion.Content>
							</Accordion.Item>
						{/if}
						{#if generatedId === undefined}
							{#each edits as edit, i (edit.id)}
								<Accordion.Item value="edit-{edit.id}">
									<Accordion.Trigger>
										{edit.editor}'s edit {#if i === 0 && _.isNil(tmpBotResponse)}(current){/if}
									</Accordion.Trigger>
									<Accordion.Content class="flex flex-col gap-4 text-balance">
										{#if loadingBotResponse}
											<div class="mb-2 flex items-center">
												<LoaderIcon class="mr-2 size-4 animate-spin" />
												<p>Loading bot response...</p>
											</div>
										{:else}
											{@const response = botResponses.find(
												(r: BotResponse) => r.proposalEditId === edit.id
											)}
											{#if response === undefined}
												<div class="flex items-center justify-between">
													<p>No response has been generated from this edit</p>
													<Button
														class="text-muted-foreground px-2 hover:cursor-pointer"
														variant="secondary"
														onclick={async () =>
															await generateBotResponse(
																edit.tasks,
																edit.id,
																page.params.proposalId,
																''
															)}
													>
														generate
													</Button>
												</div>
											{:else}
												{@render botResponseSection(response, edit.tasks)}
											{/if}
										{/if}
									</Accordion.Content>
								</Accordion.Item>
							{/each}
						{/if}
						{#if generatedId === undefined}
							<Accordion.Item value="task-{taskHistoryId}">
								<Accordion.Trigger>
									original prompt {#if edits.length === 0 && _.isNil(tmpBotResponse)}(current){/if}
								</Accordion.Trigger>
								<Accordion.Content class="flex flex-col gap-4 text-balance">
									{#if loadingBotResponse}
										<div class="mb-2 flex items-center">
											<LoaderIcon class="mr-2 size-4 animate-spin" />
											<p>Loading bot response...</p>
										</div>
									{:else}
										{@const response = botResponses.find(
											(r: BotResponse) => r.taskHistoryId === taskHistoryId
										)}
										{#if response === undefined}
											<div class="flex items-center justify-between">
												<p>No response has been generated from the original prompt</p>
												<Button
													class="text-muted-foreground px-2 hover:cursor-pointer"
													variant="secondary"
													onclick={async () =>
														await generateBotResponse(originalTasks, '', '', taskHistoryId)}
												>
													generate
												</Button>
											</div>
										{:else}
											{@render botResponseSection(response, originalTasks)}
										{/if}
									{/if}
								</Accordion.Content>
							</Accordion.Item>
						{/if}
					</Accordion.Root>
					 -->
				</div>
			{/if}
		</div>
		<div class="mt-auto">
			{#if page.url.pathname.includes('/proposals/') && testCaseBadge && removeCaseFunction !== undefined}
				<Button
					disabled={removing}
					variant="secondary"
					class="mt-4 w-full hover:cursor-pointer"
					onclick={async () => {
						removing = true;
						await removeCaseFunction(id);
					}}
				>
					{#if removing}
						<LoaderCircleIcon class="size-4 animate-spin" />
					{:else}
						<Trash2Icon class="size-4" />
					{/if}
					remove from saved test cases
				</Button>
			{/if}
			{#if page.url.pathname.includes('/proposals/') && generatedId !== undefined && tmpBotResponse}
				<Button
					disabled={adding ||
						(tmpBotResponse.thumbsUp.length === 0 && tmpBotResponse.thumbsDown.length === 0)}
					class="mt-4 w-full hover:cursor-pointer"
					onclick={async () => {
						adding = true;
						if (tmpBotResponse) {
							await addGeneratedCaseFunction(
								generatedId,
								tmpTasks,
								channel,
								userMessage,
								tmpBotResponse.triggeredTask,
								tmpBotResponse.botResponse,
								tmpBotResponse.thumbsUp,
								tmpBotResponse.thumbsDown
							);
						}
					}}
				>
					{#if adding}
						<LoaderCircleIcon class="size-4 animate-spin" />
					{:else}
						<FolderPlusIcon class="size-4" />
					{/if}
					save as a test case
				</Button>
				<p class="text-muted-foreground mt-2 w-full text-center text-sm">
					To save as a test case, first label the bot's response as good or bad.
				</p>
			{/if}
		</div>
		<p class="text-muted-foreground mt-1 text-center text-xs" hidden={id === ''}>Case ID: {id}</p>
	</Dialog.Content>
</Dialog.Root>
