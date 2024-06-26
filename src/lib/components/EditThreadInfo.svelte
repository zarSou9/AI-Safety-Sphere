<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Cross from '$lib/icons/Cross.svelte';
	import { getContext } from 'svelte';
	import { type Writable } from 'svelte/store';
	import type { EditThreadInfoStore } from '$lib/types';

	const failurePopUp: Writable<any> = getContext('failurePopUpStore');

	export let editThreadInfo: EditThreadInfoStore;

	let maxTitleLen = 32;
	let maxTldrLen = 650;
	let voteMessLen = 200;

	const dispatch = createEventDispatcher();

	function close() {
		$editThreadInfo.visible = false;
	}
	function save() {
		if (!$editThreadInfo.title) {
			failurePopUp.set('Please provide a title');
			return;
		} else if ($editThreadInfo.title.length > maxTitleLen) {
			failurePopUp.set(`Title can't be greater than ${maxTitleLen} characters`);
			return;
		}
		dispatch('save');
	}
	function handleKeyDown(e: KeyboardEvent) {
		e.stopPropagation();
		if (e.key === 'Escape') close();
		else if (e.key === 'Enter') save();
	}
</script>

<div on:keydown={handleKeyDown} class="modal-background" role="presentation">
	<div
		class="modal-content flex-col bg-[#383c51] rounded-md p-[17px] px-4 pt-[9px] w-[300px]"
		role="presentation"
	>
		<button
			on:click={close}
			class="flex absolute top-[12px] right-[12px] hover:bg-[#5f5f5f4f] rounded-md w-[18px] h-[18px] items-center justify-center"
		>
			<Cross size="16px" color="#c3c3c3" />
		</button>
		<p class="text-[15px] text-[#cbcbcb]">Edit Thread Info</p>
		<p class="text-[13px] mt-[4px]">Title:</p>
		<input
			bind:this={$editThreadInfo.titleInput}
			bind:value={$editThreadInfo.title}
			class="mt-[3px] pl-[8px] pr-[4px] text-[14.5px] rounded-md w-full py-1 border-[#cfcfcf] border-[.1px] outline-[0px] bg-inherit"
		/>
		<div class="flex flex-col mt-[6px]">
			<p class="text-[13px]">Description:</p>
			<textarea
				bind:this={$editThreadInfo.tldrInput}
				placeholder="add description"
				class="bg-inherit mt-[3px] text-[14.5px] rounded-md outline-none w-full px-[8px] py-[4px] border-[#cfcfcf] border-[.1px]"
				on:input={() => {
					setTimeout(() => {
						if ($editThreadInfo.tldr.length === maxTldrLen)
							failurePopUp.set(`Description cannot exceed ${maxTldrLen} characters`);
					}, 10);
				}}
				bind:value={$editThreadInfo.tldr}
				maxlength={maxTldrLen}
				rows="3"
			/>
		</div>
		<div class="flex flex-col mt-[6px]">
			<p class="text-[13px]">Vote Message:</p>
			<textarea
				placeholder="e.g. do you think this comment is more or less constructive that it's currently ranked"
				class="bg-inherit text-[14.5px] rounded-md mt-[3px] outline-none w-full px-[8px] py-[4px] border-[#cfcfcf] border-[.1px]"
				on:input={() => {
					setTimeout(() => {
						if ($editThreadInfo.vote_message.length === voteMessLen)
							failurePopUp.set(`Description cannot exceed ${voteMessLen} characters`);
					}, 10);
				}}
				bind:value={$editThreadInfo.vote_message}
				maxlength={voteMessLen}
				rows="3"
			/>
		</div>
		<div class="flex mt-[15px]">
			<button
				on:click={save}
				class="rounded-md transition-colors w-full py-[7px] border-[#56a2ff] border-[1px] hover:bg-[#56a2ff] hover:text-black"
				>Save</button
			>
		</div>
	</div>
</div>

<style>
	.modal-background {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background-color: #00000062;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 300;
	}

	.modal-content {
		position: relative;
	}
</style>
