<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Cross from '$lib/icons/Cross.svelte';
	import { getContext } from 'svelte';
	import { type Writable } from 'svelte/store';

	const failurePopUp: Writable<any> = getContext('failurePopUpStore');

	export let titleResult: any;
	export let titleMessage: string = 'New Title';
	export let maxLength: number = 32;

	const dispatch = createEventDispatcher();

	function close() {
		dispatch('close');
	}
	function save() {
		if (!titleResult.title) {
			failurePopUp.set('Please provide a title');
			return;
		} else if (titleResult.title.length > maxLength) {
			failurePopUp.set(`Title can't be greater than ${maxLength} characters`);
			return;
		}
		dispatch('save');
	}
	function handleKeyDown(e: KeyboardEvent) {
		e.stopPropagation();
		if (e.key === 'Escape') {
			dispatch('close');
		} else if (e.key === 'Enter') {
			save();
		}
	}
</script>

<div on:keydown={handleKeyDown} class="modal-background" role="presentation">
	<div
		class="modal-content flex-col bg-[#383c51] rounded-md p-[17px] px-4 pt-[9px]"
		role="presentation"
	>
		<button
			on:click={close}
			class="flex absolute top-[8.5px] right-[12px] hover:bg-[#5f5f5f4f] rounded-md w-[18px] h-[18px] items-center justify-center"
		>
			<Cross size="16px" color="#c3c3c3" />
		</button>
		<label>
			<p class="text-gray-300 text-[12px]">{titleMessage}</p>
			<input
				bind:this={titleResult.div}
				bind:value={titleResult.title}
				class="mt-[6px] pl-2 pr-1 text-[#000000] rounded-sm py-1 border-[.1px] outline-[0px]"
			/>
		</label>
		<div class="flex mt-2">
			<button
				on:click={save}
				class="btn-sm rounded-sm w-full py-[7px] border-[#56a2ff] border-[1px] hover:bg-[#56a2ff] hover:text-black"
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
