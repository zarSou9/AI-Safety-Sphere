<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Cross from '$lib/icons/Cross.svelte';
	import { getContext } from 'svelte';
	import { type Writable } from 'svelte/store';

	const dispatch = createEventDispatcher();

	function close() {
		dispatch('close');
	}
	function save() {
		dispatch('delete');
	}
	function handleKeyDown(e: KeyboardEvent) {
		e.stopPropagation();
		if (e.key === 'Escape') {
			dispatch('close');
		}
	}
</script>

<div on:keydown={handleKeyDown} class="modal-background" on:click={close} role="presentation">
	<div
		class="modal-content flex flex-col bg-[#383c51] rounded-md p-[17px] px-4 pt-[6px] items-center"
		on:click={(e) => e.stopPropagation()}
		role="presentation"
	>
		<button
			on:click={close}
			class="flex absolute top-[6px] right-[6px] hover:bg-[#5f5f5f4f] rounded-md w-[18px] h-[18px] items-center justify-center"
		>
			<Cross size="16px" color="#c3c3c3" />
		</button>
		<p class="mt-[6px] mx-auto text-[23px] px-[18px]">Delete this node?</p>
		<p class="text-[12px] mt-[3px] text-[#9c9c9c]">You won't be able to recover it</p>
		<div class="flex mt-2">
			<button
				on:click={save}
				class="btn-sm rounded-sm w-full py-[7px] border-[#ff5656] border-[1px] hover:bg-[#ff5656] hover:text-black"
				>Delete Node</button
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
