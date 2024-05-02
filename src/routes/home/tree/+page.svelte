<script lang="ts">
	import InfiniteCanvas from './InfiniteCanvas.svelte';
	import { createTree } from '$lib/stores/nodes.ts';
	import { setContext, getContext, tick, onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import TitleModal from '$lib/components/TitleModal.svelte';
	import NewSection from '$lib/components/NewSection.svelte';
	import Bold from '$lib/icons/Bold.svelte';
	import Italic from '$lib/icons/Italic.svelte';
	import Endnote from '$lib/icons/Endnote.svelte';
	import Cross from '$lib/icons/Cross.svelte';
	import ThreeDots from '$lib/icons/ThreeDots.svelte';
	import { fly, fade, slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	export let data;

	let toolBarDropE: HTMLButtonElement;
	let toolbarResult: any = { title: '', after: '', div: {} };
	let titleResult: any = { title: '', div: {} };
	let toolBarMenuDropdown = false;

	const profDropdown: Writable<boolean> = getContext('profDropdownStore');

	const nodeAction = writable<string | null>(null);
	setContext('nodeActionStore', nodeAction);
	const canvasAction = writable<string | null>(null);
	setContext('canvasActionStore', canvasAction);
	const treeAction = writable<string | null>(null);
	setContext('treeActionStore', treeAction);
	const pageAction = writable<string | null>(null);
	setContext('pageActionStore', pageAction);
	const redoTree = writable<boolean>(false);
	setContext('redoTreeStore', redoTree);
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
	const newStrategyTitleModal = writable({
		visible: false,
		title: ''
	});
	setContext('newStrategyTitleModalStore', newStrategyTitleModal);
	const newProblemTitleModal = writable({
		visible: false,
		title: ''
	});
	setContext('newProblemTitleModalStore', newProblemTitleModal);
	const sectionModal: any = writable({
		visible: false,
		title: '',
		suggestions: [],
		sections: [],
		after: 0
	});
	setContext('sectionModalStore', sectionModal);
	const sectionTitleModal = writable({
		visible: false,
		title: ''
	});
	setContext('sectionTitleModalStore', sectionTitleModal);
	const shortCutsEnabled = writable(true);
	setContext('shortCutsEnabledStore', shortCutsEnabled);
	const quillsReady = writable(false);
	setContext('quillsReadyStore', quillsReady);
	const toolBarShown = writable(false);
	setContext('toolBarShownStore', toolBarShown);
	const toolBarDotsShown = writable(false);
	setContext('toolBarDotsShownStore', toolBarDotsShown);
	const bolded = writable(false);
	setContext('boldedStore', bolded);
	const italicized = writable(false);
	setContext('italicizedStore', italicized);
	const successPopUp = writable(false);
	setContext('successPopUpStore', successPopUp);
	const failurePopUp = writable(false);
	setContext('failurePopUpStore', failurePopUp);
	const loginNotif = writable(false);
	setContext('loginNotifStore', loginNotif);
	const sectionContextE = writable(undefined);
	setContext('sectionContextEStore', sectionContextE);
	const nodeToRemove = writable<any>(undefined);
	setContext('nodeToRemoveStore', nodeToRemove);
	const processing = writable(false);
	setContext('processingStore', processing);
	setContext('data', data);

	const tree = createTree();
	if (data.props?.hier[0]?.data?.problem)
		if (data.props?.profile?.selected_strategies) {
			tree.setTree(data.props.hier[0].data, data.props.profile.selected_strategies);
		} else {
			tree.setTree(data.props.hier[0].data, []);
		}

	setContext('tree', tree);

	$: if ($titleModal.visible) {
		titleResult.title = $titleModal.title;
		tick().then(() => titleResult.div?.focus());
	}
	$: if ($newStrategyTitleModal.visible) {
		titleResult.title = $newStrategyTitleModal.title;
		tick().then(() => titleResult.div?.focus());
	}
	$: if ($newProblemTitleModal.visible) {
		titleResult.title = $newProblemTitleModal.title;
		tick().then(() => titleResult.div?.focus());
	}
	$: if ($sectionModal.visible) {
		tick().then(() => toolbarResult.div?.focus());
	}
	$: if ($sectionTitleModal.visible) {
		titleResult.title = $sectionTitleModal.title;
		tick().then(() => titleResult.div?.focus());
	}

	function successWait() {
		setTimeout(() => ($successPopUp = false), 5000);
		return true;
	}
	function failureWait() {
		setTimeout(() => ($failurePopUp = false), 5000);
		return true;
	}
	function loginWait() {
		setTimeout(() => ($loginNotif = false), 5000);
		return true;
	}

	function handleMouseOut(e: MouseEvent) {
		if (e.clientX) {
			const rect = toolBarDropE.getBoundingClientRect();
			const isWithinBounds =
				e.clientX >= rect.left &&
				e.clientX <= rect.right &&
				e.clientY >= rect.top &&
				e.clientY <= rect.bottom;
			if (!isWithinBounds) {
				toolBarMenuDropdown = false;
				window.removeEventListener('click', handleMouseOut);
			}
		}
	}
	onMount(() => {
		toolBarShown.subscribe((v) => {
			if (!v) {
				toolBarMenuDropdown = false;
				window.removeEventListener('click', handleMouseOut);
			}
		});
	});
</script>

{#if $titleModal.visible}
	<TitleModal
		{titleResult}
		on:close={() => {
			$titleModal.visible = false;
		}}
		on:save={() => {
			$titleModal.title = titleResult.title;
			nodeAction.set('save-title');
			$titleModal.visible = false;
		}}
	/>
{:else if $sectionModal.visible}
	<NewSection
		sections={$sectionModal.sections}
		suggestions={$sectionModal.suggestions}
		{toolbarResult}
		on:close={() => {
			$sectionModal.visible = false;
		}}
		on:save={() => {
			$sectionModal.after = toolbarResult.after;
			$sectionModal.title = toolbarResult.title;
			nodeAction.set('save-new-section');
			$sectionModal.visible = false;
		}}
	/>
{:else if $sectionTitleModal.visible}
	<TitleModal
		{titleResult}
		maxLength={28}
		titleMessage="Section Title"
		on:close={() => {
			$sectionTitleModal.visible = false;
		}}
		on:save={() => {
			$sectionTitleModal.title = titleResult.title;
			nodeAction.set('save-section-title');
			$sectionTitleModal.visible = false;
		}}
	/>
{:else if $newStrategyTitleModal.visible}
	<TitleModal
		{titleResult}
		titleMessage="New Strategy Title"
		on:close={() => {
			$newStrategyTitleModal.visible = false;
		}}
		on:save={() => {
			$newStrategyTitleModal.title = titleResult.title;
			treeAction.set('create-new-strategy');
			$newStrategyTitleModal.visible = false;
		}}
	/>
{:else if $newProblemTitleModal.visible}
	<TitleModal
		{titleResult}
		titleMessage="New Problem Title"
		on:close={() => {
			$newProblemTitleModal.visible = false;
		}}
		on:save={() => {
			$newProblemTitleModal.title = titleResult.title;
			nodeAction.set('create-new-problem');
			$newProblemTitleModal.visible = false;
		}}
	/>
{/if}

{#if $successPopUp && successWait()}
	<div
		in:fly={{ duration: 300, x: 0, y: 200, opacity: 0.5, easing: quintOut }}
		class="fixed left-0 bottom-[20px] w-[100vw] flex items-center justify-center"
	>
		<div
			class="z-[400] flex bg-[#ffffff] py-[10px] rounded-[6px]"
			style="box-shadow: -4px 4px #4ad36c;"
		>
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
		class="z-[400] fixed left-0 bottom-[20px] w-[100vw] flex items-center justify-center"
	>
		<div class="flex bg-[#ffffff] py-[10px] rounded-[6px]" style="box-shadow: -4px 4px #be4141;">
			<p class="text-[#000000] mr-[20px] ml-[25px]">{$failurePopUp}</p>
			<button class="mr-[15px]" on:click={() => ($failurePopUp = false)}
				><Cross color="#70747c" size="16px" /></button
			>
		</div>
	</div>
{/if}
{#if $loginNotif && loginWait()}
	<div
		in:fly={{ duration: 300, x: 0, y: 200, opacity: 0.5, easing: quintOut }}
		class="z-[400] fixed left-0 bottom-[20px] w-[100vw] flex items-center justify-center"
	>
		<div class="flex bg-[#ffffff] py-[10px] rounded-[6px]" style="box-shadow: -4px 4px #be4141;">
			<p class="text-[#000000] mr-[20px] ml-[25px]">
				You must <a class="text-[#3476c2] hover:underline" href="/login">log in</a> to make edits
			</p>
			<button class="mr-[15px]" on:click={() => ($loginNotif = false)}
				><Cross color="#70747c" size="16px" /></button
			>
		</div>
	</div>
{/if}
{#if $processing}
	<div class="spinner fixed bottom-[20px] right-[20px]" />
{/if}

<div class="flex flex-col h-full w-full">
	<div
		class="relative flex items-center w-full h-[40px] bg-[#272727] border-b-[.3px] border-b-[#70747c]"
	>
		{#if $toolBarShown}
			<div
				transition:fade={{ duration: 100 }}
				class="h-[28px] bg-[#303032] flex rounded-full ml-[233px] w-[69%] items-center flex-shrink-0"
			>
				<button
					on:click={() => {
						nodeAction.set('bold');
					}}
					class="ml-[20px] p-[3px] rounded-[5px] {$bolded
						? 'bg-[#7db1ff25]'
						: ' hover:bg-[#393939]'}"><Bold color="#9c9c9c" size="16px" /></button
				>
				<button
					on:click={() => {
						nodeAction.set('italic');
					}}
					class="ml-[2px] p-[3px] rounded-[5px] mr-[10px] {$italicized
						? 'bg-[#7db1ff25]'
						: ' hover:bg-[#393939]'}"><Italic color="#9c9c9c" size="16px" /></button
				>
				<div class="w-[.6px] h-[18px] bg-[#585a61]" />
				<button
					on:click={() => {
						nodeAction.set('Endnote');
					}}
					class="ml-[10px] mr-auto hover:bg-[#393939] p-[4px] px-[4.5px] rounded-[5px]"
					><Endnote color="#9c9c9c" size="14px" /></button
				>
				{#if $toolBarDotsShown}
					<button
						bind:this={toolBarDropE}
						on:click={() => {
							toolBarMenuDropdown = !toolBarMenuDropdown;
							if (toolBarMenuDropdown) {
								window.addEventListener('click', handleMouseOut);
							}
						}}
						class="p-[4px] px-[4.5px] rounded-[5px] mr-[16px] relative {toolBarMenuDropdown
							? 'bg-[#3f3f3f]'
							: 'hover:bg-[#393939]'}"
					>
						<ThreeDots color="#9c9c9c" size="14px" />
						{#if toolBarMenuDropdown}
							<div
								in:slide={{ duration: 100, easing: quintOut }}
								out:slide={{ delay: 100, duration: 100, easing: quintOut }}
								class="absolute z-[20] w-[150px] bg-[#474747] rounded-[6px] top-[25px] right-[0px] flex flex-col text-[12px] py-[8px]"
							>
								<button
									on:click={() => {
										nodeAction.set('start-new-section');
									}}
									class="hover:bg-[#626262] pl-[10px] flex justify-start">New Section</button
								>
								<button
									on:click={() => {
										nodeAction.set('delete');
									}}
									class="hover:bg-[#934a4a] pl-[10px] flex justify-start">Delete Node</button
								>
							</div>
						{/if}
					</button>
				{/if}
			</div>
		{/if}
		<div
			class="relative flex items-center w-full h-[40px] bg-[#272727] border-b-[.3px] border-b-[#70747c]"
		>
			<div class="w-[.6px] h-[26px] bg-[#70747c] mr-[15px] ml-auto" />
			<button
				class="flex items-center mr-[12px] rounded-full size-[25px] flex-grow-0 flex-shrink-0 overflow-hidden"
				on:click={() => ($profDropdown = true)}
			>
				<img src="/images/profile_pic.png" alt="profile" />
			</button>
		</div>
	</div>
	<div class="flex-1 overflow-hidden">
		<InfiniteCanvas />
	</div>
</div>

<style>
	.spinner {
		border: 2.5px solid #232323;
		border-top: 2.5px solid #3498db;
		border-radius: 50%;
		width: 35px;
		height: 35px;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
