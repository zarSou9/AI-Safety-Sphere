<script lang="ts">
	import { writable } from 'svelte/store';
	import { setContext } from 'svelte';
	import { page } from '$app/stores';

	import Settings from '$lib/icons/Settings.svelte';

	let open = false;
	let currentUrl: string;
	$: currentUrl = $page.url.pathname.split('/').filter(Boolean).pop() as string;

	const dashboardAction = writable<string | null>(null);
	setContext('dashboardActionStore', dashboardAction);

	function openRail() {
		open = true;
	}
	function closeRail() {
		open = false;
	}
</script>

{#if open}
	<button class="btn-icon button-div" on:click={closeRail}
		><object class="button" data="/images/icons/cross.svg" type="image/svg+xml" aria-label="zoom in"
		></object></button
	>
{:else}
	<button class="btn-icon button-div" on:click={openRail}
		><object class="button" data="/images/icons/menu.svg" type="image/svg+xml" aria-label="zoom in"
		></object></button
	>
{/if}

<div class="flex w-full h-full text-white text-[14px]">
	{#if open}
		<div class="flex flex-col pt-[40px] w-[62px] bg-[#272727] border-r-[.3px] border-gray-500">
			<div class="h-0 w-[42px] ml-auto mr-auto border-b-[.3px] border-gray-500 mb-1" />
			<a
				href="/home/docs"
				on:click={() => dashboardAction.set('handle-destroy')}
				class="tab {currentUrl === 'docs' ? 'bg-[#454545]' : 'hover:bg-[#45454570]'}">Docs</a
			>
			<a
				href="/home/tree"
				class="tab {currentUrl === 'tree' ? 'bg-[#454545]' : 'hover:bg-[#45454570]'}">Tree</a
			>
			<a
				href="/home/plan"
				on:click={() => dashboardAction.set('handle-destroy')}
				class="tab {currentUrl === 'plan' ? 'bg-[#454545]' : 'hover:bg-[#45454570]'}">Plan</a
			>
			<a
				href="/home/team"
				on:click={() => dashboardAction.set('handle-destroy')}
				class="tab {currentUrl === 'team' ? 'bg-[#454545]' : 'hover:bg-[#45454570]'}">Team</a
			>
			<a
				href="/home/ideas"
				on:click={() => dashboardAction.set('handle-destroy')}
				class="tab {currentUrl === 'ideas' ? 'bg-[#454545]' : 'hover:bg-[#45454570]'}">Ideas</a
			>
			<a
				href="/home/learn"
				on:click={() => dashboardAction.set('handle-destroy')}
				class="tab {currentUrl === 'learn' ? 'bg-[#454545]' : 'hover:bg-[#45454570]'}">Learn</a
			>
			<a
				href="/home/settings"
				on:click={() => dashboardAction.set('handle-destroy')}
				class="mt-auto ml-auto mr-auto mb-[14px]"><Settings color="#9c9c9c" size="33px" /></a
			>
		</div>
	{/if}
	<div class="w-full h-full overflow-hidden"><slot /></div>
</div>

<style>
	.button {
		pointer-events: none;
		margin: auto;
	}

	.button-div {
		position: fixed;
		top: -1px;
		left: 9px;
		z-index: 200;
	}

	.tab {
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		margin-top: 3px;
		margin-left: auto;
		margin-right: auto;
		width: 47px;
		height: 47px;
	}
</style>
