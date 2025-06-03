<script lang="ts">
	// import ui components
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Table from '$lib/components/ui/table/index.js';

	// import lucide icons
	import ArrowBigUpIcon from '@lucide/svelte/icons/arrow-big-up';
	import ArrowBigDownIcon from '@lucide/svelte/icons/arrow-big-down';
</script>

<div class="flex h-screen w-full flex-col">
	<div class="p-2">
		<h2 class="p-2 text-xl font-bold">Proposals</h2>
	</div>
	<Separator />
	<div class="h-full p-2">
		<Table.Root>
			<Table.Caption>A list of active proposals.</Table.Caption>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-1/3">Title</Table.Head>
					<Table.Head>Initiator</Table.Head>
					<Table.Head>Last Edited By</Table.Head>
					<Table.Head>Test Cases</Table.Head>
					<Table.Head>Voting</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				<Table.Row class="h-14">
					<Table.Cell class="font-medium">What to do when the channels are irrelevant</Table.Cell>
					<Table.Cell>filzzz</Table.Cell>
					<Table.Cell>xacaranda</Table.Cell>
					<Table.Cell>
						<span class="text-discord-green mr-2">1</span> /
						<span class="text-discord-pink mx-2">1</span> /
						<span class=" ml-2">1</span>
					</Table.Cell>
					<Table.Cell>
						<div class="flex items-center">
							<ArrowBigUpIcon class="mr-2 size-4" />
							<p class="mr-8">0</p>
							<ArrowBigDownIcon class="mr-2 size-4" />
							<p>0</p>
						</div>
					</Table.Cell>
				</Table.Row>
				<Table.Row class="h-14">
					<Table.Cell class="font-medium">What to do when the channels are irrelevant</Table.Cell>
					<Table.Cell>filzzz</Table.Cell>
					<Table.Cell>xacaranda</Table.Cell>
					<Table.Cell>
						<span class="text-discord-green mr-2">1</span> /
						<span class="text-discord-pink mx-2">1</span> /
						<span class=" ml-2">1</span>
					</Table.Cell>
					<Table.Cell>
						<div class="flex items-center">
							<ArrowBigUpIcon class="mr-2 size-4" />
							<p class="mr-8">0</p>
							<ArrowBigDownIcon class="mr-2 size-4" />
							<p>0</p>
						</div>
					</Table.Cell>
				</Table.Row>
				<Table.Row class="h-14">
					<Table.Cell class="font-medium">What to do when the channels are irrelevant</Table.Cell>
					<Table.Cell>filzzz</Table.Cell>
					<Table.Cell>xacaranda</Table.Cell>
					<Table.Cell>
						<span class="text-discord-green mr-2">1</span> /
						<span class="text-discord-pink mx-2">1</span> /
						<span class=" ml-2">1</span>
					</Table.Cell>
					<Table.Cell>
						<div class="flex items-center">
							<ArrowBigUpIcon class="mr-2 size-4" />
							<p class="mr-8">0</p>
							<ArrowBigDownIcon class="mr-2 size-4" />
							<p>0</p>
						</div>
					</Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table.Root>
	</div>
</div>
