<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Cross from '$lib/icons/Cross.svelte';
	import { getContext } from 'svelte';
	import { type Writable } from 'svelte/store';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import Search from '$lib/icons/Search.svelte';
	import { writable } from 'svelte/store';

	const failurePopUp: Writable<any> = getContext('failurePopUpStore');

	export let titleResult: any;
	export let titleMessage: string = 'New Title';
	export let problems: any;
	export let maxLength: number = 32;

	let searchInput = writable('');
	let problemsSearch = JSON.parse(JSON.stringify(problems));
	let linkedProblem: any = undefined;

	searchInput.subscribe((si) => {
		problemsSearch = [];
		for (let p of problems) {
			if (p.title.toLowerCase().includes(si.toLowerCase())) {
				problemsSearch.push(p);
			}
		}
	});
	let sectionsOpen = false;
	let placeholder = true;
	const dispatch = createEventDispatcher();

	function close() {
		dispatch('close');
	}
	function save() {
		if (linkedProblem) {
			titleResult.title = linkedProblem;
		} else {
			if (!titleResult.title) {
				failurePopUp.set('Please provide a title');
				return;
			} else if (titleResult.title.length > maxLength) {
				failurePopUp.set(`Title can't be greater than ${maxLength} characters`);
				return;
			}
		}
		dispatch('save');
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
		class="modal-content flex flex-col bg-[#383c51] rounded-md p-[17px] px-4 pt-[10px]"
		on:click={(e) => {
			e.stopPropagation();
			sectionsOpen = false;
			placeholder = true;
		}}
		role="presentation"
	>
		<button
			on:click={close}
			class="z-[10] flex absolute top-[8.5px] right-[12px] hover:bg-[#5f5f5f4f] rounded-md w-[18px] h-[18px] items-center justify-center"
		>
			<Cross size="16px" color="#c3c3c3" />
		</button>
		<label class="relative">
			<p class="text-gray-300 text-[12px]">{titleMessage}</p>
			<input
				bind:this={titleResult.div}
				bind:value={titleResult.title}
				on:focus={() => {
					linkedProblem = undefined;
				}}
				class="w-full text-[#000000] mt-[6px] pl-2 pr-1 rounded-sm py-1 border-[.1px] outline-[0px] selection:bg-[#80808080] selection:text-[#f5f5f5]"
			/>
			{#if linkedProblem}
				<p
					class="absolute italic text-[#86a8e9] top-[29px] left-[9px] text-[13.5px] pointer-events-none"
				>
					{linkedProblem.title}
				</p>
			{/if}
		</label>
		<p class="text-[14px] text-[#b0b0b0] mx-auto my-[2px]">or</p>
		<div
			class="relative"
			on:click={(e) => {
				e.stopPropagation();
				placeholder = false;
			}}
			role="presentation"
		>
			<input
				bind:value={$searchInput}
				class="z-[1] relative py-[2px] pl-[27px] w-full border-none outline-none rounded-full bg-[#ffffff] border-[#a1a1a1] border-[.5px] text-[#000000] mb-[3px] selection:bg-[#9bb0e269]"
			/>
			{#if placeholder && !$searchInput}
				<p
					class="z-[1] absolute top-[3px] flex left-[27px] text-[#494949] text-[12px] pointer-events-none"
				>
					Link to Existing!
				</p>
			{/if}
			<div class="z-[1] absolute top-[6px] left-[10px] pointer-events-none">
				<Search color="#000000" size="12px" />
			</div>
			{#if !placeholder}
				<div
					out:slide={{ duration: 0, easing: quintOut, delay: 68 }}
					class="absolute bg-[#ffffff] h-[12px] left-0 right-0 top-[14px] z-[0] overflow-auto border-b-[#6d6d6d] border-b-[.2px]"
				/>
				<div
					transition:slide={{ duration: 170, easing: quintOut }}
					class="absolute bg-[#ffffff] rounded-b-[10px] h-[110px] left-0 right-0 top-[26px] pt-[3px] z-[0] overflow-auto"
				>
					{#each problemsSearch as p (p.uuid)}
						<button
							on:click={(e) => {
								e.stopPropagation();
								placeholder = true;
								titleResult.title = '';
								linkedProblem = p;
							}}
							class="hover:bg-[#c7c7c7] pl-[10px] flex justify-start w-full text-[#000000]"
							>{p.title}</button
						>
					{/each}
				</div>
			{/if}
		</div>
		<div class="flex mt-[12px]">
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
