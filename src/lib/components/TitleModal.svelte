<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Cross from '$lib/icons/Cross.svelte';

	const dispatch = createEventDispatcher();

	function close() {
		dispatch('close');
	}
	function save() {
		dispatch('save');
	}
	function escape(e: KeyboardEvent) {
		e.stopPropagation();
		if (e.key === 'Escape') {
			dispatch('close');
		}
	}
</script>

<div on:keydown={escape} class="modal-background" on:click={close} role="presentation">
	<div
		class="modal-content flex-col bg-[#383c51] rounded-md p-4 px-4 pt-3"
		on:click={(e) => e.stopPropagation()}
		role="presentation"
	>
		<button
			on:click={close}
			class="flex absolute top-[13px] right-[12px] hover:bg-[#75757590] rounded-md w-[18px] h-[18px] items-center justify-center"
		>
			<Cross size="16px" color="#c3c3c3" />
		</button>

		<label>
			<p class="text-gray-300 text-sm">New Title</p>
			<slot />
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
