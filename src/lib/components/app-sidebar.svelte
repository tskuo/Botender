<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import LightbulbIcon from '@lucide/svelte/icons/lightbulb';
	import FoldersIcon from '@lucide/svelte/icons/folders';
	import WebhookIcon from '@lucide/svelte/icons/webhook';

	import * as Avatar from '$lib/components/ui/avatar/index.js';

	const items = [
		{
			title: 'Dashboard',
			url: '/',
			icon: LayoutDashboardIcon
		},
		{
			title: 'Tasks',
			url: '/tasks',
			icon: WrenchIcon
		},
		{
			title: 'Proposals',
			url: '/proposals',
			icon: LightbulbIcon
		},
		{
			title: 'Cases',
			url: '/cases',
			icon: FoldersIcon
		},
		{
			title: 'Playground',
			url: '/playground',
			icon: WebhookIcon
		}
	];
</script>

<Sidebar.Root>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<!-- <div class="flex items-center">
					<Avatar.Root class="mr-4 ml-2">
						<Avatar.Image src="https://github.com/shadcn.png" alt="@shadcn" />
						<Avatar.Fallback>CN</Avatar.Fallback>
					</Avatar.Root>
					<h1 class="text-2xl font-bold">Botender</h1>
				</div> -->
				<h1 class="ml-2 text-2xl font-bold">Botender</h1>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<!-- <Sidebar.GroupLabel>Application</Sidebar.GroupLabel> -->
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each items as item (item.title)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								{#snippet child({ props })}
									<a href={item.url} {...props}>
										<item.icon />
										<span>{item.title}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Footer />
</Sidebar.Root>
