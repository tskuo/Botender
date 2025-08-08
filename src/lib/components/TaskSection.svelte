<script lang="ts">
	// import ui components
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Button from './ui/button/button.svelte';

	// import lucide icons
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import InfoIcon from '@lucide/svelte/icons/info';

	let {
		id,
		name = $bindable(''),
		trigger = $bindable(''),
		action = $bindable(''),
		triggersOnly = false,
		readonly = false
	} = $props();
</script>

<div class="border-l-4">
	<div class="pl-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center">
				{#if id === 'new'}<h4 class="mr-1">New</h4>{/if}
				<h4 class="mr-2">Task:</h4>
				<Input
					placeholder="Enter task name here"
					class="max-w-lg"
					id="{id}-name"
					bind:value={name}
					{readonly}
				/>
			</div>
			<div class="flex items-center gap-2">
				<Button
					disabled={name === '' && trigger === '' && action === ''}
					class="hover:cursor-pointer"
					variant="secondary"
					onclick={() => {
						name = '';
						trigger = '';
						action = '';
					}}
				>
					<Trash2Icon class="size-4" />
					<p class="hidden lg:inline">
						{#if name === '' && trigger === '' && action === ''}
							Deleted
						{:else}
							Delete
						{/if}
					</p>
				</Button>
			</div>
		</div>
		<div class="grid w-full gap-1.5 pt-3">
			<Label for="{id}-trigger">Trigger</Label>
			<Textarea
				placeholder="When should the bot take action?"
				id="{id}-trigger"
				bind:value={trigger}
				{readonly}
			/>
		</div>
		{#if !triggersOnly}
			<div class="grid w-full gap-1.5 pt-3">
				<Label for="{id}-action">Action</Label>
				<Textarea
					placeholder="What action should the bot take?"
					id="{id}-action"
					bind:value={action}
					{readonly}
				/>
			</div>
		{/if}
		{#if name.trim() === '' && trigger.trim() === '' && action.trim() === ''}
			<div class="text-primary mt-2 flex items-center text-sm">
				<InfoIcon class="mr-1 size-4" />
				<p>Tasks with no content are treated as deleted and will be ignored by the bot.</p>
			</div>
		{/if}
	</div>
</div>
