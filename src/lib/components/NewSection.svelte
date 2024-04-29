<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Cross from '$lib/icons/Cross.svelte';
	import FolderArrow from '$lib/icons/FolderArrow.svelte';
	import { slide } from 'svelte/transition';
	import { getContext } from 'svelte';
	import { type Writable } from 'svelte/store';
	import { quintOut } from 'svelte/easing';

	const failurePopUp: Writable<any> = getContext('failurePopUpStore');

	export let sections: any;
	export let suggestions: any;
	export let toolbarResult: any;
	toolbarResult.title = '';
	toolbarResult.after = sections.length - 1;

	let suggestionsOpen = false;
	let sectionsOpen = false;
	let suggestedArrow: HTMLDivElement;
	let sectionsArrow: HTMLDivElement;

	const dispatch = createEventDispatcher();

	function close() {
		dispatch('close');
	}
	function save() {
		if (!toolbarResult.title) {
			failurePopUp.set('Please provide a title');
			return;
		} else if (toolbarResult.title.length > 32) {
			failurePopUp.set("Title can't be greater than 32 characters");
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

<div on:keydown={handleKeyDown} class="modal-background" on:click={close} role="presentation">
	<div
		class="modal-content flex-col bg-[#383c51] rounded-md p-[17px] px-4 pt-[6px]"
		on:click={(e) => e.stopPropagation()}
		role="presentation"
	>
		<button
			on:click={close}
			class="flex absolute top-[8.5px] right-[12px] hover:bg-[#5f5f5f4f] rounded-md w-[18px] h-[18px] items-center justify-center"
		>
			<Cross size="16px" color="#c3c3c3" />
		</button>

		<label>
			<p class="text-[#c7c7c7] text-[13px]">New Section</p>
			<input
				bind:this={toolbarResult.div}
				bind:value={toolbarResult.title}
				class="input mt-[6px] pl-2 pr-1 rounded-sm py-1 border-[.1px] outline-[0px] selection:bg-[#80808080] selection:text-[#f5f5f5]"
			/>
		</label>
		<button
			on:click={() => {
				suggestionsOpen = !suggestionsOpen;
				sectionsOpen = false;
				sectionsArrow.style.transform = `rotate(90deg)`;
				if (suggestionsOpen) suggestedArrow.style.transform = `rotate(270deg)`;
				else suggestedArrow.style.transform = `rotate(90deg)`;
			}}
			class="mt-[13px] w-full text-[12px] mr-auto bg-[#e4e4e4] text-[#484848] rounded-[5px] flex items-center justify-center relative"
			><p class="p-0">Suggested...</p>
			<div bind:this={suggestedArrow} class="absolute top-[3.4px] right-[3px] arrow">
				<FolderArrow color="#484848" size="18px" />
			</div>
			{#if suggestionsOpen}
				<div
					transition:slide={{ duration: 150, easing: quintOut }}
					class="z-[400] absolute bg-[#474747] rounded-[6px] top-[25px] right-[0px] left-0 flex flex-col text-[12px] py-[4.5px] space-y-[3px] text-[#e9e9e9]"
				>
					{#each suggestions as suggestion}
						<button
							on:click={() => {
								toolbarResult.title = suggestion;
							}}
							class="hover:bg-[#626262] pl-[10px] flex justify-start">{suggestion}</button
						>
					{/each}
				</div>
			{/if}
		</button>
		<p class="text-gray-300 text-[12px] mt-[3px]">Place after...</p>
		<button
			on:click={() => {
				sectionsOpen = !sectionsOpen;
				suggestionsOpen = false;
				if (sectionsOpen) sectionsArrow.style.transform = `rotate(270deg)`;
				else sectionsArrow.style.transform = `rotate(90deg)`;
			}}
			class="w-full text-[12px] mr-auto bg-[#e4e4e4] text-[#484848] rounded-[5px] flex items-center justify-center relative"
			><p class="p-0">{sections[toolbarResult.after]}</p>
			<div bind:this={sectionsArrow} class="absolute top-[3.4px] right-[3px] arrow">
				<FolderArrow color="#484848" size="18px" />
			</div>
			{#if sectionsOpen}
				<div
					transition:slide={{ duration: 150, easing: quintOut }}
					class="z-[400] absolute bg-[#474747] rounded-[6px] top-[25px] right-[0px] left-0 flex flex-col text-[12px] py-[4.5px] space-y-[3px] text-[#e9e9e9]"
				>
					{#each sections as section, i}
						<button
							on:click={() => {
								toolbarResult.after = i;
							}}
							class="hover:bg-[#626262] pl-[10px] flex justify-start">{section}</button
						>
					{/each}
				</div>
			{/if}
		</button>
		<div class="flex mt-[13px]">
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
	.arrow {
		transform: rotate(90deg);
		transition: transform 150ms ease-out;
	}
</style>
