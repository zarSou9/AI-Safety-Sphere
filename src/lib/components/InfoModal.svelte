<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Cross from '$lib/icons/Cross.svelte';

	const dispatch = createEventDispatcher();

	function close() {
		dispatch('close');
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
		class="modal-content flex flex-col bg-[#282a31fc] rounded-md p-[17px] px-4 pt-[6px] items-center border-l-[1px] border-b-[1px] border-[#747474] text-[#e0e0e0]"
		on:click={(e) => e.stopPropagation()}
		role="presentation"
	>
		<button
			on:click={close}
			class="flex absolute top-[6px] right-[6px] hover:bg-[#5f5f5f4f] rounded-md w-[18px] h-[18px] items-center justify-center"
		>
			<Cross size="16px" color="#c3c3c3" />
		</button>
		<h2 class="text-[24px] font-semibold mt-[7px] mb-[5px]">How To Use</h2>
		<div class="mb-[12px] ml-[20px] mr-[30px]">
			<div class="mt-3">
				<h3 class="font-medium">Pan:</h3>
				<ul class="list-disc pl-[25px]">
					<li>Two fingers on trackpad</li>
					<li>Click and drag</li>
					<li><kbd>w</kbd> | <kbd>a</kbd> | <kbd>s</kbd> | <kbd>d</kbd></li>
				</ul>
			</div>
			<div class="mt-3">
				<h3 class="font-medium">Zoom:</h3>
				<ul class="list-disc pl-[25px]">
					<li>Ctrl + Scroll</li>
					<li><kbd>-</kbd> | <kbd>+</kbd></li>
					<li><kbd>z</kbd> | <kbd>x</kbd></li>
				</ul>
			</div>
			<div class="mt-3">
				<h3 class="font-medium">Navigate Tree:</h3>
				<ul class="list-disc pl-[25px]">
					<li><p>Arrow keys</p></li>
				</ul>
			</div>
			<div class="mt-3">
				<h3 class="font-medium">Full view:</h3>
				<ul class="list-disc pl-[25px]">
					<li><kbd>f</kbd></li>
				</ul>
			</div>
		</div>
		<div class="flex w-full text-[13px]">
			<a class="hover:underline text-[#005eff] mr-auto ml-[20px]" href="/home/docs">Learn more</a>
			<a class="hover:underline text-[#005eff] ml-auto mr-[20px]" href="/login">Log in</a>
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
