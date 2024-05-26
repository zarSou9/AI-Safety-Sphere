<script lang="ts">
	import { enhance } from '$app/forms';

	let logInForm: HTMLFormElement;
	let passwordInput: HTMLInputElement;
	let submitting = false;

	export let form;

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
		logInForm.submit();
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
		<h1 class="text-5xl absolute top-[-45px]">Log in</h1>
		<div class="mt-[18px] w-96 mb-1 px-[27px] pt-5 pb-4 bg-[#2e2e2e] rounded-[12px] flex flex-col">
			<form
				bind:this={logInForm}
				use:enhance={handleSubmit}
				action="?/login"
				method="post"
				class="space-y-5 flex flex-col text-[#000000]"
			>
				<label>
					<p class="text-gray-300 text-sm">Email</p>
					<input
						on:keydown={setEmailFocus}
						id="email"
						class="w-full mt-1 pl-2 pr-1 rounded-sm py-1"
						name="email"
						type="email"
						disabled={submitting}
						value={form?.values?.email || ''}
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
					id="login">Log in</button
				>
			</div>
			<div class="text-[#b8b8b8] flex text-sm mt-4 mb-1">
				<p class="ml-auto mr-2">Don't have an account?</p>
				<a href="/signup" class="link mr-auto text-[#7094e0]">Sign up</a>
			</div>
		</div>
		<p class="absolute bottom-[-24px] left-[10px]">
			{#if submitting}
				processing...
			{:else if form?.invalid && !submitting}
				{form.error}
			{:else if form?.serverErr && !submitting}
				{form.error}
			{/if}
		</p>
	</div>
</div>
