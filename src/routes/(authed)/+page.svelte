<script lang="ts">
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
</script>

<div class="flex h-screen w-full flex-col">
	<div class="sticky top-0 z-10 bg-white">
		<div class="flex items-center p-4">
			<Sidebar.Trigger class="mr-2 md:hidden" />
			<h2 class="text-xl font-bold">Dashboard</h2>
		</div>
		<Separator />
	</div>
</div>
