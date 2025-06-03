<script lang="ts">
	// import my components
	import CaseCard from '$lib/components/CaseCard.svelte';

	// import ui components
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Carousel from '$lib/components/ui/carousel/index.js';

	// import lucide icons
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
</script>

<div class="flex h-screen w-full flex-col">
	<div class="flex items-center p-2">
		<Button href="/proposals" variant="ghost" size="icon">
			<ChevronLeftIcon />
		</Button>
		<!-- <ChevronLeftIcon class="size-4" /> -->
		<h2 class="p-2 text-xl font-bold">Proposal: What to do when the channels are irrelevant</h2>
	</div>
	<Separator />
	<div class="grid flex-1 md:grid-cols-5">
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
		<div class="h-full flex-col md:col-span-3">
			<div class="p-4 md:h-1/2">
				<h3>Check test cases</h3>
				<p class="text-muted-foreground mb-1">
					2 people have collaboratively propose the following edit
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
	</div>
</div>
