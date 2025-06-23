<script lang="ts">
	// import ui components
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';

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

	// import svelte features
	import { onMount } from 'svelte';

	// import svelte stores
	import { page } from '$app/state';

	let {
		id = '',
		botResponse = '',
		channel = '',
		createdAt = new Date(),
		realUserMessage = false,
		triggeredTask = '0',
		userMessage = '',
		taskHistoryId = '',
		tasks = {},
		testCaseBadge = false,
		checkingBadge = false
	} = $props();

	let loadingBotResponse = $state(true);
	let thumbsUp = $state([]);
	let thumbsDown = $state([]);

	const textLengthCap = 95;

	onMount(async () => {
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
		const botResponses = data.botResponses;
		triggeredTask = botResponses[0].triggeredTask;
		botResponse = botResponses[0].botResponse;
		thumbsUp = botResponses[0].thumbsUp;
		thumbsDown = botResponses[0].thumbsDown;
		loadingBotResponse = false;
	});
</script>

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
					<div class="mb-2 flex items-center">
						<WrenchIcon class="mr-2 size-4" />
						<h4 class="font-medium">
							{triggeredTask in tasks ? tasks[triggeredTask].name : 'No Task is Triggered'}
						</h4>
					</div>
					<div class="mb-1 flex">
						{#if botResponse !== ''}
							<BotIcon class="mt-1 mr-2 size-4 flex-none" />

							<p>
								{#if botResponse.length <= textLengthCap}
									{botResponse}
								{:else}
									{botResponse.substring(0, textLengthCap)}...
								{/if}
							</p>
						{:else if botResponse === '' && triggeredTask !== '0'}
							<BotOffIcon class="mt-1 mr-2 size-4 flex-none" />
							<p>The bot chose not to respond.</p>
						{/if}
					</div>
				{/if}
			</Card.Content>
			{#if !loadingBotResponse}
				<Card.Footer class="mt-auto">
					<div class="flex w-full items-center justify-around">
						<div class="flex items-center">
							<ThumbsUpIcon class="mr-2 size-5" />
							<p>{thumbsUp.length}</p>
						</div>
						<div class="flex items-center">
							<ThumbsDownIcon class="mr-2 size-5" />
							<p>{thumbsDown.length}</p>
						</div>
					</div>
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
					<div class="mb-2 flex items-center">
						<WrenchIcon class="mr-2 size-4" />
						<h4 class="font-medium">
							{triggeredTask in tasks ? tasks[triggeredTask].name : 'No Task is Triggered'}
						</h4>
					</div>
					<div class="mb-4 flex">
						{#if botResponse !== ''}
							<BotIcon class="mt-1 mr-2 size-4 flex-none" />
							<p>{botResponse}</p>
						{:else if botResponse === '' && triggeredTask !== '0'}
							<BotOffIcon class="mt-1 mr-2 size-4 flex-none" />
							<p>The bot chose not to respond.</p>
						{/if}
					</div>
				{/if}
				<p>Case ID: {id}</p>
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>
