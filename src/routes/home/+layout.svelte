<script lang="ts">
	import { writable, type Writable } from 'svelte/store';
	import { setContext, tick } from 'svelte';
	import { page } from '$app/stores';
	import Settings from '$lib/icons/Settings.svelte';
	import Menu from '$lib/icons/Menu.svelte';
	import Cross from '$lib/icons/Cross.svelte';

	export let data;

	const profDropdown = writable<boolean>(false);
	setContext('profDropdownStore', profDropdown);

	let profileDropE: HTMLDivElement;
	let initials = false;

	function noImage(e: any) {
		e.target.src = '';
		initials = true;
	}
	profDropdown.subscribe((v) => {
		if (v) {
			setTimeout(() => {
				window.addEventListener('click', click);
			}, 200);
		}
	});
	function click(event: MouseEvent) {
		const { clientX, clientY } = event;
		const rect = profileDropE.getBoundingClientRect();
		const isWithinProfileDropE =
			clientX >= rect.left &&
			clientX <= rect.right &&
			clientY >= rect.top &&
			clientY <= rect.bottom;

		if (!isWithinProfileDropE) {
			$profDropdown = false;
			window.removeEventListener('click', click);
		}
	}
	async function signout() {
		await fetch('/home/actions/signout', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		location.reload();
	}

	let open = true;
	if (data.props.loggedIn) open = false;

	let currentUrl: string;
	$: currentUrl = $page.url.pathname.split('/').filter(Boolean).pop() as string;

	function openRail() {
		open = true;
	}
	function closeRail() {
		open = false;
	}
</script>

{#if $profDropdown}
	<div
		class="fixed z-[200] top-[46px] right-[8px] w-[63px] rounded-md bg-[#515151] grid text-sm text-[#ebebeb]"
		on:click={() => {
			$profDropdown = false;
			window.removeEventListener('click', click);
		}}
		role="presentation"
		bind:this={profileDropE}
	>
		{#if data?.props?.loggedIn}
			<a
				href="/home/settings"
				class="hover:bg-[#676767] rounded-t-md flex items-center justify-center pt-[3px] pb-[2px]"
				>Profile</a
			>
			<button
				on:click={signout}
				class="hover:bg-[#676767] text-red-400 rounded-b-md flex items-center justify-center pb-[4px]"
			>
				Log out
			</button>
		{:else}
			<a
				href="/login"
				class="hover:bg-[#676767] rounded-t-md flex items-center justify-center pt-[3px] pb-[2px]"
				>Log in</a
			>
			<a
				href="/signup"
				class="hover:bg-[#676767] rounded-b-md flex items-center justify-center pt-[3px] pb-[4px]"
				>Sign up</a
			>
		{/if}
	</div>
{/if}

{#if open}
	<button class="btn-icon button-div" on:click={closeRail}
		><Cross size="26px" color="#9c9c9c" /></button
	>
{:else}
	<button class="btn-icon button-div" on:click={openRail}
		><Menu size="26px" color="#9c9c9c" /></button
	>
{/if}

<div class="flex w-full h-full text-white text-[14px]">
	{#if open}
		<div class="flex flex-col pt-[40px] w-[62px] bg-[#272727] border-r-[.3px] border-gray-500">
			<div class="h-0 w-[42px] ml-auto mr-auto border-b-[.3px] border-gray-500 mb-[8px]" />
			<a
				href="/home/docs"
				class="tab {currentUrl === 'docs' ? 'bg-[#454545]' : 'hover:bg-[#45454570]'}">Docs</a
			>
			<a
				href="/home/tree"
				class="tab {currentUrl === 'tree' ? 'bg-[#454545]' : 'hover:bg-[#45454570]'}">Tree</a
			>
			<a
				href="/home/team"
				class="tab {currentUrl === 'team' ? 'bg-[#454545]' : 'hover:bg-[#45454570]'}">Team</a
			>
			<a
				href="/home/learn"
				class="tab {currentUrl === 'learn' ? 'bg-[#454545]' : 'hover:bg-[#45454570]'}">Learn</a
			>
			<a href="/home/settings" class="mt-auto ml-auto mr-auto mb-[14px]"
				><Settings color="#9c9c9c" size="33px" /></a
			>
		</div>
	{/if}
	<div class="w-full h-full overflow-hidden"><slot /></div>
</div>

<style>
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
		margin-top: 6px;
		margin-left: auto;
		margin-right: auto;
		width: 47px;
		height: 47px;
	}
</style>
