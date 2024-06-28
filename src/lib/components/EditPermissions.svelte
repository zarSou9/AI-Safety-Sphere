<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { getContext } from 'svelte';
	import type { EditPermissionsStore } from '$lib/types';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import type { PageData } from '../../routes/$types';

	import Cross from '$lib/icons/Cross.svelte';
	import Search from '$lib/icons/Search.svelte';
	import Trash from '$lib/icons/Trash.svelte';
	import ToolTip from './ToolTip.svelte';

	const data: PageData = getContext('data');

	export let editPermissions: EditPermissionsStore;

	let anyonesOpen = false;
	let memberssOpen = false;

	let membersInput = '';
	let ownersInput = '';
	let ownersSearchOpen = false;
	let membersSearchOpen = false;

	const dispatch = createEventDispatcher();

	function close() {
		$editPermissions.visible = false;
	}
	function save() {
		dispatch('save');
	}
	function handleKeyDown(e: KeyboardEvent) {
		e.stopPropagation();
		if (e.key === 'Escape') {
			$editPermissions.visible = false;
		}
	}
	let anyones: any[];
	let memberss: any[];

	let people = data.props.profiles;
	let ownersPeople = people.filter((person) => !$editPermissions.owners.includes(person));
	let membersPeople = people.filter((person) => !$editPermissions.members.includes(person));

	if ($editPermissions.type === 'Default') {
		anyones = ['Can view', 'Cannot view'];
		memberss = ['Can edit', 'Can view'];
	} else {
		anyones = ['Can post & reply', 'Can post', 'Can reply', 'Can view', 'Cannot view'];
		memberss = ['Can delete posts', 'Can post & reply', 'Can post', 'Can reply', 'Can view'];
	}
</script>

<div
	on:keydown={handleKeyDown}
	on:click={() => {
		anyonesOpen = false;
		memberssOpen = false;
		ownersSearchOpen = false;
		membersSearchOpen = false;
	}}
	class="modal-background"
	role="presentation"
