<script lang="ts">
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';

	let { name = '', trigger = '', action = '', triggersOnly = false } = $props();
</script>

<div class="border-l">
	<div class="pl-2">
		<h3 class="font-semibold">Task: {name}</h3>
		<div class="grid w-full gap-1.5 pt-2">
			<Label for="trigger">Trigger</Label>
			<Textarea placeholder="Enter task trigger here." id="trigger" value={trigger} />
		</div>
		{#if !triggersOnly}
			<div class="grid w-full gap-1.5 pt-2">
				<Label for="action">Action</Label>
				<Textarea placeholder="Enter task action here." id="action" value={action} />
			</div>
		{/if}
	</div>
</div>
