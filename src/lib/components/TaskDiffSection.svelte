<script lang="ts">
	import { diffWords } from 'diff';

	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';

	let {
		oldName = '',
		oldTrigger = '',
		oldAction = '',
		newName = '',
		newTrigger = '',
		newAction = ''
	} = $props();

	let diffName = $derived(diffWords(oldName, newName));
	let diffTrigger = $derived(diffWords(oldTrigger, newTrigger));
	let diffAction = $derived(diffWords(oldAction, newAction));
</script>

<div class="border-l">
	<div class="pl-3">
		<h4 class="font-medium">
			Task: {#each diffName as n}
				<span
					class={n.added ? 'text-discord-green' : n.removed ? 'text-discord-pink line-through' : ''}
				>
					{n.value}
				</span>
			{/each}
		</h4>
		<div class="grid w-full gap-1.5 pt-3">
			<Label for="trigger">Trigger</Label>
			<div>
				{#each diffTrigger as t}
					<span
						class={t.added
							? 'text-discord-green'
							: t.removed
								? 'text-discord-pink line-through'
								: ''}
					>
						{t.value}
					</span>
				{/each}
			</div>
		</div>
		<div class="grid w-full gap-1.5 pt-3">
			<Label for="action">Action</Label>
			<div>
				{#each diffAction as a}
					<span
						class={a.added
							? 'text-discord-green'
							: a.removed
								? 'text-discord-pink line-through'
								: ''}
					>
						{a.value}
					</span>
				{/each}
			</div>
		</div>
	</div>
</div>
