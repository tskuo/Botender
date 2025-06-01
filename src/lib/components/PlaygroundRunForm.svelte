<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { playgroundRunFormSchema, type PlaygroundRunFormSchema } from '$lib/schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import PlayIcon from '@lucide/svelte/icons/play';

	let { data } = $props();
	const form = superForm(data, {
		validators: zodClient(playgroundRunFormSchema)
	});

	const { form: formData, enhance } = form;
</script>

<form method="POST" use:enhance>
	<Form.Field {form} name="channel">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Channel</Form.Label>
				<Select.Root type="single" bind:value={$formData.channel} name={props.name}>
					<Select.Trigger {...props}>
						{$formData.channel ? $formData.channel : 'Select a channel'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="#introduction" label="#introduction" />
						<Select.Item value="#random" label="#random" />
						<Select.Item value="#faq" label="#faq" />
					</Select.Content>
				</Select.Root>
			{/snippet}
		</Form.Control>
		<Form.Description>Select a channel where the user sends the message to</Form.Description>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="userMessage">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Channel</Form.Label>
				<Input {...props} bind:value={$formData.userMessage} />
			{/snippet}
		</Form.Control>
		<Form.Description>This is user's message.</Form.Description>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Button class="w-fit self-end">
		<PlayIcon class="size-4" />
		Submit
	</Form.Button>
</form>
