<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';

	const profDropdown: Writable<boolean> = getContext('profDropdownStore');
</script>

<div class="h-full w-full bg-[#151515] flex flex-col items-center overflow-y-auto">
	<div
		class="relative flex items-center w-full h-[40px] bg-[#272727] border-b-[.3px] border-b-[#70747c]"
	>
		<div class="w-[.6px] h-[26px] bg-[#70747c] mr-[15px] ml-auto" />
		<button
			class="flex items-center mr-[12px] rounded-full size-[25px] flex-grow-0 flex-shrink-0 overflow-hidden"
			on:click={() => ($profDropdown = true)}
		>
			<img src="/images/profile_pic.png" alt="profile" />
		</button>
	</div>
	<div class="flex flex-col items-start">
		<p class="mt-[100px] mb-[10px]">This is a resource page list of helpful resouce page lists:</p>
		<ul class="text-[#479dff] ml-[30px]">
			<li>
				<a class="hover:underline" href="https://vkrakovna.wordpress.com/ai-safety-resources/"
					>Long List of AI alignment resources</a
				>
			</li>
			<li>
				<a class="hover:underline" href="https://www.aisafetysupport.org/lots-of-links"
					>Another Long List of AI alignment resources</a
				>
			</li>
			<li>
				<a class="hover:underline" href="https://aisafetyfundamentals.com/resources/"
					>BlueDot's Resources page</a
				>
			</li>
		</ul>
	</div>
</div>

<style>
	ul {
		list-style: none;
		padding-left: 0;
	}

	li::before {
		content: '• ';
		color: #479dff;
	}

	a {
		color: inherit;
	}
</style>