>
	<div
		class="relative w-[400px] flex flex-col bg-[#383c51] rounded-md p-[17px] px-4 pt-[10px]"
		role="presentation"
	>
		<button
			on:click={close}
			class="z-[10] flex absolute top-[11px] right-[12px] hover:bg-[#5f5f5f4f] rounded-md w-[18px] h-[18px] items-center justify-center"
		>
			<Cross size="16px" color="#c3c3c3" />
		</button>
		<p class="text-[#acacac] text-[14px]">Edit Node Permissions</p>
		<div class="flex items-center mt-[8px]">
			<p class="text-[14px]">Anyone:</p>
			<button
				on:click={(e) => {
					anyonesOpen = !anyonesOpen;
					memberssOpen = false;
					e.stopPropagation();
				}}
				class="flex items-center mt-[2px] ml-[4px] justify-center relative w-[130px] py-[1px] text-[12px] border-[#e4e4e4] border-[.7px] rounded-[5px]"
				>{$editPermissions.anyonePermissions}
				{#if anyonesOpen}
					<div
						transition:slide={{ duration: 150, easing: quintOut }}
						class="z-[400] absolute bg-[#474747] rounded-md overflow-hidden top-[calc(100%+.7px)] right-[0px] left-0 flex flex-col text-[12px] py-[4px] space-y-[1px] text-[#e9e9e9]"
					>
						{#each anyones as anyone (anyone)}
							<button
								on:click={() => {
									$editPermissions.anyonePermissions = anyone;
								}}
								class="py-[1px] pl-[8px] flex justify-start {$editPermissions.anyonePermissions ===
								anyone
									? 'bg-[#626262]'
									: 'hover:bg-[#585858]'}">{anyone}</button
							>
						{/each}
					</div>
				{/if}
			</button>
		</div>
		<div class="flex items-center mt-[7px]">
			<p class="text-[14px]">Members:</p>
			<button
				on:click={(e) => {
					memberssOpen = !memberssOpen;
					anyonesOpen = false;
					e.stopPropagation();
				}}
				class="flex items-center mt-[2px] ml-[4px] justify-center relative w-[130px] py-[1px] text-[12px] border-[#e4e4e4] border-[.7px] rounded-[5px]"
				>{$editPermissions.memberPermissions}
				{#if memberssOpen}
					<div
						transition:slide={{ duration: 150, easing: quintOut }}
						class="z-[400] absolute bg-[#474747] rounded-md overflow-hidden top-[calc(100%+.7px)] right-[0px] left-0 flex flex-col text-[12px] py-[4px] space-y-[1px] text-[#e9e9e9]"
					>
						{#each memberss as member (member)}
							<button
								on:click={() => {
									$editPermissions.memberPermissions = member;
								}}
								class="py-[1px] pl-[8px] flex justify-start {$editPermissions.memberPermissions ===
								member
									? 'bg-[#626262]'
									: 'hover:bg-[#585858]'}">{member}</button
							>
						{/each}
					</div>
				{/if}
			</button>
		</div>
		<div class="w-full flex space-x-[10px] h-[270px] mt-[13px]">
			<div class="border-[1px] border-[#8f8f8f] flex flex-col rounded-md w-full h-full">
				<div class="w-[calc(100%-8px)] mx-[4px] mt-[2px] relative">
					<input
						class="text-[11px] text-[#b0b0b0] w-full pl-[22px] h-[23px]
					bg-[#252731] placeholder:text-[#848484] rounded-md outline-none transition-colors
					border-[1px] {ownersSearchOpen ? 'border-[#9c9c9c]' : 'border-[#606060]'}"
						placeholder="Add owners..."
						bind:value={ownersInput}
						on:input={() => {
							ownersPeople = people?.filter(
								(person) =>
									person.toLowerCase().includes(ownersInput?.toLowerCase() || '') &&
									!$editPermissions.owners.includes(person)
							);
						}}
						on:click={(e) => {
							e.stopPropagation();
							ownersSearchOpen = true;
							membersSearchOpen = false;
						}}
					/>
					<div class="absolute top-[8px] left-[7px] pointer-events-none transition-colors">
						<Search color={ownersSearchOpen ? '#9c9c9c' : '#606060'} size="12px" />
					</div>
					{#if ownersSearchOpen}
						<div
							transition:slide={{ duration: 150, easing: quintOut }}
							class="h-[200px] absolute bg-[#474747] z-[3] rounded-[6px] top-[25px] right-0 left-0 flex flex-col text-[11px] py-[6px] space-y-[1px] text-[#e9e9e9] overflow-auto"
						>
							{#each ownersPeople as person (person)}
								<button
									on:click={() => {
										$editPermissions.owners = [...$editPermissions.owners, person];
										ownersPeople = ownersPeople.filter((op) => op !== person);
									}}
									class="hover:bg-[#626262] pl-[13px] py-[1px] flex justify-start">{person}</button
								>
							{/each}
							{#if !ownersPeople?.length}
								<p class="pl-[13px] text-[#acacac] justify-start">No results found</p>
							{/if}
						</div>
					{/if}
				</div>
				<div class="border-t-[.1px] border-[#838383] overflow-auto flex-1 mt-[4px]">
					{#each $editPermissions.owners as owner (owner)}
						<div
							class="w-full py-[3px] pl-[10px] flex relative overflow-visible border-b-[.1px] border-[#838383]"
						>
							<p class="text-[13px]">{owner}</p>
							<button
								disabled={$editPermissions.owners.length === 1}
								on:click={() => {
									$editPermissions.owners = $editPermissions.owners.filter((o) => o !== owner);
								}}
								class="absolute group top-0 bottom-0 right-[7px] transition-colors {$editPermissions
									.owners.length === 1
									? 'stroke-[#9b9b9b]'
									: 'stroke-[#9d3c3c] hover:stroke-[#dd4d4d]'}"
							>
								<ToolTip
									tip={$editPermissions.owners.length === 1
										? 'At least 1 owner required'
										: 'Remove owner'}
									side="left"
									className="text-[12px]"
									fadeClasName="-translate-x-[calc(100%-4px)]"
								/>
								<Trash size="14px" />
							</button>
						</div>
					{/each}
				</div>
			</div>
			<div class="border-[1px] border-[#8f8f8f] flex flex-col rounded-md w-full h-full">
				<div class="w-[calc(100%-8px)] mx-[4px] mt-[2px] relative">
					<input
						class="text-[11px] text-[#b0b0b0] w-full pl-[22px] h-[23px]
					bg-[#252731] placeholder:text-[#848484] rounded-md outline-none transition-colors
					border-[1px] {membersSearchOpen ? 'border-[#9c9c9c]' : 'border-[#606060]'}"
						placeholder="Add members..."
						bind:value={membersInput}
						on:input={() => {
							membersPeople = people?.filter(
								(person) =>
									person.toLowerCase().includes(membersInput?.toLowerCase() || '') &&
									!$editPermissions.members.includes(person)
							);
						}}
						on:click={(e) => {
							e.stopPropagation();
							ownersSearchOpen = false;
							membersSearchOpen = true;
						}}
					/>
					<div class="absolute top-[8px] left-[7px] pointer-events-none transition-colors">
						<Search color={membersSearchOpen ? '#9c9c9c' : '#606060'} size="12px" />
					</div>
					{#if membersSearchOpen}
						<div
							transition:slide={{ duration: 150, easing: quintOut }}
							class="h-[200px] absolute bg-[#474747] z-[3] rounded-[6px] top-[25px] right-0 left-0 flex flex-col text-[11px] py-[6px] space-y-[1px] text-[#e9e9e9] overflow-auto"
						>
							{#each membersPeople as person (person)}
								<button
									on:click={() => {
										$editPermissions.members = [...$editPermissions.members, person];
										membersPeople = membersPeople.filter((op) => op !== person);
									}}
									class="hover:bg-[#626262] pl-[13px] py-[1px] flex justify-start">{person}</button
								>
							{/each}
							{#if !membersPeople?.length}
								<p class="pl-[13px] text-[#acacac] justify-start">No results found</p>
							{/if}
						</div>
					{/if}
				</div>
				<div class="border-t-[.1px] border-[#838383] overflow-auto flex-1 mt-[4px]">
					{#each $editPermissions.members as member (member)}
						<div
							class="w-full py-[3px] pl-[10px] flex relative overflow-visible border-b-[.1px] border-[#838383]"
						>
							<p class="text-[13px]">{member}</p>
							<button
								on:click={() => {
									$editPermissions.members = $editPermissions.members.filter((o) => o !== member);
								}}
								class="absolute group top-0 bottom-0 right-[7px] transition-colors stroke-[#9d3c3c] hover:stroke-[#dd4d4d]"
							>
								<ToolTip
									tip="Remove member"
									side="left"
									className="text-[12px]"
									fadeClasName="-translate-x-[calc(100%-4px)]"
								/>
								<Trash size="14px" />
							</button>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<div class="flex mt-[14px]">
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
</style>
