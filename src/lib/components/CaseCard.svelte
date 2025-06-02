<script lang="ts">
	// import ui components
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';

	// import lucide icons
	import HashIcon from '@lucide/svelte/icons/hash';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import BotIcon from '@lucide/svelte/icons/bot';
	import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
	import ThumbsDownIcon from '@lucide/svelte/icons/thumbs-down';
</script>

<Dialog.Root>
	<Dialog.Trigger>
		<Card.Root class="text-left hover:bg-gray-50">
			<Card.Header>
				<!-- <Card.Title></Card.Title> -->
				<Card.Description class="flex justify-between">
					<Badge variant="outline">worth checking</Badge>
					<Badge variant="outline">test case</Badge>
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="mb-2 flex items-center">
					<HashIcon class="mr-2 size-4" />
					<h3 class="font-semibold">Channel</h3>
				</div>
				<div class="mb-3 flex">
					<UserRoundIcon class="mt-1 mr-2 size-4 flex-none" />
					<p>
						Hello, everyone! My name is Min Park (she/her), a Ph.D. student from Korea Institute of
						Science and Technology (KAIST), as well as the moderator of this server.
					</p>
				</div>
				<div class="mb-2 flex items-center">
					<WrenchIcon class="mr-2 size-4" />
					<h3 class="font-semibold">Welcome Newcomers</h3>
				</div>
				<div class="mb-3 flex">
					<BotIcon class="mt-1 mr-2 size-4 flex-none" />
					<p>
						Since you love games and musicals, you might be interested in joining channels like
						#sports, #plants, and #cafe!
					</p>
				</div>
			</Card.Content>
			<Card.Footer>
				<div class="flex w-full items-center justify-around">
					<div class="flex items-center">
						<ThumbsUpIcon class="mr-2 size-5" />
						<p>1</p>
					</div>
					<div class="flex items-center">
						<ThumbsDownIcon class="mr-2 size-5" />
						<p>1</p>
					</div>
				</div>
			</Card.Footer>
		</Card.Root>
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
			<Dialog.Description>
				This action cannot be undone. This will permanently delete your account and remove your data
				from our servers.
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>
