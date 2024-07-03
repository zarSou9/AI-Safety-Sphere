<script lang="ts">
	import { createTree } from '$lib/stores/nodes.ts';
	import { setContext, tick, onMount } from 'svelte';
	import { page } from '$app/stores';
	import { writable } from 'svelte/store';
	import { fly, fade, slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import type {
		CategoriesModal,
		NewNodeModalStore,
		EditThreadInfoStore,
		ExtraContextStore,
		EditPermissionsStore
	} from '$lib/types';

	import InfiniteCanvas from './components/InfiniteCanvas.svelte';
	import TitleModal from '$lib/components/TitleModal.svelte';
	import NewSection from '$lib/components/NewSection.svelte';
	import NewNodeModal from '$lib/components/NewNodeModal.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import InfoModal from '$lib/components/InfoModal.svelte';
	import CategoriesPopup from '$lib/components/CategoriesPopup.svelte';
	import EditThreadInfo from '$lib/components/EditThreadInfo.svelte';
	import EditPermissions from '$lib/components/EditPermissions.svelte';
	import Profile from '$lib/icons/Profile.svelte';

	import Cross from '$lib/icons/Cross.svelte';
	import ThreeDots from '$lib/icons/ThreeDots.svelte';
	import Bold from '$lib/icons/tool-bar/Bold.svelte';
	import Italic from '$lib/icons/tool-bar/Italic.svelte';
	import AlignC from '$lib/icons/tool-bar/AlignC.svelte';
	import AlignJ from '$lib/icons/tool-bar/AlignJ.svelte';
	import AlignL from '$lib/icons/tool-bar/AlignL.svelte';
	import AlignR from '$lib/icons/tool-bar/AlignR.svelte';
	import Dedent from '$lib/icons/tool-bar/Dedent.svelte';
	import Fx from '$lib/icons/tool-bar/Fx.svelte';
	import Image from '$lib/icons/tool-bar/Image.svelte';
	import Indent from '$lib/icons/tool-bar/Indent.svelte';
	import Link from '$lib/icons/tool-bar/Link.svelte';
	import Quote from '$lib/icons/tool-bar/Quote.svelte';
	import Strike from '$lib/icons/tool-bar/Strike.svelte';
	import Subscript from '$lib/icons/tool-bar/Subscript.svelte';
	import Superscript from '$lib/icons/tool-bar/Superscript.svelte';
	import Underline from '$lib/icons/tool-bar/Underline.svelte';
	import Video from '$lib/icons/tool-bar/Video.svelte';

	export let data;

	let toolBarDropE: HTMLButtonElement;
	let toolbarResult: any = { title: '', after: '', div: {} };
	let titleResult: any = { title: '', div: {} };
	let toolBarMenuDropdown = false;
	let confirmationModalVisible = false;
	let infoModalVisible = true;
	if (data.props.loggedIn) infoModalVisible = false;

	let profDropdown = false;

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
	const newNodeModal: NewNodeModalStore = writable({
		visible: false,
		title: '',
		allowedTypes: []
	});
	setContext('newNodeModalStore', newNodeModal);
	const sectionModal: any = writable({
		visible: false,
		title: '',
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
	const toolBarDefault = writable(false);
	setContext('toolBarDefaultStore', toolBarDefault);
	const toolBarForOwner = writable(false);
	setContext('toolBarForOwnerStore', toolBarForOwner);
	const toolBarThread = writable(false);
	setContext('toolBarThreadStore', toolBarThread);
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
	const bolded = writable(false);
	setContext('boldedStore', bolded);
	const italicized = writable(false);
	setContext('italicizedStore', italicized);
	const underlined = writable(false);
	setContext('underlinedStore', underlined);
	const striked = writable(false);
	setContext('strikedStore', striked);
	const scripted: any = writable(false);
	setContext('scriptedStore', scripted);
	const quoted = writable(false);
	setContext('quotedStore', quoted);
	const aligned: any = writable(false);
	setContext('alignedStore', aligned);
	const linkInput: any = writable(false);
	setContext('linkInputStore', linkInput);
	const categoriesModal = writable(undefined as CategoriesModal | undefined);
	setContext('categoriesModalStore', categoriesModal);
	const editThreadInfo: EditThreadInfoStore = writable({
		visible: false,
		title: '',
		tldr: '',
		vote_message: ''
	});
	setContext('editThreadInfoStore', editThreadInfo);
	const extraContext: ExtraContextStore = writable([]);
	setContext('extraContextStore', extraContext);
	const editPermissions: EditPermissionsStore = writable({
		visible: false,
		members: [],
		owners: [],
		type: 'Default',
		anyonePermissions: 'Can view',
		memberPermissions: 'Can edit'
	});
	setContext('editPermissionsStore', editPermissions);
	const learnMore = writable<boolean>(false);
	setContext('learnMoreStore', learnMore);
	const pageOffset = writable<number | undefined>(undefined);
	setContext('pageOffsetStore', pageOffset);

	const tree = createTree();
	tree.setClientTree(data.props.hier);

	setContext('tree', tree);

	$: if ($titleModal.visible) {
		titleResult.title = $titleModal.title;
		tick().then(() => titleResult.div?.focus());
	}
	$: if ($newStrategyTitleModal.visible) {
		titleResult.title = $newStrategyTitleModal.title;
		tick().then(() => titleResult.div?.focus());
	}
	$: if ($newNodeModal.visible) {
		tick().then(() => $newNodeModal.input?.focus());
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
		toolBarDefault.subscribe((v) => {
			if (!v) {
				toolBarMenuDropdown = false;
				window.removeEventListener('click', handleMouseOut);
			}
		});
	});

	let alignBar = false;
	let linkBar = false;
	let linkInputElement: HTMLInputElement;
	function closeAlignBar() {
		window.removeEventListener('click', closeAlignBar);
		alignBar = false;
	}
	function closeLinkBar() {
		window.removeEventListener('click', closeLinkBar);
		linkBar = false;
	}

	let profileDropE: HTMLDivElement;

	function click(event: MouseEvent) {
		const { clientX, clientY } = event;
		const rect = profileDropE?.getBoundingClientRect();
		const isWithinProfileDropE =
			clientX >= rect?.left &&
			clientX <= rect?.right &&
			clientY >= rect?.top &&
			clientY <= rect?.bottom;

		if (!isWithinProfileDropE) {
			profDropdown = false;
			window.removeEventListener('click', click);
		}
	}
	async function signout() {
		await fetch('/actions/signout', {
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
</script>

{#if profDropdown}
	<div
		class="fixed z-[200] top-[38px] right-[12px] w-[63px] rounded-md bg-[#414141] grid text-sm text-[#ebebeb]"
		transition:slide={{ duration: 70 }}
		on:click={() => {
			profDropdown = false;
			window.removeEventListener('click', click);
		}}
		role="presentation"
		bind:this={profileDropE}
	>
		{#if data?.props?.loggedIn}
			<button
				on:click={signout}
				class="hover:bg-[#515151] text-red-400 rounded-md flex items-center justify-center py-[2px]"
			>
				Log out
			</button>
		{:else}
			<a
				href="/login"
				class="hover:bg-[#515151] rounded-t-md flex items-center justify-center pt-[3px] pb-[2px]"
				>Log in</a
			>
			<a
				href="/signup"
				class="hover:bg-[#515151] rounded-b-md flex items-center justify-center pt-[3px] pb-[4px]"
				>Sign up</a
			>
		{/if}
	</div>
{/if}

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
{:else if $newNodeModal.visible}
	<NewNodeModal
		{newNodeModal}
		titleMessage="New Node Title"
		on:save={() => {
			treeAction.set('create-new-node');
			$newNodeModal.visible = false;
		}}
	/>
{:else if $categoriesModal?.visible}
	<CategoriesPopup
		{categoriesModal}
		on:save={() => {
			treeAction.set('save-new-categories');
		}}
	/>
{:else if $editThreadInfo?.visible}
	<EditThreadInfo
		{editThreadInfo}
		on:save={() => {
			nodeAction.set('save-thread-info');
		}}
	/>
{:else if $editPermissions?.visible}
	<EditPermissions
		{editPermissions}
		on:save={() => {
			nodeAction.set('save-permissions');
		}}
	/>
{:else if confirmationModalVisible}
	<ConfirmationModal
		on:delete={() => {
			confirmationModalVisible = false;
			nodeAction.set('delete');
		}}
		on:close={() => {
			confirmationModalVisible = false;
		}}
	/>
{:else if infoModalVisible}
	<InfoModal
		on:close={() => {
			infoModalVisible = false;
		}}
		on:learn-more={() => {
			infoModalVisible = false;
			setTimeout(() => learnMore.set(true), 50);
		}}
	/>
{/if}

{#if $successPopUp && successWait()}
	<div
		in:fly={{ duration: 300, x: 0, y: 200, opacity: 0.5, easing: quintOut }}
		class="z-[400] fixed left-0 bottom-[20px] w-[100vw] flex items-center justify-center"
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
		{#if $toolBarThread}
			<div
				transition:fade={{ duration: 100 }}
				class="h-[28px] bg-[#303032] flex rounded-full ml-[233px] w-[69%] items-center flex-shrink-0"
			>
				<button
					bind:this={toolBarDropE}
					on:click={() => {
						toolBarMenuDropdown = !toolBarMenuDropdown;
						if (toolBarMenuDropdown) {
							window.addEventListener('click', handleMouseOut);
						}
					}}
					class="p-[4px] px-[4.5px] rounded-[5px] ml-auto mr-[16px] relative {toolBarMenuDropdown
						? 'bg-[#3f3f3f]'
						: 'hover:bg-[#393939]'}"
				>
					<ThreeDots color="#9c9c9c" size="14px" />
					{#if toolBarMenuDropdown}
						<div
							in:slide={{ duration: 100, easing: quintOut }}
							out:slide={{ delay: 100, duration: 100, easing: quintOut }}
							class="absolute z-[20] w-[150px] bg-[#474747] rounded-[5px] top-[25px] right-[0px] flex flex-col text-[12px] py-[5px] space-y-[1px]"
						>
							<button
								on:click={() => {
									nodeAction.set('edit-thread-info');
								}}
								class="hover:bg-[#626262] pl-[10px] py-[3px] flex justify-start">Edit Info</button
							>
							<button
								on:click={() => {
									nodeAction.set('edit-permissions');
								}}
								class="hover:bg-[#626262] pl-[10px] py-[3px] flex justify-start">Permissions</button
							>
							<button
								on:click={() => {
									confirmationModalVisible = true;
								}}
								class="hover:bg-[#934a4a] pl-[10px] py-[3px] flex justify-start">Delete Node</button
							>
						</div>
					{/if}
				</button>
			</div>{/if}
		{#if $toolBarDefault}
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
					class="ml-[2px] p-[3px] rounded-[5px] {$italicized
						? 'bg-[#7db1ff25]'
						: ' hover:bg-[#393939]'}"><Italic color="#9c9c9c" size="16px" /></button
				>
				<button
					on:click={() => {
						nodeAction.set('underline');
					}}
					class="ml-[2px] p-[2.5px] rounded-[5px] {$underlined
						? 'bg-[#7db1ff25]'
						: ' hover:bg-[#393939]'}"><Underline color="#9c9c9c" size="17px" /></button
				>
				<button
					on:click={() => {
						nodeAction.set('strike');
					}}
					class="ml-[2px] p-[2px] rounded-[5px] {$striked
						? 'bg-[#7db1ff25]'
						: ' hover:bg-[#393939]'}"><Strike color="#9c9c9c" size="18px" /></button
				>
				<button
					on:click={() => {
						nodeAction.set('color');
					}}
					class="ml-[2px] p-[2px] relative rounded-[5px] size-[22px] hover:bg-[#393939]"
				>
					<div
						class="text-[#9c9c9c] text-[14px] font-[300] leading-[0] flex items-center justify-center absolute w-full left-0 top-[3px] h-[14.5px]"
					>
						A
					</div>
					<div class="w-[70%] bottom-[4px] left-[15%] h-[1px] rounded-full bg-[#9c9c9c] absolute" />
				</button>
				<button
					on:click={() => {
						nodeAction.set('subscript');
					}}
					class="ml-[20px] px-[3px] pt-[4px] pb-[2px] rounded-[5px] {$scripted === 'sub'
						? 'bg-[#7db1ff25]'
						: ' hover:bg-[#393939]'}"><Subscript color="#9c9c9c" size="16px" /></button
				>
				<button
					on:click={() => {
						nodeAction.set('superscript');
					}}
					class="ml-[2px] px-[3px] pt-[2px] pb-[4px] rounded-[5px] {$scripted === 'super'
						? 'bg-[#7db1ff25]'
						: ' hover:bg-[#393939]'}"><Superscript color="#9c9c9c" size="16px" /></button
				>
				<button
					on:click={() => {
						nodeAction.set('dedent');
					}}
					class="ml-[20px] p-[3px] rounded-[5px] hover:bg-[#393939]"
					><Dedent color="#9c9c9c" size="16px" /></button
				>
				<button
					on:click={() => {
						nodeAction.set('indent');
					}}
					class="p-[3px] rounded-[5px] hover:bg-[#393939]"
					><Indent color="#9c9c9c" size="16px" /></button
				>
				<button
					on:click={() => {
						alignBar = !alignBar;
						if (alignBar) setTimeout(() => window.addEventListener('click', closeAlignBar), 2);
					}}
					class="ml-[4px] p-[3px] rounded-[5px] relative {$aligned
						? 'bg-[#7db1ff25]'
						: !alignBar
							? 'hover:bg-[#393939]'
							: 'bg-[#393939]'}"
				>
					{#if $aligned === 'right'}
						<AlignR color="#9c9c9c" size="16px" />
					{:else if $aligned === 'center'}
						<AlignC color="#9c9c9c" size="16px" />
					{:else if $aligned === 'justify'}
						<AlignJ color="#9c9c9c" size="16px" />
					{:else}
						<AlignL color="#9c9c9c" size="16px" />
					{/if}
					{#if alignBar}
						<div
							class="z-[10] flex absolute p-[4px] bg-[#303032] rounded-[6px] bottom-[-35px] left-[-10px] border-[.3px] border-[#47494c]"
						>
							<button
								on:click={() => {
									nodeAction.set('al');
								}}
								class="p-[3px] rounded-[5px] {!$aligned ? 'bg-[#7db1ff25]' : ' hover:bg-[#393939]'}"
								><AlignL color="#9c9c9c" size="16px" />
							</button>
							<button
								on:click={() => {
									nodeAction.set('ac');
								}}
								class="ml-[3px] p-[3px] rounded-[5px] {$aligned === 'center'
									? 'bg-[#7db1ff25]'
									: ' hover:bg-[#393939]'}"
								><AlignC color="#9c9c9c" size="16px" />
							</button>
							<button
								on:click={() => {
									nodeAction.set('ar');
								}}
								class="ml-[3px] p-[3px] rounded-[5px] {$aligned === 'right'
									? 'bg-[#7db1ff25]'
									: ' hover:bg-[#393939]'}"
								><AlignR color="#9c9c9c" size="16px" />
							</button>
							<button
								on:click={() => {
									nodeAction.set('aj');
								}}
								class="ml-[3px] p-[3px] rounded-[5px] {$aligned === 'justify'
									? 'bg-[#7db1ff25]'
									: ' hover:bg-[#393939]'}"
								><AlignJ color="#9c9c9c" size="16px" />
							</button>
						</div>
					{/if}
				</button>
				<button
					on:click={() => {
						nodeAction.set('quote');
					}}
					class="ml-[20px] p-[4.5px] rounded-[5px] {$quoted
						? 'bg-[#7db1ff25]'
						: ' hover:bg-[#393939]'}"><Quote color="#9c9c9c" size="13px" /></button
				>
				<button
					on:click={(e) => {
						if (!linkBar) {
							$linkInput = '';
							linkBar = true;
							nodeAction.set('get-selection');
							setTimeout(() => {
								window.addEventListener('click', closeLinkBar);
								linkInputElement.focus();
							}, 3);
						} else e.stopPropagation();
					}}
					class="ml-[2px] p-[1.5px] rounded-[5px] relative {linkBar
						? 'bg-[#393939]'
						: 'hover:bg-[#393939]'} "
				>
					<Link color="#9c9c9c" size="19px" />
					{#if linkBar}
						<div
							class="z-[10] flex absolute p-[6px] bg-[#303032] rounded-[6px] bottom-[-46px] left-[-10px] border-[.3px] border-[#47494c]"
						>
							<input
								bind:this={linkInputElement}
								bind:value={$linkInput}
								class="text-[#000000] selection:bg-[#7db1ff] pl-[3px]"
							/>
							<button
								class="ml-[10px] border-[1px] border-[#0e67d3] hover:bg-[#0e67d3] px-[10px]"
								on:click={(e) => {
									e.stopPropagation();
									window.removeEventListener('click', closeLinkBar);
									linkBar = false;
									nodeAction.set('link');
								}}
							>
								save
							</button>
						</div>
					{/if}
				</button>
				<button
					on:click={() => {
						nodeAction.set('fx');
					}}
					class="ml-[2px] p-[4.5px] rounded-[5px] hover:bg-[#393939]"
					><Fx color="#9c9c9c" size="13px" /></button
				>
				<button
					on:click={() => {
						nodeAction.set('image');
					}}
					class="ml-[20px] p-[2.5px] rounded-[5px] hover:bg-[#393939]"
					><Image color="#9c9c9c" size="17px" /></button
				>
				<button
					on:click={() => {
						nodeAction.set('video');
					}}
					class="ml-[2px] p-[3px] mr-auto rounded-[5px] hover:bg-[#393939]"
					><Video color="#9c9c9c" size="16px" /></button
				>

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
							class="absolute z-[20] w-[150px] bg-[#474747] rounded-[5px] space-y-[3px] top-[25px] right-[0px] flex flex-col text-[12px] py-[5px]"
						>
							<button
								on:click={() => {
									nodeAction.set('start-new-section');
								}}
								class="hover:bg-[#626262] pl-[10px] py-[3px] flex justify-start">New Section</button
							>
							{#if $toolBarForOwner}
								<button
									on:click={() => {
										nodeAction.set('edit-permissions');
									}}
									class="hover:bg-[#626262] pl-[10px] py-[3px] flex justify-start"
									>Permissions</button
								>
								<button
									on:click={() => {
										confirmationModalVisible = true;
									}}
									class="hover:bg-[#934a4a] pl-[10px] py-[3px] flex justify-start"
									>Delete Node</button
								>
							{/if}
						</div>
					{/if}
				</button>
			</div>
		{/if}
		<div
			class="relative flex items-center w-full h-[40px] bg-[#272727] border-b-[.3px] border-b-[#70747c] flex-shrink-0"
		>
			<div class="w-[.6px] h-[26px] bg-[#70747c] mr-[15px] ml-auto" />
			<button
				class="flex items-center justify-center mr-[12px] rounded-full size-[25px] border-[1px] {profDropdown
					? 'border-[#cccccc] fill-[#cccccc]'
					: 'border-[#989898] fill-[#989898]'}  hover:border-[#cccccc] hover:fill-[#cccccc] transition-colors flex-grow-0 flex-shrink-0 overflow-hidden"
				on:click={() => {
					if (profDropdown) {
						profDropdown = false;
						window.removeEventListener('click', click);
					} else {
						profDropdown = true;
						setTimeout(() => {
							window.addEventListener('click', click);
						}, 200);
					}
				}}
			>
				<Profile size="14px" />
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
