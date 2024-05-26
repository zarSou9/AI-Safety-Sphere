<script lang="ts">
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import Cross from '$lib/icons/Cross.svelte';

	export let form: any;

	let usernameInput: HTMLInputElement;
	let emailInput: HTMLInputElement;
	let passwordInput: HTMLInputElement;

	let signUpForm: HTMLFormElement;
	let submitting = false;

	function setUsernameFocus(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			emailInput.focus();
		}
	}

	function setEmailFocus(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			passwordInput.focus();
		}
	}

	function setPasswordFocus(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			passwordInput.blur();
		}
	}

	function submitForm() {
		submitting = true;
		signUpForm.submit();
	}

	function handleSubmit({ cancel }: { cancel: any }) {
		cancel();
		if (submitting) {
			submitting = false;
			return ({ update }: { update: any }) => update();
		}
	}
</script>

<div class="flex justify-center items-center h-screen bg-[#151515] text-[#ebebeb]">
	<div class="relative">
		<h1 class="text-5xl absolute top-[-45px]">Sign up</h1>
		<div class="mt-[18px] w-96 mb-1 px-[27px] pt-5 pb-4 bg-[#2e2e2e] rounded-[12px] flex flex-col">
			<form
				bind:this={signUpForm}
				use:enhance={handleSubmit}
				action="?/signup"
				method="post"
				class="space-y-5 flex flex-col text-[#000000]"
			>
				<label>
					<p class="text-gray-300 text-sm">Username</p>
					<input
						bind:this={usernameInput}
						on:keydown={setUsernameFocus}
						class="w-full mt-1 pl-2 pr-1 rounded-sm py-1"
						name="username"
						disabled={submitting}
						value={form?.username || ''}
						required
					/>
				</label>
				<label>
					<p class="text-gray-300 text-sm">Email</p>
					<input
						bind:this={emailInput}
						on:keydown={setEmailFocus}
						class="w-full mt-1 pl-2 pr-1 rounded-sm py-1"
						name="email"
						type="email"
						disabled={submitting}
						value={form?.email || ''}
						required
					/>
				</label>
				<label>
					<p class="text-gray-300 text-sm">Password</p>
					<input
						bind:this={passwordInput}
						on:keydown={setPasswordFocus}
						id="psswrd"
						class="w-full mt-1 pl-2 pr-1 rounded-sm py-1"
						name="password"
						type="password"
						disabled={submitting}
						required
					/>
				</label>
			</form>
			<div class="flex mt-[34px]">
				<button
					on:click={submitForm}
					disabled={submitting}
					class="rounded-sm w-full py-[7px] border-[#7094e0] border-[1px] hover:text-[#202020] {submitting
						? ''
						: 'hover:bg-[#7094e0]'}"
					id="login">Sign up</button
				>
			</div>
			<div class="text-[#b8b8b8] flex text-sm mt-5 mb-2">
				<p class="ml-auto mr-2">Already have an account?</p>
				<a href="/login" class="linke mr-auto text-[#7094e0]">Log in</a>
			</div>
		</div>
		{#if submitting}
			<p class="text-sm absolute bottom-[-24px] left-[10px]">processing...</p>
		{:else if form?.message}
			<div
				in:fly={{ duration: 300, x: 0, y: 200, opacity: 0.5, easing: quintOut }}
				class="fixed left-0 bottom-[40px] w-[100vw] flex items-center justify-center"
			>
				<div
					class="flex bg-[#ffffff] py-[10px] rounded-[6px]"
					style="box-shadow: -4px 4px #be4141;"
				>
					<p class="text-[#000000] mr-[20px] ml-[25px]">{form.message}</p>
					<button class="mr-[15px]" on:click={() => (form.message = false)}
						><Cross color="#70747c" size="16px" /></button
					>
				</div>
			</div>
		{:else if form?.success}
			<div
				in:fly={{ duration: 300, x: 0, y: 200, opacity: 0.5, easing: quintOut }}
				class="fixed left-0 bottom-[40px] w-[100vw] flex items-center justify-center"
			>
				<div
					class="flex bg-[#ffffff] py-[10px] rounded-[6px]"
					style="box-shadow: -4px 4px #4ad36c;"
				>
					<p class="text-[#000000] mr-[20px] ml-[25px]">
						Success: Check your email for confirmation
					</p>
					<button class="mr-[15px]" on:click={() => (form.success = false)}
						><Cross color="#70747c" size="16px" /></button
					>
				</div>
			</div>
		{/if}
	</div>
</div>
