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

<body data-theme="wintry">
	<div class="flex justify-center items-center h-screen">
		<div>
			<h1 class="text-5xl">Sign up</h1>
			<div class="card p-4 mt-4 w-96 mb-1 px-6 pt-5">
				<form
					bind:this={signUpForm}
					use:enhance={handleSubmit}
					action="?/signup"
					method="post"
					class="space-y-5"
				>
					<label>
						<p class="text-gray-300 text-sm">Email</p>
						<input
							bind:this={emailInput}
							on:keydown={setEmailFocus}
							id="email"
							class="input mt-1 pl-2 pr-1 rounded-sm py-1"
							name="email"
							type="email"
							disabled={submitting}
							value={form?.email || ''}
							required
						/>
					</label>
					<label>
						<p class="text-gray-300 text-sm">Username</p>
						<input
							bind:this={usernameInput}
							on:keydown={setUsernameFocus}
							id="username"
							class="input mt-1 pl-2 pr-1 rounded-sm py-1"
							name="username"
							type="username"
							disabled={submitting}
							value={form?.username || ''}
							required
						/>
					</label>
					<label>
						<p class="text-gray-300 text-sm">Password</p>
						<input
							bind:this={passwordInput}
							on:keydown={setPasswordFocus}
							id="psswrd"
							class="input mt-1 pl-2 pr-1 rounded-sm py-1"
							name="password"
							type="password"
							disabled={submitting}
							required
						/>
					</label>
				</form>
				<div class="mx-5 w-[300px] bg-[#404047] h-[0.1px] mt-5"></div>
				<div class="flex mt-5">
					<button
						on:click={submitForm}
						disabled={submitting}
						class="btn-sm variant-outline-primary rounded-sm w-full py-[7px] {submitting
							? ''
							: 'hover:variant-filled-primary'}"
						id="login">Sign up</button
					>
				</div>
				<div class="text-gray-400 flex text-sm mt-5 mb-2">
					<p class="ml-auto mr-2">Already have an account?</p>
					<a href="/login" class="anchor mr-auto">Log in</a>
				</div>
			</div>
			{#if submitting}
				<p class="text-sm">processing...</p>
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
</body>
