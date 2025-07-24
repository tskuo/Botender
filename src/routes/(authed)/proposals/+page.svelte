<script lang="ts">
	// import ui components
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	// import lucide icons
	import ArrowBigUpIcon from '@lucide/svelte/icons/arrow-big-up';
	import ArrowBigDownIcon from '@lucide/svelte/icons/arrow-big-down';
	import { goto } from '$app/navigation';

	// import types
	import type { PageProps } from './$types';

	// data props
	let { data }: PageProps = $props();
</script>

{#snippet proposalRow(proposal)}
	<Table.Row
		class="h-14 hover:cursor-pointer"
		onclick={() => {
			goto(`/proposals/${proposal.id}`);
		}}
	>
		<Table.Cell class="font-medium">{proposal.title}</Table.Cell>
		<Table.Cell>{proposal.initiator}</Table.Cell>
		<Table.Cell>
			{proposal.edits.length > 0 ? proposal.edits[0].editor : 'No one has edited this yet'}
		</Table.Cell>
		<Table.Cell>{proposal.testCases.length}</Table.Cell>
		<Table.Cell>
			<div class="flex items-center">
				<ArrowBigUpIcon
					class="mr-2 size-4 {proposal.edits.length > 0
						? proposal.edits[0].upvotes.includes(data.user?.userId)
							? 'fill-primary stroke-primary'
							: ''
						: ''}"
				/>
				<p
					class="mr-8 {proposal.edits.length > 0
						? proposal.edits[0].upvotes.includes(data.user?.userId)
							? 'text-primary'
							: ''
						: ''}"
				>
					{proposal.edits.length > 0 ? proposal.edits[0].upvotes.length : '-'}
				</p>
				<ArrowBigDownIcon
					class="mr-2 size-4 {proposal.edits.length > 0
						? proposal.edits[0].downvotes.includes(data.user?.userId)
							? 'fill-primary stroke-primary'
							: ''
						: ''}"
				/>
				<p
					class={proposal.edits.length > 0
						? proposal.edits[0].downvotes.includes(data.user?.userId)
							? 'text-primary'
							: ''
						: ''}
				>
					{proposal.edits.length > 0 ? proposal.edits[0].downvotes.length : '-'}
				</p>
			</div>
		</Table.Cell>
	</Table.Row>
{/snippet}

<div class="flex h-screen w-full flex-col">
	<div class="sticky top-0 z-10 bg-white">
		<div class="flex items-center p-4">
			<Sidebar.Trigger class="mr-2 md:hidden" />
			<h2 class="text-xl font-bold">Proposals</h2>
		</div>
		<Separator />
	</div>
	<div class="h-full p-3">
		<Tabs.Root value="open" class="w-full">
			<Tabs.List>
				<Tabs.Trigger value="open">Open</Tabs.Trigger>
				<Tabs.Trigger value="closed">Closed</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="open">
				<Table.Root>
					<Table.Caption>A list of open proposals</Table.Caption>
					<Table.Header>
						<Table.Row class="hover:bg-trasparent">
							<Table.Head class="w-1/3"><h4>Title</h4></Table.Head>
							<Table.Head><h4>Initiator</h4></Table.Head>
							<Table.Head><h4>Last Edited By</h4></Table.Head>
							<Table.Head><h4>Test Cases</h4></Table.Head>
							<Table.Head><h4>Voting</h4></Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.proposals as proposal (proposal.id)}
							{#if proposal.open}
								{@render proposalRow(proposal)}
							{/if}
						{/each}
					</Table.Body>
				</Table.Root>
			</Tabs.Content>
			<Tabs.Content value="closed">
				<Table.Root>
					<Table.Caption>A list of closed proposals</Table.Caption>
					<Table.Header>
						<Table.Row class="hover:bg-trasparent">
							<Table.Head class="w-1/3"><h4>Title</h4></Table.Head>
							<Table.Head><h4>Initiator</h4></Table.Head>
							<Table.Head><h4>Last Edited By</h4></Table.Head>
							<Table.Head><h4>Test Cases</h4></Table.Head>
							<Table.Head><h4>Voting</h4></Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.proposals as proposal (proposal.id)}
							{#if !proposal.open}
								{@render proposalRow(proposal)}
							{/if}
						{/each}
					</Table.Body>
				</Table.Root>
			</Tabs.Content>
		</Tabs.Root>
	</div>
</div>
