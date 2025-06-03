<script lang="ts">
	// import ui components
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

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
</div>
