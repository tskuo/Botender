<!-- <script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/AppSidebar.svelte';

	let { children } = $props();
</script>

<Sidebar.Provider>
	<AppSidebar />
	<main class="w-full">
		{@render children?.()}
	</main>
</Sidebar.Provider> -->

<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/AppSidebar.svelte';
	import { signOut } from '@auth/sveltekit/client';
	import { Button } from '$lib/components/ui/button/index.js';

	let { children, data } = $props();
</script>

<Sidebar.Provider>
	<AppSidebar {data} />
	<main class="w-full">
		<!-- <div class="flex items-center justify-between border-b p-4">
			<h1>Welcome, {data.user.userName}</h1>
			<Button variant="outline" onclick={() => signOut()}>Sign Out</Button>
		</div> -->
		{@render children?.()}
	</main>
</Sidebar.Provider>
