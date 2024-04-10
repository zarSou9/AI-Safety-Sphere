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

<body data-theme="wintry">
	<div class="flex justify-center items-center h-screen">
		<div>
			<h1 class="text-5xl">Log in</h1>
			<div class="card p-4 mt-4 w-96 mb-1 px-6 pt-5">
				<form
					bind:this={logInForm}
					use:enhance={handleSubmit}
					action="?/login"
					method="post"
					class="space-y-5"
				>
					<label>
						<p class="text-gray-300 text-sm">Email</p>
						<input
							on:keydown={setEmailFocus}
							id="email"
							class="input mt-1 pl-2 pr-1 rounded-sm py-1"
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
						id="login">Log in</button
					>
				</div>
				<div class="text-gray-400 flex text-sm mt-4 mb-1">
					<p class="ml-auto mr-2">Don't have an account?</p>
					<a href="/signup" class="anchor mr-auto">Sign up</a>
				</div>
			</div>
			{#if submitting}<p>processing...</p>{/if}
			{#if form?.invalid && !submitting}<p>{form.error}</p>{/if}
			{#if form?.serverErr && !submitting}<p>{form.error}</p>{/if}
		</div>
	</div>
</body>
