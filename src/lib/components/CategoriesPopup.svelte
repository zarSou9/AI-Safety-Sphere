<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { getContext, tick } from 'svelte';
	import { type Writable } from 'svelte/store';
	import type { LinkingCategory, CategoriesModal, CategoryColors } from '$lib/types';
	import { v4 as uuidv4 } from 'uuid';

	import Cross from '$lib/icons/Cross.svelte';
	import Trash from '$lib/icons/Trash.svelte';
	import Plus from '$lib/icons/Plus.svelte';
	import ToolTip from './ToolTip.svelte';

	const failurePopUp: Writable<string> = getContext('failurePopUpStore');

	export let categoriesModal: Writable<CategoriesModal>;

	let categories = JSON.parse(JSON.stringify($categoriesModal.categories)) as (LinkingCategory & {
		input?: HTMLInputElement;
	})[];
	let newCatButtonDisabled = false;

	const colors: CategoryColors[] = [
		'#3f3f3f',
		'#46966c',
		'#6d4ba3',
		'#3f8b91',
		'#b04d35',
		'#68497a',
		'#8d8142'
	];
	categories.forEach((cat) =>
		colors.splice(
			colors.findIndex((c) => c === cat.color),
			1
		)
	);

	const dispatch = createEventDispatcher();

	function close() {
		$categoriesModal.visible = false;
	}
	function save() {
		$categoriesModal.categories = categories;
		dispatch('save');
	}
	function handleKeyDown(e: KeyboardEvent) {
		e.stopPropagation();
		if (e.key === 'Escape') {
			close();
		}
	}
</script>

<div
	on:keydown={handleKeyDown}
	class="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-40 flex justify-center items-center z-50"
	on:click={close}
	role="presentation"
>
	<div
		class="relative flex-col bg-[#383c51] w-[300px] rounded-md pb-[16px] pt-[10px] px-[16px]"
		on:click={(e) => e.stopPropagation()}
		role="presentation"
	>
		<button
			on:click={close}
			class="flex absolute top-[13px] right-[14px] hover:bg-[#5f5f5f4f] rounded-md w-[18px] h-[18px] items-center justify-center"
		>
			<Cross size="16px" color="#c3c3c3" />
		</button>
		<p class="text-[#c7c7c7] text-[15px]">Edit Categories</p>
		<div
			class="border-[#848484] border-[1px] flex flex-col overflow-auto h-[280px] rounded-md mt-[10px] text-[13px] p-[8px] space-y-[10px] scroll-color"
		>
			<button
				disabled={newCatButtonDisabled}
				on:click={() => {
					if (!colors.length) {
						failurePopUp.set('A maximum of 7 categories are allowed');
						newCatButtonDisabled = true;
						return true;
					}
					const colorI = Math.floor(Math.random() * colors.length);
					categories.splice(0, 0, {
						id: uuidv4(),
						title: '',
						description: '',
						color: colors[colorI]
					});
					colors.splice(colorI, 1);
					categories = [...categories];
					tick().then(() => categories[0]?.input?.focus());
				}}
				class="relative border-[#848484] border-dotted border-[1.3px] rounded-md py-[4px] px-[8px] flex items-center space-x-[6px]"
				><Plus color="#bfbfbf" size="13px" />
				<p class="text-[12px] text-[#bfbfbf]">New Category</p>
			</button>
			{#each categories as category, i (category.id)}
				<div class="relative w-full border-[#848484] border-[1px] rounded-md p-[6px] flex flex-col">
					<div class="flex flex-row space-x-[5px]">
						<p class="font-bold">Title:</p>
						<input
							bind:this={category.input}
							on:input={() => {
								setTimeout(() => {
									if (category.title.length === 22)
										failurePopUp.set('Title cannot exceed 22 characters');
								}, 10);
							}}
							placeholder="untitled"
							class="bg-inherit border-none outline-none"
							bind:value={category.title}
							maxlength="22"
						/>
					</div>
					<div class="flex flex-row space-x-[5px] mt-[3px]">
						<p class="font-bold">Color:</p>
						<button
							class="size-[13px] rounded-full border-[.9px] border-[#aeaeae] mt-[4px]"
							style="background-color: {category.color};"
						/>
					</div>
					<div class="flex flex-col mt-[3px]">
						<p class="font-bold">Description:</p>
						<textarea
							placeholder="add description"
							class="bg-inherit border-none outline-none w-full"
							on:input={() => {
								setTimeout(() => {
									if (category.description.length === 170)
										failurePopUp.set('Description cannot exceed 170 characters');
								}, 10);
							}}
							bind:value={category.description}
							maxlength="170"
						/>
					</div>
					{#if $categoriesModal.uneditableCats.has(category.id) || categories.length === 1}
						<div class="absolute group top-[8px] right-[7px] stroke-[#9b9b9b] transition-colors">
							<ToolTip
								tip={categories.length === 1
									? 'At least 1 category required'
									: 'Category has child nodes'}
								side="custom"
								fadeClasName="right-[-5px] bottom-[calc(100%-2px)]"
							/>
							<Trash size="16px" />
						</div>
					{:else}
						<button
							on:click={() => {
								newCatButtonDisabled = false;
								colors.push(category.color);
								categories = [...categories.slice(0, i), ...categories.slice(i + 1)];
							}}
							class="absolute top-[7px] right-[7px] stroke-[#9d3c3c] hover:stroke-[#dd4d4d] transition-colors"
						>
							<Trash size="16px" />
						</button>
					{/if}
				</div>
			{/each}
		</div>
		<div class="flex mt-[13px]">
			<button
				disabled={$categoriesModal.waiting}
				on:click={save}
				class="rounded-md w-full flex items-center justify-center py-[7px] border-[#56a2ff] border-[1px] transition-colors {$categoriesModal.waiting ||
					'hover:bg-[#56a2ff] hover:text-[#1d1d1d]'}"
				>{#if $categoriesModal.waiting}<div class="spinner size-[20px] mr-[10px]" />{/if}Save
				Changes</button
			>
		</div>
	</div>
</div>

<style>
	.scroll-color {
		scrollbar-color: #969696 #565656;
	}

	.spinner {
		border: 1.5px solid #383c51;
		border-top: 1.5px solid #56a2ff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
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
