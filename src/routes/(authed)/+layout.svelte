<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/AppSidebar.svelte';

	let { children } = $props();
</script>

<Sidebar.Provider>
	<AppSidebar />
	<main class="w-full">
		<Sidebar.Trigger class="mt-2 ml-2 md:hidden" />
		{@render children?.()}
	</main>
</Sidebar.Provider>
