<script lang="ts">
	import InfiniteCanvas from './InfiniteCanvas.svelte';
	import { createTree } from '$lib/stores/nodes.ts';
	import { setContext, getContext, tick } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import TitleModal from '$lib/components/TitleModal.svelte';

	export let data;

	let profileDropE: HTMLDivElement;
	let modalInput: HTMLInputElement;

	let initials = false;
	let profDropdown = false;

	const nodeAction = writable<string | null>(null);
	setContext('nodeActionStore', nodeAction);
	const canvasAction = writable<string | null>(null);
	setContext('canvasActionStore', canvasAction);
	const treeAction = writable<string | null>(null);
	setContext('treeActionStore', treeAction);
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
<div class="flex flex-col h-full w-full">
	<div
		class="relative flex items-center w-full h-[40px] bg-[#272727] border-b-[.3px] border-b-[#70747c]"
	>
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

<style>
	.curve-r-part-v {
		content: '';
		position: absolute;
		bottom: 0;
		background: #272727;
		width: 10px;
		height: 20px;
		top: -0.6px;
		left: 10px;
	}
	.curve-r-part-h {
		position: absolute;
		bottom: 0;
		background: #272727;
		width: 20px;
		height: 11px;
		top: -1px;
		left: -0.6px;
	}

	.curve-l-part-v {
		content: '';
		position: absolute;
		bottom: 0;
		background: #272727;
		width: 11px;
		height: 20px;
		top: -0.6px;
		left: -1px;
	}
	.curve-l-part-h {
		position: absolute;
		bottom: 0;
		background: #272727;
		width: 20px;
		height: 11px;
		top: -1px;
		left: -0.6px;
	}

	.tab {
		position: relative;
		/* Other styles... */
	}

	.tab::before,
	.tab::after {
		content: '';
		position: absolute;
		bottom: 0;
		width: 10px;
		height: 10px;
		background: inherit;
	}
	.tab::before {
		left: -10px;
		transform-origin: top right;
	}

	.tab::after {
		right: -10px;
		transform-origin: top left;
	}
</style>
