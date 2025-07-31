<script lang="ts">
	import { diffWords } from 'diff';
	import { Label } from '$lib/components/ui/label/index.js';
	import _ from 'lodash';

	let {
		oldTask = {
			name: '',
			trigger: '',
			action: ''
		},
		newTask = {
			name: '',
			trigger: '',
			action: ''
		}
	} = $props();

	let diffName = $derived(diffWords(oldTask.name, newTask.name));
	let diffTrigger = $derived(diffWords(oldTask.trigger, newTask.trigger));
	let diffAction = $derived(diffWords(oldTask.action, newTask.action));
</script>

<div class="border-l-4">
	<div class="pl-3">
		<h4 class="text-base font-medium">
			{#if oldTask.name === '' && oldTask.trigger === '' && oldTask.action === ''}
				New
			{:else if newTask.name === '' && newTask.trigger === '' && newTask.action === ''}
				Deleted
			{/if}
			Task: {#each diffName as n}
				<span class={n.added ? 'text-my-green' : n.removed ? 'text-my-pink line-through' : ''}>
					{n.value}
				</span>
			{/each}
		</h4>
		<div class="grid w-full gap-1.5 pt-3">
			<Label class="text-base" for="trigger"><h4>Trigger</h4></Label>
			<div>
				{#each diffTrigger as t}
					<span class={t.added ? 'text-my-green' : t.removed ? 'text-my-pink line-through' : ''}>
						{t.value}
					</span>
				{/each}
			</div>
		</div>
		<div class="grid w-full gap-1.5 pt-3">
			<Label class="text-base" for="action"><h4>Action</h4></Label>
			<div>
				{#each diffAction as a}
					<span class={a.added ? 'text-my-green' : a.removed ? 'text-my-pink line-through' : ''}>
						{a.value}
					</span>
				{/each}
			</div>
		</div>
	</div>
</div>
