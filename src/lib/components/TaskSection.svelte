<script lang="ts">
	// import ui components
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Button from './ui/button/button.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	// import lucide icons
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import InfoIcon from '@lucide/svelte/icons/info';
	import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';

	let {
		id,
		name = $bindable(''),
		trigger = $bindable(''),
		action = $bindable(''),
		triggersOnly = false,
		readonly = false
	} = $props();

	let initName = name;
	let initTrigger = trigger;
	let initAction = action;
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
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button {...props} variant="ghost" class="hover:cursor-pointer">
							<EllipsisVerticalIcon />
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					<DropdownMenu.Group>
						<DropdownMenu.Label>More Actions</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Item
							disabled={name === initName && trigger === initTrigger && action === initAction}
							class="hover:cursor-pointer"
							onclick={() => {
								name = initName;
								trigger = initTrigger;
								action = initAction;
							}}
						>
							Reset Task
						</DropdownMenu.Item>
						<DropdownMenu.Item
							disabled={name === '' && trigger === '' && action === ''}
							class="hover:cursor-pointer"
							onclick={() => {
								name = '';
								trigger = '';
								action = '';
							}}
						>
							<span class="text-my-pink">Delete Task</span>
						</DropdownMenu.Item>
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
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
