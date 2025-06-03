<script lang="ts">
	// import ui components
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';

	// import lucide icons
	import HashIcon from '@lucide/svelte/icons/hash';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import BotIcon from '@lucide/svelte/icons/bot';
	import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
	import ThumbsDownIcon from '@lucide/svelte/icons/thumbs-down';

	let {
		id = '',
		channel = '',
		userMessage = '',
		triggeredTask = '0',
		botResponse = '',
		tasks = [],
		testCaseBadge = true,
		checkingBadge = true
	} = $props();

	const textLengthCap = 200;
</script>

<Dialog.Root>
	<Dialog.Trigger>
		<Card.Root class="h-full w-full text-left">
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
					<h3 class="font-medium">
						{channel.startsWith('#') ? channel.slice(1) : channel}
					</h3>
				</div>
				<div class="mb-4 flex">
					<UserRoundIcon class="mt-1 mr-2 size-4 flex-none" />
					<p>
						{#if userMessage.length <= textLengthCap}
							{userMessage}
						{:else}
							{userMessage.substring(0, textLengthCap)}...
						{/if}
					</p>
				</div>
				<div class="mb-2 flex items-center">
					<WrenchIcon class="mr-2 size-4" />
					<h3 class="font-medium">
						{tasks.find((task: Task) => task.id === triggeredTask)?.name ?? 'No Task is Triggered'}
					</h3>
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
					{/if}
				</div>
			</Card.Content>
			<Card.Footer class="mt-auto">
				<div class="flex w-full items-center justify-around">
					<div class="flex items-center">
						<ThumbsUpIcon class="mr-2 size-5" />
						<p>1</p>
					</div>
					<div class="flex items-center">
						<ThumbsDownIcon class="mr-2 size-5" />
						<p>1</p>
					</div>
				</div>
			</Card.Footer>
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
			<Dialog.Description>
				<div class="mb-2 flex items-center">
					<HashIcon class="mr-2 size-4" />
					<h3 class="font-medium">
						{channel.startsWith('#') ? channel.slice(1) : channel}
					</h3>
				</div>

				<div class="mb-4 flex">
					<UserRoundIcon class="mt-1 mr-2 size-4 flex-none" />
					<p>{userMessage}</p>
				</div>
				<div class="mb-2 flex items-center">
					<WrenchIcon class="mr-2 size-4" />
					<h3 class="font-medium">
						{tasks.find((task: Task) => task.id === triggeredTask)?.name ?? 'No Task is Triggered'}
					</h3>
				</div>
				<div class="mb-4 flex">
					{#if botResponse !== ''}
						<BotIcon class="mt-1 mr-2 size-4 flex-none" />

						<p>
							{#if botResponse.length <= textLengthCap}
								{botResponse}
							{:else}
								{botResponse.substring(0, textLengthCap)}...
							{/if}
						</p>
					{/if}
				</div>
				<p>Case ID: {id}</p>
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>
