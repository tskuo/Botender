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

	let { children, data } = $props();
</script>

<Sidebar.Provider>
	<AppSidebar {data} />
	<main class="w-full">
		{@render children?.()}
	</main>
</Sidebar.Provider>
