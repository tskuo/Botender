<script lang="ts">
	// import ui components
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Table from '$lib/components/ui/table/index.js';

	// import lucide icons
	import ArrowBigUpIcon from '@lucide/svelte/icons/arrow-big-up';
	import ArrowBigDownIcon from '@lucide/svelte/icons/arrow-big-down';
	import { goto } from '$app/navigation';

	// import types
	import type { PageProps } from './$types';

	// data props
	let { data }: PageProps = $props();
</script>

<div class="flex h-screen w-full flex-col">
	<div class="sticky top-0 z-10 bg-white">
		<h2 class="p-4 text-xl font-bold">Proposals</h2>
		<Separator />
	</div>
	<div class="h-full p-3">
		<Table.Root>
			<Table.Caption>A list of active proposals.</Table.Caption>
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
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>
