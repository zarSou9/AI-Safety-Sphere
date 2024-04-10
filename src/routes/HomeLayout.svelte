<script lang="ts">
	import { AppShell } from '@skeletonlabs/skeleton';
	import { AppBar } from '@skeletonlabs/skeleton';
</script>

<body data-theme="wintry">
	<AppShell>
		<svelte:fragment slot="pageHeader">
			<AppBar padding="p-3" slotTrail="space-x-4" slotLead="">
				<svelte:fragment slot="lead">
					<a href="/">
						<img class="w-10" src="/images/log.png" alt="logo" />
					</a>
				</svelte:fragment>
				<svelte:fragment slot="trail">
					<a class="btn px-3.5 py-1.5 hover:underline" href="/login" rel="external">Log in</a>
					<a
						class="btn px-3.5 py-1.5 ml-2 variant-outline-primary hover:variant-filled-primary"
						href="/signup">Sign up</a
					>
				</svelte:fragment>
			</AppBar>
		</svelte:fragment>

		<slot />
	</AppShell>
</body>
