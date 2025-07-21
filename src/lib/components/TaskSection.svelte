<script lang="ts">
	// import ui components
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Button from './ui/button/button.svelte';

	// import lucide icons
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	let {
		id,
		name = $bindable(''),
		trigger = $bindable(''),
		action = $bindable(''),
		triggersOnly = false,
		readonly = false,
		removeTaskFunction = () => {}
	} = $props();
</script>

<div class="border-l">
	<div class="pl-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center">
				<h4 class="pr-2 font-medium">Task:</h4>
				<Input
					placeholder="Enter task name here"
					class="max-w-lg"
					id="name"
					bind:value={name}
					{readonly}
				/>
			</div>
			<Button
				class="hover:cursor-pointer"
				variant="secondary"
				onclick={() => {
					removeTaskFunction(id);
				}}
			>
				<Trash2Icon class="size-4" />Delete
			</Button>
		</div>
		<div class="grid w-full gap-1.5 pt-3">
			<Label for="trigger">Trigger</Label>
			<Textarea
				placeholder="When should the bot do something about this task?"
				id="trigger"
				bind:value={trigger}
				{readonly}
			/>
		</div>
		{#if !triggersOnly}
			<div class="grid w-full gap-1.5 pt-3">
				<Label for="action">Action</Label>
				<Textarea
					placeholder="What should the bot do when this task is triggered?"
					id="action"
					bind:value={action}
					{readonly}
				/>
			</div>
		{/if}
	</div>
</div>
