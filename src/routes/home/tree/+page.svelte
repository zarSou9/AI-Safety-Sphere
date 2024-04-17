<script lang="ts">
	import InfiniteCanvas from './InfiniteCanvas.svelte';
	import { createTree } from '$lib/stores/nodes.ts';
	import { setContext, getContext, tick, onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import TitleModal from '$lib/components/TitleModal.svelte';
	import Bold from '$lib/icons/Bold.svelte';
	import Italic from '$lib/icons/Italic.svelte';
	import Endnote from '$lib/icons/Endnote.svelte';
	import Cross from '$lib/icons/Cross.svelte';
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	export let data;

	let profileDropE: HTMLDivElement;
	let modalInput: HTMLInputElement;
	let pageActionUnsubscribe: any;

	let initials = false;
	let profDropdown = false;

	const nodeAction = writable<string | null>(null);
	setContext('nodeActionStore', nodeAction);
	const canvasAction = writable<string | null>(null);
	setContext('canvasActionStore', canvasAction);
	const treeAction = writable<string | null>(null);
	setContext('treeActionStore', treeAction);
	const pageAction = writable<string | null>(null);
	setContext('pageActionStore', pageAction);
	const charPos = { v: 0 };
	setContext('charPos', charPos);
	const viewPort = { height: 0, top: 0 };
	setContext('viewPort', viewPort);
	const viewingNodeRect: { l: number; t: number; w: number; h: number } = {
		l: 0,
		t: 0,
		w: 0,
		h: 0
	};
	setContext('viewingNodeRect', viewingNodeRect);
	const navNodeRect: { l: number; t: number; w: number; h: number } = {
		l: 0,
		t: 0,
		w: 0,
		h: 0
	};
	setContext('navNodeRect', navNodeRect);
	const stratChange: { l: number; t: number } = {
		l: 0,
		t: 0
	};
	setContext('stratChange', stratChange);
	const viewingNode = writable(undefined);
	setContext('viewingNodeStore', viewingNode);
	const nodeHeight = writable(undefined);
	setContext('nodeHeightStore', nodeHeight);
	const titleModal = writable({
		visible: false,
		title: ''
	});
	setContext('titleModalStore', titleModal);
	const shortCutsEnabled = writable(true);
	setContext('shortCutsEnabledStore', shortCutsEnabled);
	const nodeContext = writable(undefined);
	setContext('nodeContextStore', nodeContext);
	const quillsReady = writable(false);
	setContext('quillsReadyStore', quillsReady);
	const toolBarShown = writable(false);
	setContext('toolBarShownStore', toolBarShown);
	const bolded = writable(false);
	setContext('boldedStore', bolded);
	const italicized = writable(false);
	setContext('italicizedStore', italicized);
	const successPopUp = writable(false);
	setContext('successPopUpStore', successPopUp);
	const failurePopUp = writable(false);
	setContext('failurePopUpStore', failurePopUp);
	setContext('data', data);

	const tree = createTree();
	if (data.props?.hier[0]?.data?.problem)
		tree.setTree(
			data.props.hier[0].data,
			data.props.profile.changes,
			data.props.profile.selected_strategies,
			data.props.profile.username
		);
	setContext('tree', tree);

	// onMount(() => {
	// 	pageActionUnsubscribe = pageAction.subscribe((action) => {
	// 		if (action) {

	// 			pageAction.set(null);
	// 		}
	// 	});

	// 	return () => {
	// 		if (pageActionUnsubscribe) pageActionUnsubscribe();
	// 	};
	// });

	function noImage(e: any) {
		e.target.src = '';
		initials = true;
	}
	function profileDropdown() {
		if (!profDropdown) {
			profDropdown = true;
			setTimeout(() => {
				window.addEventListener('click', click);
			}, 200);
		}
	}

	function click(event: MouseEvent) {
		const { clientX, clientY } = event;
		const rect = profileDropE.getBoundingClientRect();
		const isWithinProfileDropE =
			clientX >= rect.left &&
			clientX <= rect.right &&
			clientY >= rect.top &&
			clientY <= rect.bottom;

		if (!isWithinProfileDropE) {
			profDropdown = false;
			window.removeEventListener('click', click);
		}
	}
	$: if ($titleModal.visible) {
		modalInput?.focus();
	}

	function successWait() {
		setTimeout(() => ($successPopUp = false), 4000);
		return true;
	}
	function failureWait() {
		setTimeout(() => ($failurePopUp = false), 4000);
		return true;
	}
</script>

{#if $titleModal.visible}
	<TitleModal
		on:close={() => {
			$titleModal.visible = false;
		}}
		on:save={() => {
			nodeAction.set('save-title');
			$titleModal.visible = false;
		}}
	>
		<input
			bind:this={modalInput}
			bind:value={$titleModal.title}
			class="input mt-[8px] pl-2 pr-1 rounded-sm py-1 border-[.1px] outline-[0px] selection:bg-[#80808080] selection:text-[#f5f5f5]"
		/>
	</TitleModal>
{/if}

{#if profDropdown}
	<div
		class="fixed z-[200] top-[46px] right-[8px] w-[63px] h-[50px] rounded-md bg-[#515151] grid text-sm"
		bind:this={profileDropE}
	>
		<a
			href="/home/settings"
			class="hover:bg-[#676767] rounded-t-md flex items-center justify-center pt-[3px]">Profile</a
		>
		<form
			action="/home?/signout"
			method="post"
			class="hover:bg-[#676767] text-red-400 flex items-center justify-center pb-[3px]"
		>
			<button>Log out</button>
		</form>
	</div>
{/if}
{#if $successPopUp && successWait()}
	<div
		in:fly={{ duration: 300, x: 0, y: 200, opacity: 0.5, easing: quintOut }}
		class="fixed left-0 bottom-[20px] w-[100vw] flex items-center justify-center"
	>
		<div class="flex bg-[#ffffff] py-[10px] rounded-[6px]" style="box-shadow: -4px 4px #4ad36c;">
			<p class="text-[#000000] mr-[20px] ml-[25px]">{$successPopUp}</p>
			<button class="mr-[15px]" on:click={() => ($successPopUp = false)}
				><Cross color="#70747c" size="16px" /></button
			>
		</div>
	</div>
{/if}
{#if $failurePopUp && failureWait()}
	<div
		in:fly={{ duration: 300, x: 0, y: 200, opacity: 0.5, easing: quintOut }}
		class="fixed left-0 bottom-[20px] w-[100vw] flex items-center justify-center"
	>
		<div class="flex bg-[#ffffff] py-[10px] rounded-[6px]" style="box-shadow: -4px 4px #be4141;">
			<p class="text-[#000000] mr-[20px] ml-[25px]">{$failurePopUp}</p>
			<button class="mr-[15px]" on:click={() => ($failurePopUp = false)}
				><Cross color="#70747c" size="16px" /></button
			>
		</div>
	</div>
{/if}

<div class="flex flex-col h-full w-full">
	<div
		class="relative flex items-center w-full h-[40px] bg-[#272727] border-b-[.3px] border-b-[#70747c]"
	>
		{#if $toolBarShown}
			<button
				on:click={() => {
					nodeAction.set('bold');
				}}
				class="ml-[260px] p-[5px] rounded-[5px] {$bolded
					? 'bg-[#7db1ff25]'
					: ' hover:bg-[#353535]'}"><Bold color="#9c9c9c" size="20px" /></button
			>
			<button
				on:click={() => {
					nodeAction.set('italic');
				}}
				class="ml-[8px] p-[5px] rounded-[5px] {$italicized
					? 'bg-[#7db1ff25]'
					: ' hover:bg-[#353535]'}"><Italic color="#9c9c9c" size="20px" /></button
			>
			<button
				on:click={() => {
					nodeAction.set('endnote');
				}}
				class="ml-[20px] hover:bg-[#353535] p-[6.4px] rounded-[5px]"
				><Endnote color="#9c9c9c" size="18px" /></button
			>
		{/if}
		<div class="w-[.6px] h-[26px] bg-[#70747c] mr-[20px] ml-auto" />
		<button
			class="flex items-center mr-[10px] rounded-full size-[25px] overflow-hidden {initials
				? 'bg-[#525555]'
				: ''}"
			on:click={profileDropdown}
		>
			{#if initials}
				<p class="text-sm">MH</p>
			{:else}
				<img src="/images/profile_pic.png" on:error={noImage} alt="profile" />
			{/if}
		</button>
	</div>
	<div class="flex-1 overflow-hidden">
		<InfiniteCanvas />
	</div>
</div>
