<script lang="ts">
	// import my components
	import CaseCard from '$lib/components/CaseCard.svelte';

	// import ui components
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	// import lucide icons
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';

	// sync the sheet
	let rightCol: HTMLDivElement | null = null;
	let sheetWidth = 0;

	// Update width on mount and on resize
	function updateSheetWidth() {
		if (rightCol) {
			sheetWidth = rightCol.offsetWidth;
		}
	}
	import { onMount } from 'svelte';
	onMount(() => {
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
			<h2 class="text-xl font-bold">Proposal: What to do when the channels are irrelevant</h2>
		</div>
		<Separator />
	</div>
	<div class="grid flex-auto md:grid-cols-5">
		<div class="border-r p-2 md:col-span-2">
			<div class="p-2">
				<h3>Description</h3>
				<p class="text-muted-foreground mb-1">filzzz initiated 18 hours ago</p>
				<p>
					Regardless of what a person says in the #introduction channel, the bot seems to recommend
					all three channels (#sports, #plants, and #cafe), even if the person's introduction may be
					irrelevant to some or all of them.
				</p>
			</div>
			<div class="p-2">
				<h3>Discussion</h3>
				<p class="text-muted-foreground mb-1">3 people have joined the discussion on Discord</p>
				<p>
					Regardless of what a person says in the #introduction channel, the bot seems to recommend
					all three channels (#sports, #plants, and #cafe), even if the person's introduction may be
					irrelevant to some or all of them.
				</p>
			</div>
			<div class="p-2">
				<h3>Proposed Edit</h3>
				<p class="text-muted-foreground mb-1">
					2 people have collaboratively propose the following edit
				</p>
			</div>
		</div>
		<div class="flex h-full flex-col overflow-hidden md:col-span-3" bind:this={rightCol}>
			<div class="flex-1 overflow-hidden">
				<div class="p-4 md:h-1/2">
					<div class="mb-2 md:mb-0 md:flex md:justify-between">
						<div>
							<h3>Check test cases</h3>
							<p class="text-muted-foreground mb-1">5 cases in total</p>
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
					<Carousel.Root
						opts={{
							align: 'start'
						}}
						class="mx-auto w-4/5 max-w-screen md:w-5/6"
					>
						<Carousel.Content>
							{#each Array(5) as _, i (i)}
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
							{/each}
						</Carousel.Content>
						<Carousel.Previous />
						<Carousel.Next />
					</Carousel.Root>
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
							{#each Array(5) as _, i (i)}
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
							{/each}
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
