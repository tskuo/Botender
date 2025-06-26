<script lang="ts">
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';

	let {
		name = $bindable(''),
		trigger = $bindable(''),
		action = $bindable(''),
		triggersOnly = false,
		readonly = false
	} = $props();
</script>

<div class="border-l">
	<div class="pl-3">
		<h4 class="font-medium">Task: {name}</h4>
		<div class="grid w-full gap-1.5 pt-3">
			<Label for="trigger">Trigger</Label>
			<Textarea
				placeholder="Enter task trigger here."
				id="trigger"
				bind:value={trigger}
				{readonly}
			/>
		</div>
		{#if !triggersOnly}
			<div class="grid w-full gap-1.5 pt-3">
				<Label for="action">Action</Label>
				<Textarea
					placeholder="Enter task action here."
					id="action"
					bind:value={action}
					{readonly}
				/>
			</div>
		{/if}
	</div>
</div>
