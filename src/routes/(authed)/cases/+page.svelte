<script lang="ts">
	// import ui components
	import { Separator } from '$lib/components/ui/separator/index.js';
	import CaseCard from '$lib/components/CaseCard.svelte';
</script>

<div class="flex h-screen w-full flex-col">
	<div class="p-2">
		<h2 class="p-2 text-xl font-bold">Cases</h2>
	</div>
	<Separator />
	<div class="grid auto-rows-fr grid-cols-1 gap-2 p-4 md:grid-cols-2 lg:grid-cols-3">
		<CaseCard />
		<CaseCard />
		<CaseCard />
		<CaseCard />
		<CaseCard />
		<CaseCard />
	</div>
</div>
