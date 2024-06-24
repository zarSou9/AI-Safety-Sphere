<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { getContext, tick } from 'svelte';
	import { type Writable } from 'svelte/store';
	import type {
		LinkingCategory,
		CategoriesModal,
		CategoryColors,
		CategoryTypes,
		PostPermissions,
		NodeTypes
	} from '$lib/types';
	import { v4 as uuidv4 } from 'uuid';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	import Cross from '$lib/icons/Cross.svelte';
	import Trash from '$lib/icons/Trash.svelte';
	import Plus from '$lib/icons/Plus.svelte';
	import ToolTip from './ToolTip.svelte';
	import Check from '$lib/icons/Check.svelte';

	const failurePopUp: Writable<string> = getContext('failurePopUpStore');

	export let categoriesModal: Writable<CategoriesModal>;

	let categories = JSON.parse(JSON.stringify($categoriesModal.categories)) as LinkingCategory[];
	let newCatButtonDisabled = false;
	let types: CategoryTypes[] = ['Expanded', 'Collapsed'];
	let nodeTypes: NodeTypes[] = ['Default', 'Thread', 'Poll'];
	let permissions: PostPermissions[] = ['Owner', 'Members', 'Anyone'];

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
		on:click={(e) => {
			e.stopPropagation();
			categories.forEach((c) => {
				c.typesOpen = false;
				c.permissionsOpen = false;
			});
			categories = [...categories];
		}}
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
						type: 'Expanded',
						title: '',
						description: '',
						color: colors[colorI],
						postPermissions: 'Anyone',
						nodesAllowed: ['Thread', 'Poll', 'Default']
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
					<div class="flex flex-row space-x-[5px] mt-[4.5px]">
						<p class="font-bold">Color:</p>
						<button
							class="size-[13px] rounded-full border-[.9px] border-[#aeaeae] mt-[4.3px]"
							style="background-color: {category.color};"
						/>
					</div>
					<div class="flex flex-row space-x-[5px] mt-[4.5px]">
						<p class="font-bold">Type:</p>
						<button
							on:click={(e) => {
								category.typesOpen = !category.typesOpen;
								e.stopPropagation();
							}}
							class="w-[90px] text-[12px] mt-[1.2px] mr-auto border-[#e4e4e4] border-[.7px] rounded-[5px] flex items-center justify-center relative py-[.4px]"
							>{category.type}
							{#if category.typesOpen}
								<div
									transition:slide={{ duration: 150, easing: quintOut }}
									class="z-[400] absolute bg-[#474747] rounded-md overflow-hidden top-[calc(100%+.7px)] right-[0px] left-0 flex flex-col text-[12px] py-[4px] space-y-[1px] text-[#e9e9e9]"
								>
									{#each types as type (type)}
										<button
											on:click={() => {
												category.type = type;
											}}
											class="py-[1px] pl-[8px] flex justify-start {category.type === type
												? 'bg-[#626262]'
												: 'hover:bg-[#585858]'}">{type}</button
										>
									{/each}
								</div>
							{/if}
						</button>
					</div>
					<div class="flex flex-row space-x-[5px] mt-[4.5px]">
						<p class="font-bold">Post Permissions:</p>
						<button
							on:click={(e) => {
								category.permissionsOpen = !category.permissionsOpen;
								e.stopPropagation();
							}}
							class="w-[90px] text-[12px] mt-[1.2px] mr-auto border-[#e4e4e4] border-[.7px] rounded-[5px] flex items-center justify-center relative py-[.4px]"
							>{category.postPermissions}
							{#if category.permissionsOpen}
								<div
									transition:slide={{ duration: 150, easing: quintOut }}
									class="z-[400] absolute bg-[#474747] rounded-md overflow-hidden top-[calc(100%+.7px)] right-[0px] left-0 flex flex-col text-[12px] py-[4px] space-y-[1px] text-[#e9e9e9]"
								>
									{#each permissions as permission (permission)}
										<button
											on:click={() => {
												category.postPermissions = permission;
											}}
											class="py-[1px] pl-[8px] flex justify-start {category.postPermissions ===
											permission
												? 'bg-[#626262]'
												: 'hover:bg-[#585858]'}">{permission}</button
										>
									{/each}
								</div>
							{/if}
						</button>
					</div>
					<div class="flex flex-col space-y-[3px] mt-[4.5px]">
						<p class="font-bold">Allowed Node Types:</p>
						<div class="ml-[7px] space-y-[2px] text-[13px]">
							{#each nodeTypes as nodeType (nodeType)}
								<div class="flex space-x-[4px] items-center">
									<button
										on:click={() => {
											let i = category.nodesAllowed.findIndex((v) => v === nodeType);
											if (i !== -1) category.nodesAllowed.splice(i, 1);
											else category.nodesAllowed.push(nodeType);
										}}
										class="flex size-[15px] rounded-md items-center border-[#41649d] justify-center transition-colors {category.nodesAllowed.includes(
											nodeType
										)
											? 'bg-[#41649d]'
											: 'border-[1px]'}"
									>
										{#if category.nodesAllowed.includes(nodeType)}
											<Check color="#f0f0f0" size="10px" />
										{/if}
									</button>
									<p>{nodeType}</p>
								</div>
							{/each}
						</div>
					</div>
					<div class="flex flex-col mt-[4.5px]">
						<p class="font-bold">Description:</p>
						<textarea
							placeholder="add description"
							class="bg-inherit border-none outline-none w-full mt-[1px]"
							on:input={() => {
								setTimeout(() => {
									if (category.description.length === 310)
										failurePopUp.set('Description cannot exceed 310 characters');
								}, 10);
							}}
							bind:value={category.description}
							maxlength="310"
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
