<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { getContext } from 'svelte';
	import { type Writable } from 'svelte/store';
	import type { NodeTypes, NewNodeModalStore } from '$lib/types';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	import Cross from '$lib/icons/Cross.svelte';

	const failurePopUp: Writable<any> = getContext('failurePopUpStore');

	export let newNodeModal: NewNodeModalStore;
	export let titleMessage: string = 'New Title';
	export let maxLength: number = 32;

	let typesOpen = false;

	let sectionsOpen = false;
	const dispatch = createEventDispatcher();

	function close() {
		$newNodeModal.visible = false;
	}
	function save() {
		if (!$newNodeModal.title) {
			failurePopUp.set('Please provide a title');
			return;
		} else if ($newNodeModal.title.length > maxLength) {
			failurePopUp.set(`Title can't be greater than ${maxLength} characters`);
			return;
		}
		dispatch('save');
	}
	function handleKeyDown(e: KeyboardEvent) {
		e.stopPropagation();
		if (e.key === 'Escape') {
			$newNodeModal.visible = false;
		}
	}
</script>

<div on:keydown={handleKeyDown} class="modal-background" role="presentation">
	<div
		class="modal-content flex flex-col bg-[#383c51] rounded-md p-[17px] px-4 pt-[10px]"
		on:click={() => {
			sectionsOpen = false;
		}}
		role="presentation"
	>
		<button
			on:click={close}
			class="z-[10] flex absolute top-[11px] right-[12px] hover:bg-[#5f5f5f4f] rounded-md w-[18px] h-[18px] items-center justify-center"
		>
			<Cross size="16px" color="#c3c3c3" />
		</button>
		<label class="relative">
			<p class="text-gray-300 text-[14px]">
				{titleMessage}
			</p>
			<input
				bind:this={$newNodeModal.input}
				bind:value={$newNodeModal.title}
				class="w-full text-[#000000] mt-[7px] pl-2 pr-1 rounded-sm py-1 border-[.1px] outline-[0px]"
			/>
		</label>
		<button
			on:click={(e) => {
				typesOpen = !typesOpen;
				e.stopPropagation();
			}}
			class="w-full text-[12px] mt-[12px] mr-auto border-[#e4e4e4] border-[.7px] rounded-[5px] flex items-center justify-center relative py-[2px]"
			>{$newNodeModal.type}
			{#if typesOpen}
				<div
					transition:slide={{ duration: 150, easing: quintOut }}
					class="z-[400] absolute bg-[#474747] rounded-md overflow-hidden top-[calc(100%+.7px)] right-[0px] left-0 flex flex-col text-[12px] py-[4px] space-y-[1px] text-[#e9e9e9]"
				>
					{#each $newNodeModal.allowedTypes as type (type)}
						<button
							on:click={() => {
								$newNodeModal.type = type;
							}}
							class="py-[1px] pl-[8px] flex justify-start {$newNodeModal.type === type
								? 'bg-[#626262]'
								: 'hover:bg-[#585858]'}">{type}</button
						>
					{/each}
				</div>
			{/if}
		</button>
		<div class="flex mt-[12px]">
			<button
				on:click={save}
				class="rounded-md transition-colors w-full py-[4px] border-[#56a2ff] border-[1px] hover:bg-[#56a2ff] hover:text-black"
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
