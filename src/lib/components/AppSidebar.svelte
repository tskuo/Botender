<script lang="ts">
	// import ui components
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';

	// import lucide icons
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import LightbulbIcon from '@lucide/svelte/icons/lightbulb';
	import FoldersIcon from '@lucide/svelte/icons/folders';
	import WebhookIcon from '@lucide/svelte/icons/webhook';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';

	// import logo
	import logo from '$lib/img/botender_logo.png';

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
				<div class="flex items-center px-2 pt-1">
					<Avatar.Root class="mr-4">
						<Avatar.Image class="rounded-none" src={logo} alt="Botender logo" />
					</Avatar.Root>
					<h1 class="text-2xl font-bold">Botender</h1>
				</div>
				<!-- <h1 class="p-2 text-2xl font-bold">Botender</h1> -->
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
										<span class="font-medium">{item.title}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuButton
								{...props}
								class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							>
								tzusheng
								<ChevronUpIcon class="ml-auto" />
							</Sidebar.MenuButton>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content side="top" class="w-(--bits-dropdown-menu-anchor-width)">
						<!-- <DropdownMenu.Item>
							<span>Account</span>
						</DropdownMenu.Item> -->
						<DropdownMenu.Item>
							<span>Sign out</span>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>
