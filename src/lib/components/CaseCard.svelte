<script lang="ts">
	// import ui components
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';

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
	import PlayIcon from '@lucide/svelte/icons/play';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	// import svelte features
	import { onMount } from 'svelte';

	// import svelte stores
	import { page } from '$app/state';

	let {
		id = '',
		channel = '',
		createdAt = new Date(),
		realUserMessage = false,
		userMessage = '',
		taskHistoryId = '',
		edits = [],
		tasks = {},
		testCaseBadge = false,
		checkingBadge = false,
		user
	} = $props();

	let loadingBotResponse = $state(true);
	let botResponses = $state([]);

	const textLengthCap = 95;

	const loadBotResponses = async () => {
		let data;
		if (page.url.pathname === '/cases') {
			const res = await fetch(`/api/cases/${id}/botResponses?taskHistoryId=${taskHistoryId}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			});
			if (!res.ok) {
				console.error(`Failed to fetch the latest bot response of case #${id}`, res.statusText);
				return;
			}
			data = await res.json();
		} else if (page.url.pathname.startsWith('/proposals/')) {
			const proposalId = page.params.proposalId;
			const res = await fetch(
				`/api/cases/${id}/botResponses?taskHistoryId=${taskHistoryId}&proposalId=${proposalId}`,
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
			data = await res.json();
		}
		botResponses = data.botResponses;
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

		const resBotResponse = await fetch(`/api/cases/${id}/botResponses`, {
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
		});

		if (resBotResponse.ok) {
			loadBotResponses();
		}
	};

	onMount(async () => {
		loadBotResponses();
	});
</script>

{#snippet botResponseSection(botResponse: BotResponse, lengthCap = 0)}
	<div class="mb-2 flex w-full items-center">
		<WrenchIcon class="mr-2 size-4" />
		<h4 class="font-medium">
			{botResponse.triggeredTask in tasks
				? tasks[botResponse.triggeredTask].name
				: 'No Task is Triggered'}
		</h4>
	</div>
	<div class="flex w-full">
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
			<BotOffIcon class="mt-1 mr-2 size-4 flex-none" />
			<p>The bot chose not to respond.</p>
		{/if}
	</div>
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
			const resBotResponse = await fetch(`/api/cases/${id}/botResponses/${botResponse.id}`, {
				method: 'PATCH',
				body: JSON.stringify({
					value: value
				}),
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (resBotResponse.ok) {
				loadBotResponses();
			}
		}}
	>
		<ToggleGroup.Item value="thumbsUp" class="data-[state=on]:bg-my-green">
			<ThumbsUpIcon class="size-4" />good response
		</ToggleGroup.Item>
		<ToggleGroup.Item value="thumbsDown" class="data-[state=on]:bg-my-pink">
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
		<Card.Root class="hover:bg-muted/50 h-full w-full text-left">
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
							{@render botResponseSection(response, textLengthCap)}
						{/if}
					{/if}
					{#if page.url.pathname.startsWith('/proposals/')}
						{#if edits.length > 0}
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
								{@render botResponseSection(response, textLengthCap)}
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
								{@render botResponseSection(response, textLengthCap)}
							{/if}
						{/if}
					{/if}
				{/if}
			</Card.Content>
			{#if !loadingBotResponse}
				<Card.Footer class="mt-auto">
					{#if page.url.pathname === '/cases'}
						{@const response = botResponses.find(
							(r: BotResponse) => r.taskHistoryId === taskHistoryId
						)}
						{#if response !== undefined}
							{@render thumbsUpDownIcons(response)}
						{/if}
					{/if}
					{#if page.url.pathname.startsWith('/proposals/')}
						{#if edits.length > 0}
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
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title class="mb-2 flex gap-2">
				{#if checkingBadge}
					<Badge class="bg-discord-yellow text-black">worth checking</Badge>
				{/if}
				{#if testCaseBadge}
					<Badge>test case</Badge>
				{/if}
			</Dialog.Title>
			<Dialog.Description class="text-left">
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
							{@render botResponseSection(response)}
							{@render thumbsUpDownButtons(response)}
						{/if}
					{/if}
					{#if page.url.pathname.startsWith('/proposals/')}
						{#if edits.length > 0}
							{@const response = botResponses.find(
								(r: BotResponse) => r.proposalEditId === edits[0].id
							)}
							{#if response === undefined}
								<Button
									class="w-full"
									onclick={async () =>
										await generateBotResponse(
											edits[0].tasks,
											edits[0].id,
											page.params.proposalId,
											''
										)}
								>
									<PlayIcon class="size-4" />Generate Bot Response
								</Button>
							{:else}
								{@render botResponseSection(response)}
								{@render thumbsUpDownButtons(response)}
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
								{@render botResponseSection(response)}
								{@render thumbsUpDownButtons(response)}
							{/if}
						{/if}
					{/if}
				{/if}
				{#if page.url.pathname.startsWith('/proposals/')}
					<h4 class="mt-6">Bot responses from all edits and the initial prompt:</h4>
					<Accordion.Root type="single" class="w-full">
						{#each edits as edit, i (edit.id)}
							<Accordion.Item value="edit-{edit.id}">
								<Accordion.Trigger>
									{edit.editor}'s edit {#if i === 0}(current){/if}
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
											<p>No response has been generated based on this edit to the bot.</p>
										{:else}
											{@render botResponseSection(response)}
										{/if}
									{/if}
								</Accordion.Content>
							</Accordion.Item>
						{/each}
						<Accordion.Item value="task-{taskHistoryId}">
							<Accordion.Trigger>
								initial prompt {#if edits.length === 0}(current){/if}
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
										<p>No response has been generated based on the initial version of the bot.</p>
									{:else}
										{@render botResponseSection(response)}
									{/if}
								{/if}
							</Accordion.Content>
						</Accordion.Item>
					</Accordion.Root>
					<Button variant="secondary" class="mt-4 w-full">
						<TriangleAlertIcon class="size-4" />
						remove this case from the test suite
					</Button>
				{/if}
				<!-- <p class="mx-auto mt-2">Case ID: {id}</p> -->
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>
