<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import Vote from '$lib/icons/Vote.svelte';

	export let data;

	const questions = data.props.questions;
	console.log(questions);

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
	<div class="flex flex-col items-center flex-grow">
		<h1 class="text-[50px] my-[40px]">Research Questions</h1>
		<div class="flex flex-col">
			{#each questions as question}
				<div
					class="rounded-[10px] mx-[70px] max-w-[800px] bg-[#1f1f1f] relative p-[10px] text-[#ebebeb]"
				>
					<div class="absolute left-[-40px] top-0 bottom-0 flex justify-center items-center">
						<p class="mr-[3px] text-[12px] pointer-events-none">{question.importance}</p>
						<div class="flex flex-col justify-center">
							<button class="rotate-90"><Vote size="25px" /></button>
							<button class="rotate-[-90deg]"><Vote size="25px" /></button>
						</div>
					</div>
					<a href={question.google_doc} target="_blank">{question.question}</a>
				</div>
			{/each}
		</div>
	</div>
</div>
