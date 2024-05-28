<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';

	const profDropdown: Writable<boolean> = getContext('profDropdownStore');
</script>

<div class="h-full w-full bg-[#151515] flex flex-col items-center overflow-y-auto">
	<div
		class="relative flex items-center w-full h-[40px] bg-[#272727] border-b-[.3px] border-b-[#70747c] flex-shrink-0"
	>
		<div class="w-[.6px] h-[26px] bg-[#70747c] mr-[15px] ml-auto" />
		<button
			class="flex items-center mr-[12px] rounded-full size-[25px] flex-grow-0 flex-shrink-0 overflow-hidden"
			on:click={() => ($profDropdown = true)}
		>
			<img src="/images/profile_pic.png" alt="profile" />
		</button>
	</div>
	<p class="mt-[100px]">Now this is what I like to call settings</p>
</div>
