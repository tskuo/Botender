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
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Table from '$lib/components/ui/table/index.js';

	// import lucide icons
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ArrowBigUpIcon from '@lucide/svelte/icons/arrow-big-up';
	import ArrowBigDownIcon from '@lucide/svelte/icons/arrow-big-down';
	import PlayIcon from '@lucide/svelte/icons/play';
	import UndoIcon from '@lucide/svelte/icons/undo';
	import SaveIcon from '@lucide/svelte/icons/save';

	// import types
	import type { PageProps } from './$types';

	// import svelte features
	import { onMount } from 'svelte';

	// data props
	let { data }: PageProps = $props();

	// state for the proposal
	let editedTasks = $state(
		data.proposal.edits.length > 0 ? data.proposal.edits[0].tasks : data.originalTasks.tasks
	);

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
</script>

<div class="flex h-screen w-full flex-col">
	<div class="sticky top-0 z-10 bg-white">
		<div class="flex items-center p-3">
			<Button href="/proposals" variant="ghost" size="icon">
				<ChevronLeftIcon />
			</Button>
			<h2 class="text-xl font-bold">Proposal: {data.proposal.title}</h2>
		</div>
		<Separator />
	</div>
	<div class="grid h-full flex-auto md:grid-cols-5">
		<div class="overflow-auto border-r p-2 md:col-span-2">
			<div class="mb-2 p-2">
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
			<div class="mb-2 p-2">
				<h3>Discussion</h3>
				{#if data.proposal.discussionSummary === ''}
					<p class="text-muted-foreground text-sm">No one has joined the discussion yet.</p>
				{:else}
					<p>Summary: {data.proposal.discussionSummary}</p>
				{/if}
			</div>
			<div class="mb-2 p-2">
				<h3>Proposed Edit</h3>
				{#if data.proposal.edits.length === 0}
					<p class="text-muted-foreground text-sm">
						No edits have been proposed yet. The following are the original task prompts.
					</p>
				{:else}
					<p class="text-muted-foreground">
						{#if data.proposal.edits.length === 1}
							1 person has proposed the following edit
						{:else}
							{data.proposal.edits.length} people have collaboratively proposed the following edits
						{/if}
					</p>
				{/if}
				{#each Object.entries(editedTasks) as [taskId, task] (taskId)}
					<div class="pt-4">
						<TaskSection
							bind:name={editedTasks[taskId].name}
							bind:trigger={editedTasks[taskId].trigger}
							bind:action={editedTasks[taskId].action}
						/>
					</div>
				{/each}
				<p class="text-muted-foreground my-1 text-sm">
					To save new edits, you must first run tests to check the updated bot responses.
				</p>
				<div class="mt-2 flex items-center justify-between">
					<Button
						disabled={data.proposal.edits.length > 0
							? _.isEqual(editedTasks, data.proposal.edits[0].tasks)
							: _.isEqual(editedTasks, data.originalTasks.tasks)}
					>
						<PlayIcon class="size-4" />Test
					</Button>
					<div class="flex items-center gap-2">
						<Button
							variant="secondary"
							disabled={data.proposal.edits.length > 0
								? _.isEqual(editedTasks, data.proposal.edits[0].tasks)
								: _.isEqual(editedTasks, data.originalTasks.tasks)}
							onclick={() => {
								if (data.proposal.edits.length > 0) {
									editedTasks = data.proposal.edits[0].tasks;
								} else {
									editedTasks = data.originalTasks.tasks;
								}
							}}
						>
							<UndoIcon class="size-4" />Reset
						</Button>
						<Button variant="secondary" disabled>
							<SaveIcon class="size-4" />Save
						</Button>
					</div>
				</div>
			</div>
			<div class="mb-2 p-2">
				<h3>Edit History</h3>
				<Table.Root>
					{#if data.proposal.edits.length === 0}
						<Table.Caption>No edits have been proposed yet.</Table.Caption>
					{/if}
					<Table.Header>
						<Table.Row class="hover:bg-trasparent">
							<Table.Head><h4>Edit</h4></Table.Head>
							<Table.Head><h4>Editor</h4></Table.Head>
							<Table.Head><h4>Test Cases</h4></Table.Head>
							<Table.Head><h4>Voting</h4></Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.proposal.edits as edit (edit.id)}
							<Table.Row>
								<Table.Cell>view</Table.Cell>
								<Table.Cell>{edit.editor}</Table.Cell>
								<Table.Cell>xxx</Table.Cell>
								<Table.Cell>
									<div class="flex items-center">
										<ArrowBigUpIcon class="mr-2 size-4" />
										<p class="mr-8">{edit.upvotes.length}</p>
										<ArrowBigDownIcon class="mr-2 size-4" />
										<p>{edit.downvotes.length}</p>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</div>
		<div class="flex h-full flex-col overflow-hidden md:col-span-3" bind:this={rightCol}>
			<div class="flex-1 overflow-hidden">
				<div class="p-4 md:h-1/2">
					<div class="mb-2 md:mb-0 md:flex md:justify-between">
						<div>
							<h3>Check test cases</h3>
							<p class="text-muted-foreground mb-1">
								{data.testCases.length} test
								{data.testCases.length === 1 ? 'case' : 'cases'} in total in the test suite
							</p>
						</div>
						<ToggleGroup.Root
							size="lg"
							variant="outline"
							type="single"
							class="mx-auto self-start md:mr-0"
						>
							<ToggleGroup.Item value="good" class="px-8 text-lg">2 good</ToggleGroup.Item>
							<ToggleGroup.Item value="bad" class="px-8 text-lg">2 bad</ToggleGroup.Item>
							<ToggleGroup.Item value="tbd" class="px-8 text-lg">1 tbd</ToggleGroup.Item>
						</ToggleGroup.Root>
					</div>
					{#if data.testCases.length === 0}
						<div class="flex h-full items-center justify-center">
							<p class="text-muted-foreground">No cases have been added to the test suite yet.</p>
						</div>
					{:else}
						<Carousel.Root
							opts={{
								align: 'start'
							}}
							class="mx-auto w-4/5 max-w-screen md:w-5/6"
						>
							<Carousel.Content>
								{#each data.testCases as testCase (testCase.id)}
									<Carousel.Item class="xl:basis-1/2">
										<div class="p-1">
											<CaseCard
												{...testCase}
												testCaseBadge={true}
												tasks={data.originalTasks.tasks}
												edits={data.proposal.edits}
												taskHistoryId={data.proposal.taskHistoryId}
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
				<Separator />
				<div class="p-4 md:h-1/2">
					<h3>Check other cases for possible side effects from the proposed edit</h3>
					<p class="text-muted-foreground mb-1">
						5 cases have been suggested. You may add (+) relevant cases to the test cases.
					</p>
					<Carousel.Root
						opts={{
							align: 'start'
						}}
						class="mx-auto w-4/5 max-w-screen md:w-5/6"
					>
						<Carousel.Content>
							<!-- {#each Array(5) as _, i (i)}
								<Carousel.Item class="xl:basis-1/2">
									<div class="p-1">
										<CaseCard
											id={'xxx'}
											channel={'#introduction'}
											userMessage={'This is Sebastian writing. I am currently building up a research group in Berlin with a focus on the intersection of data engineering and ML. We have a postdoc opening in my group, which I would like to share here:'}
											triggeredTask={'Welcome Newcomers'}
											botResponse={'Welcome to our community! We have channels for sports, plants, and cafe discussions. Feel free to join any of them!'}
										/>
									</div>
								</Carousel.Item>
							{/each} -->
						</Carousel.Content>
						<Carousel.Previous />
						<Carousel.Next />
					</Carousel.Root>
				</div>
			</div>
			<div class="w-full shrink-0">
				<Sheet.Root>
					<Sheet.Trigger class="w-full border-t py-2 pl-4 text-left">
						<h3>Check other cases manually</h3>
					</Sheet.Trigger>
					<Sheet.Content
						class="ml-auto"
						side="bottom"
						style="width: {sheetWidth}px; max-width: 100vw;"
					>
						<Sheet.Header>
							<Sheet.Title>Edit profile</Sheet.Title>
							<Sheet.Description>
								Make changes to your profile here. Click save when you're done.
							</Sheet.Description>
						</Sheet.Header>
						<div class="grid flex-1 auto-rows-min gap-6 px-4">
							<div class="grid gap-3">
								<Label for="name" class="text-right">Name</Label>
								<Input id="name" value="Pedro Duarte" />
							</div>
							<div class="grid gap-3">
								<Label for="username" class="text-right">Username</Label>
								<Input id="username" value="@peduarte" />
							</div>
						</div>
						<Sheet.Footer>
							<Sheet.Close class={buttonVariants({ variant: 'outline' })}>Save changes</Sheet.Close>
						</Sheet.Footer>
					</Sheet.Content>
				</Sheet.Root>
			</div>
		</div>
	</div>
</div>
