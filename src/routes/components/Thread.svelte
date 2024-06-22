<script lang="ts">
	import { onMount, onDestroy, tick, getContext } from 'svelte';
	import type { TreeInterface, TreeArrayNode, ThreadPost } from '$lib/types';
	import { type Writable } from 'svelte/store';
	import type { PageData } from '../$types';

	import View from '$lib/icons/View.svelte';
	import Exit from '$lib/icons/Exit.svelte';
	import ToolTip from '$lib/components/ToolTip.svelte';
	import ThreeDots from '$lib/icons/ThreeDots.svelte';

	const tree: TreeInterface = getContext('tree');
	const viewingNode: Writable<any> = getContext('viewingNodeStore');
	const nodeAction: Writable<string | null> = getContext('nodeActionStore');
	const canvasAction: Writable<string | null> = getContext('canvasActionStore');
	const shortCutsEnabled: any = getContext('shortCutsEnabledStore');
	const treeAction: Writable<string | null> = getContext('treeActionStore');
	const data: PageData = getContext('data');
	const toolBarShown: Writable<boolean> = getContext('toolBarShownStore');
	const toolBarDotsShown: Writable<boolean> = getContext('toolBarDotsShownStore');
	const successPopUp: Writable<any> = getContext('successPopUpStore');
	const failurePopUp: Writable<any> = getContext('failurePopUpStore');
	const nodeToRemove: Writable<any> = getContext('nodeToRemoveStore');
	const processing: Writable<boolean> = getContext('processingStore');
	const loginNotif: Writable<any> = getContext('loginNotifStore');

	export let treeData: TreeArrayNode;

	let shadowColor: string = treeData.parent?.category.color || '';

	let exitIcon = false;
	let posting = false;

	let nodeActionUnsubscribe: any;
	let readBtnActive = true;

	let owner: boolean;
	let voteMessagePlaceholder =
		"e.g. do you think this comment is more or less constructive that it's currently ranked";
	let username = data.props?.profile?.username;
	if (treeData?.treeNode?.owners?.includes(username)) owner = true;

	let posts: ThreadPost[] = [];
	let voteMessage: string = '';
	let commenting = false;
	let comment = '';
	let commentTextarea: HTMLTextAreaElement;
	const day = 1000 * 60 * 60 * 24;
	const week = day * 7;
	const month = day * 30;
	const year = day * 365;
	const now = Date.now();

	onMount(async () => {
		const { data: response } = await data.supabase
			.from('Threads')
			.select('posts,vote_message')
			.eq('uuid', treeData.treeNode.uuid);
		if (response) {
			posts = response[0].posts;
			voteMessage = response[0].vote_message;
		}
	});

	function escapeNode() {
		readBtnActive = true;
		window.removeEventListener('keydown', handleKeyDown);
		toolBarShown.set(false);
		toolBarDotsShown.set(false);
		exitIcon = false;
		canvasAction.set('zoom-out-from-node');
	}
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			escapeNode();
		}
	}
	function startListening() {
		nodeActionUnsubscribe = nodeAction.subscribe((action) => {
			if (action) {
				if (action === 'save-title') {
				} else if (action === 'clean-up') {
					$viewingNode = false;
					$shortCutsEnabled = true;
				} else if (action === 'delete') {
					escapeNode();
					setTimeout(() => {
						nodeToRemove.set(treeData?.treeNode.uuid);
						treeAction.set('remove-node');
					}, 300);
				} else if (action === 'expand-node') {
					window.addEventListener('keydown', handleKeyDown);
					treeAction.set('calibrate-node-height');
					readBtnActive = true;
					exitIcon = true;
				}
				nodeAction.set(null);
			}
		});
	}

	async function postComment() {
		if (posting) await waitForServer();
		posting = true;
		$processing = true;
		try {
			const response = await fetch('/actions/post_comment', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					userId: data.session?.user.id,
					uuid: treeData?.treeNode.uuid,
					comment
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
			commenting = false;
			$shortCutsEnabled = true;
			posts = result.data;
		} catch (error: any) {
			failurePopUp.set('Error: ' + error.message);
			throw error;
		} finally {
			posting = false;
			$processing = false;
		}
	}

	function waitForServer() {
		return new Promise<void>((resolve, reject) => {
			const intervalId = setInterval(() => {
				if (!posting) {
					clearInterval(intervalId);
					resolve();
				}
			}, 50);
			setTimeout(() => {
				clearInterval(intervalId);
				reject(new Error('Condition not met within time limit'));
			}, 4000);
		});
	}

	function toggleRead() {
		if (!$viewingNode) {
			readBtnActive = false;
			$shortCutsEnabled = false;
			$viewingNode = treeData?.treeNode.uuid;
			startListening();
			treeAction.set('find-node-position');
		} else escapeNode();
	}
	function editInfo() {
		if ($viewingNode) {
		}
	}
	function getTime(created_at: number) {
		const diff = now - created_at;
		if (diff < week) return Math.round(diff / day) + 'd';
		if (diff < month) return Math.round(diff / week) + 'w';
		if (diff < year) return Math.round(diff / month) + 'mo';
		return Math.round(diff / year) + 'y';
	}
</script>

<div
	class="flex flex-col overflow-auto bg-[#1f1f1f] rounded-[20px] w-[800px] px-[64px] py-[42px] relative selection:bg-[#6a87b389] max-h-[550px]"
	style={`box-shadow: -2px 2px ${shadowColor}`}
>
	<button
		on:click={toggleRead}
		disabled={!readBtnActive}
		class="absolute top-[53px] right-[64px] rounded-md w-[36px] h-[36px] items-center transition-colors justify-center {readBtnActive
			? 'hover:bg-[#4949495a]'
			: ''}"
	>
		{#if exitIcon}
			<Exit color={readBtnActive ? '#9c9c9c' : '#595959'} size="36px" />
		{:else}
			<View color={readBtnActive ? '#9c9c9c' : '#595959'} size="36px" />
		{/if}
	</button>
	<p class="text-[35px] font-[500]" on:dblclick={editInfo}>
		{treeData.parent?.category.title}
	</p>
	<p class="text-[#bdbdbd] mt-[4px] mb-[25px] text-[14px]" on:dblclick={editInfo}>
		{treeData.parent?.category.description}
	</p>
	{#if commenting}
		<textarea
			on:wheel={(e) => e.stopPropagation()}
			bind:value={comment}
			bind:this={commentTextarea}
			rows="3"
			class="bg-[#1f1f1f] outline-none border-[1px] border-[#b7b7b7] rounded-md p-[15px] text-[14px]"
		/>
		<div class="flex items-center mt-[10px]">
			<button
				class="rounded-md text-[13px] px-[5px] ml-auto bg-[#7c3636] transition-colors hover:bg-[#a44848]"
				on:click={() => (commenting = false)}>Cancel</button
			>
			<button
				class="rounded-md text-[13px] px-[5px] ml-[10px] bg-[#374583] transition-colors hover:bg-[#4859a4]"
				on:click={postComment}>Post</button
			>
		</div>
	{:else}
		<button
			on:click={() => {
				commenting = true;
				$shortCutsEnabled = false;
				tick().then(() => commentTextarea.focus());
			}}
			class=" text-[14px] w-full border-[1px] border-[#b7b7b7] border-dotted py-[10px] rounded-md"
			>Add comment</button
		>
	{/if}
	<div class="mt-[20px]">
		{#each posts as post}
			<div
				class="relative w-full text-[14px] rounded-md border-[.9px] border-[#949494] flex flex-col max-h-[140px] px-[16px] py-[12px]"
			>
				<div class="flex">
					<p class="font-[800] mr-[5px]">{post.owner}</p>
					<p class="relative group text-[#b8b8b8]">
						{getTime(post.created_at)}
						<ToolTip className="text-[#f0f0f0]" tip={new Date(post.created_at).toLocaleString()} />
					</p>
				</div>
				<p class="overflow-auto mt-[7px]">{post.post}</p>
				{#if treeData.treeNode.owners?.includes(post.owner) || data.props.profile?.username === post.owner}
					<button
						class="absolute top-[12.5px] right-[12.5px] rotate-90 rounded-md transition-colors hover:bg-[#54545446] p-[3px]"
						><ThreeDots color="#9c9c9c" size="11.5px" /></button
					>
				{/if}
			</div>
		{/each}
	</div>
</div>
