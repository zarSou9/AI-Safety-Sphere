<script lang="ts">
	import { onMount, onDestroy, tick, getContext } from 'svelte';
	import type {
		TreeInterface,
		TreeArrayNode,
		ThreadPost,
		TreeNode,
		EditThreadInfoStore
	} from '$lib/types';
	import { type Writable } from 'svelte/store';
	import type { PageData } from '../$types';
	import { fade } from 'svelte/transition';
	import type { ThreadVotes } from '$lib/types';

	import View from '$lib/icons/View.svelte';
	import Exit from '$lib/icons/Exit.svelte';
	import ToolTip from '$lib/components/ToolTip.svelte';
	import ThreeDots from '$lib/icons/ThreeDots.svelte';
	import Vote from '$lib/icons/Vote.svelte';

	const tree: TreeInterface = getContext('tree');
	const viewingNode: Writable<any> = getContext('viewingNodeStore');
	const nodeAction: Writable<string | null> = getContext('nodeActionStore');
	const canvasAction: Writable<string | null> = getContext('canvasActionStore');
	const shortCutsEnabled: any = getContext('shortCutsEnabledStore');
	const treeAction: Writable<string | null> = getContext('treeActionStore');
	const data: PageData = getContext('data');
	const toolBarShown: Writable<boolean> = getContext('toolBarShownStore');
	const toolBarThread: Writable<boolean> = getContext('toolBarThreadStore');
	const successPopUp: Writable<any> = getContext('successPopUpStore');
	const failurePopUp: Writable<any> = getContext('failurePopUpStore');
	const nodeToRemove: Writable<any> = getContext('nodeToRemoveStore');
	const processing: Writable<boolean> = getContext('processingStore');
	const loginNotif: Writable<any> = getContext('loginNotifStore');
	const editThreadInfo: EditThreadInfoStore = getContext('editThreadInfoStore');

	export let treeData: TreeNode;
	export let shadowColor: string;

	let exitIcon = false;
	let posting = false;
	let intervalI = 0;

	let nodeActionUnsubscribe: any;
	let readBtnActive = true;

	let owner: boolean;
	let username = data.props?.profile?.username;
	if (treeData?.owners?.includes(username)) owner = true;

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
			.eq('uuid', treeData.uuid);
		if (response) {
			posts = response[0].posts;
			voteMessage = response[0].vote_message;
			sortPosts();
		}
	});

	function sortPosts() {
		posts.sort((a, b) => a.vote - b.vote);
		const ownedPosts = posts.filter((p) => p.owner === username);
		posts = posts.filter((p) => p.owner !== username);
		posts = [...ownedPosts, ...posts];
	}

	function escapeNode() {
		readBtnActive = true;
		window.removeEventListener('keydown', handleKeyDown);
		toolBarShown.set(false);
		toolBarThread.set(false);
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
					nodeActionUnsubscribe();
					$viewingNode = false;
					$shortCutsEnabled = true;
				} else if (action === 'delete') {
					escapeNode();
					setTimeout(() => {
						nodeToRemove.set(treeData?.uuid);
						treeAction.set('remove-node');
					}, 300);
				} else if (action === 'expand-node') {
					window.addEventListener('keydown', handleKeyDown);
					treeAction.set('calibrate-node-height');
					readBtnActive = true;
					exitIcon = true;
				} else if (action === 'save-thread-info') {
					updateInfo($editThreadInfo.title, $editThreadInfo.tldr, $editThreadInfo.vote_message);
				} else if (action === 'edit-thread-info') {
					activateInfoModal();
				}
				nodeAction.set(null);
			}
		});
	}

	async function updateInfo(title: string, tldr: string, vote_message: string) {
		if (posting) await waitForServer();
		posting = true;
		$processing = true;
		try {
			const response = await fetch('/actions/update_thread_info', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					userId: data.session?.user.id,
					uuid: treeData?.uuid,
					title,
					tldr,
					vote_message
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
			$editThreadInfo.visible = false;
			voteMessage = vote_message;
			treeData.data.title = title;
			treeData.data.tldr = tldr;
		} catch (error: any) {
			failurePopUp.set('Error: ' + error.message);
			throw error;
		} finally {
			posting = false;
			$processing = false;
		}
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
					uuid: treeData?.uuid,
					comment
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
			commenting = false;
			if (!$viewingNode) $shortCutsEnabled = true;
			posts = result.data;
			comment = '';
		} catch (error: any) {
			failurePopUp.set('Error: ' + error.message);
			throw error;
		} finally {
			posting = false;
			$processing = false;
		}
	}
	async function updatePost(postID: string, comment: string) {
		if (posting) await waitForServer();
		posting = true;
		try {
			const response = await fetch('/actions/update_comment', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					userId: data.session?.user.id,
					uuid: treeData?.uuid,
					comment,
					postID
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
		} catch (error: any) {
			failurePopUp.set('Error: ' + error.message);
			throw error;
		} finally {
			posting = false;
		}
	}
	async function deleteComment(postID: string) {
		if (posting) await waitForServer();
		posting = true;
		$processing = true;
		try {
			const response = await fetch('/actions/delete_comment', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					userId: data.session?.user.id,
					uuid: treeData?.uuid,
					postID
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
			posts = result.data;
		} catch (error: any) {
			failurePopUp.set('Error: ' + error.message);
			throw error;
		} finally {
			posting = false;
			$processing = false;
		}
	}
	async function handleVote(vote: number, post: ThreadPost) {
		let userVote = post.votes.find((v) => v.user === username);
		if (userVote?.vote === vote) vote = 0;
		if (!userVote) {
			post.votes.push({ vote, user: username });
		} else {
			post.vote -= userVote.vote;
			userVote.vote = vote;
		}
		post.vote += vote;
		posts = [...posts];

		if (posting) {
			try {
				await waitForVoteServer();
			} catch (error: any) {
				return;
			}
		}
		posting = true;
		try {
			const response = await fetch('/actions/vote_on_thread', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					uuid: treeData?.uuid,
					postID: post.id,
					userId: data.session?.user.id,
					vote
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
		} catch (error: any) {
			failurePopUp.set('Error: ' + error.message);
			throw error;
		}
		posting = false;
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
	function waitForVoteServer() {
		intervalI += 1;
		const thisI = intervalI;
		return new Promise<void>((resolve, reject) => {
			const intervalId = setInterval(() => {
				if (thisI !== intervalI) {
					clearInterval(intervalId);
					reject(new Error('New Interval'));
				}
				if (!posting) {
					clearInterval(intervalId);
					resolve();
				}
			}, 20);
			setTimeout(() => {
				clearInterval(intervalId);
				reject(new Error('Condition not met within time limit'));
			}, 1000);
		});
	}

	function toggleRead() {
		if (!$viewingNode) {
			readBtnActive = false;
			toolBarShown.set(true);
			toolBarThread.set(true);
			$shortCutsEnabled = false;
			$viewingNode = treeData?.uuid;
			startListening();
			treeAction.set('find-node-position');
		} else escapeNode();
	}
	function getTime(created_at: number) {
		const diff = now - created_at;
		if (diff < week) return Math.round(diff / day) + 'd';
		if (diff < month) return Math.round(diff / week) + 'w';
		if (diff < year) return Math.round(diff / month) + 'mo';
		return Math.round(diff / year) + 'y';
	}
	function activateInfoModal() {
		$editThreadInfo.visible = true;
		$editThreadInfo.title = treeData.data.title;
		$editThreadInfo.tldr = treeData.data.tldr;
		$editThreadInfo.vote_message = voteMessage;
	}

	function autoResize(node: HTMLTextAreaElement) {
		function resize() {
			node.style.height = 'auto';
			node.style.height = `${node.scrollHeight}px`;
		}

		node.addEventListener('input', resize);
		resize();

		return {
			destroy() {
				node.removeEventListener('input', resize);
			}
		};
	}
	function getVote(votes: ThreadVotes) {
		return votes.find((v) => v.user === username)?.vote;
	}
</script>

<div
	class="overflow-auto bg-[#1f1f1f] rounded-[20px] w-[800px] px-[64px] py-[42px] relative selection:bg-[#6a87b389] {$viewingNode ||
		'max-h-[550px]'}"
	style={`box-shadow: -2px 2px ${shadowColor}`}
>
	<button
		on:click={toggleRead}
		disabled={!readBtnActive}
		class="absolute top-[53px] right-[63px] rounded-md w-[36px] h-[36px] items-center transition-colors justify-center {readBtnActive
			? 'hover:bg-[#4949495a]'
			: ''}"
	>
		{#if exitIcon}
			<Exit color={readBtnActive ? '#9c9c9c' : '#595959'} size="36px" />
		{:else}
			<View color={readBtnActive ? '#9c9c9c' : '#595959'} size="36px" />
		{/if}
	</button>
	<p
		class="text-[35px] font-[500]"
		on:dblclick={() => {
			if ($viewingNode) {
				activateInfoModal();
				tick().then(() => $editThreadInfo.titleInput?.focus());
			}
		}}
	>
		{treeData.data.title}
	</p>
	{#if treeData.data.tldr}
		<p
			class="text-[#bdbdbd] mt-[4px] text-[14px]"
			on:dblclick={() => {
				if ($viewingNode) {
					activateInfoModal();
					tick().then(() => $editThreadInfo.tldrInput?.focus());
				}
			}}
		>
			{treeData.data.tldr}
		</p>
	{/if}
	{#if commenting}
		<textarea
			on:wheel={(e) => {
				e.preventDefault();
				e.stopPropagation();
			}}
			bind:value={comment}
			bind:this={commentTextarea}
			rows="3"
			class="bg-[#1f1f1f] w-full outline-none border-[1px] mt-[25px] border-[#b7b7b7] rounded-md p-[15px] text-[14px]"
		/>
		<div class="flex items-center mt-[10px]">
			<button
				class="rounded-md text-[13px] px-[6px] ml-auto bg-[#7c3636] transition-colors hover:bg-[#a44848]"
				on:click={() => {
					if (!$viewingNode) $shortCutsEnabled = true;
					commenting = false;
					comment = '';
				}}>Cancel</button
			>
			<button
				class="rounded-md text-[13px] px-[6px] ml-[10px] bg-[#374583] transition-colors hover:bg-[#4859a4]"
				on:click={postComment}>Post</button
			>
		</div>
	{:else}
		<button
			on:click={() => {
				if (data.props.loggedIn) {
					commenting = true;
					$shortCutsEnabled = false;
					tick().then(() => commentTextarea.focus());
				} else $loginNotif = true;
			}}
			class="text-[14px] text-[#e0e0e0] w-full border-[1px] mt-[25px] border-[#b7b7b7] border-dotted py-[10px] rounded-md"
			>Add comment</button
		>
	{/if}
	<div class="mt-[20px]">
		{#each posts as post (post.id)}
			<div
				class="relative w-full text-[14px] mt-[15px] rounded-md border-[.9px] border-[#949494] flex flex-col max-h-[140px] px-[16px] py-[12px]"
			>
				<div class="flex">
					<p class="font-[800] mr-[5px]">{post.owner}</p>
					<p class="relative group text-[#b8b8b8]">
						{getTime(post.created_at)}
						<ToolTip className="text-[#f0f0f0]" tip={new Date(post.created_at).toLocaleString()} />
					</p>
				</div>
				<textarea
					use:autoResize
					bind:this={post.textarea}
					rows="1"
					bind:value={post.post}
					disabled={!post.editing}
					class="overflow-auto mt-[7px] outline-none bg-inherit resize-none"
				/>
				{#if treeData.owners?.includes(post.owner) || username === post.owner}
					<button
						on:click={() => {
							post.openSettings = !post.openSettings;
						}}
						class="absolute top-[12.5px] right-[12.5px] rounded-md transition-colors p-[3px] {post.openSettings
							? 'bg-[#5f5f5f46]'
							: 'hover:bg-[#54545446]'}"
					>
						<div class="rotate-90">
							<ThreeDots color="#9c9c9c" size="11.5px" />
						</div>
						{#if post.openSettings}
							<div
								transition:fade={{ duration: 50 }}
								class="absolute right-[calc(100%+2px)] py-[2px] text-[11px] w-[60px] top-0 rounded-md bg-[#3d3d3d] overflow-hidden"
							>
								<button
									on:click={() => {
										post.editing = true;
										post.previousValue = post.post;
									}}
									class="hover:bg-[#626262] pl-[5px] py-[1px] flex justify-start w-full"
									>Edit</button
								>
								<button
									on:click={() => {
										deleteComment(post.id);
									}}
									class="hover:bg-[#934a4a] mt-[1px] pl-[5px] py-[1px] flex justify-start w-full"
									>Delete</button
								>
							</div>
						{/if}
					</button>
				{/if}
				<div
					class="absolute group top-1/2 -translate-y-1/2 left-0 translate-x-[calc(-6px-100%)] flex flex-col"
				>
					<p
						class="right-[calc(100%+4px)] absolute top-1/2 -translate-y-1/2 text-[11.5px] text-[#b8b8b8]"
					>
						{post.vote}
					</p>
					<button
						on:click={() => {
							if (data.props.loggedIn) handleVote(1, post);
							else $loginNotif = true;
						}}
						class="rotate-90"><Vote voted={getVote(post.votes)} up size="18px" /></button
					>
					<button
						on:click={() => {
							if (data.props.loggedIn) handleVote(-1, post);
							else $loginNotif = true;
						}}
						class="-rotate-90"><Vote voted={getVote(post.votes)} up={false} size="18px" /></button
					>
					{#if voteMessage}
						<ToolTip
							className="max-w-[120px] w-max text-wrap text-[11px]"
							fadeClasName="translate-x-[calc(-50%+20px)] -translate-y-[calc(100%-6px)]"
							side="top"
							tip={voteMessage}
						/>
					{/if}
				</div>
			</div>
			{#if post.editing}
				<div class="flex items-center mt-[7px] mr-[2px]">
					<button
						class="rounded-md text-[13px] px-[6px] ml-auto bg-[#383838] transition-colors hover:bg-[#575757]"
						on:click={() => {
							post.editing = false;
							post.post = post.previousValue || '';
							tick().then(() => {
								const event = new Event('input', {
									bubbles: true
								});
								post.textarea?.dispatchEvent(event);
							});
						}}>Cancel</button
					>
					<button
						class="rounded-md text-[13px] px-[6px] ml-[10px] bg-[#374583] transition-colors hover:bg-[#4859a4]"
						on:click={() => {
							updatePost(post.id, post.post);
							post.editing = false;
						}}>Save</button
					>
				</div>{/if}
		{/each}
	</div>
</div>
