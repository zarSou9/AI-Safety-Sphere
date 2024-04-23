<script lang="ts">
	let profDropdown = false;
	let profileDropE: HTMLDivElement;
	let initials = false;

	function noImage(e: any) {
		e.target.src = '';
		initials = true;
	}
	function profileDropdown() {
		if (!profDropdown) {
			profDropdown = true;
			setTimeout(() => {
				window.addEventListener('click', click);
			}, 200);
		}
	}
	function click(event: MouseEvent) {
		const { clientX, clientY } = event;
		const rect = profileDropE.getBoundingClientRect();
		const isWithinProfileDropE =
			clientX >= rect.left &&
			clientX <= rect.right &&
			clientY >= rect.top &&
			clientY <= rect.bottom;

		if (!isWithinProfileDropE) {
			profDropdown = false;
			window.removeEventListener('click', click);
		}
	}
</script>

{#if profDropdown}
	<div
		class="fixed z-[200] top-[46px] right-[8px] w-[63px] h-[50px] rounded-md bg-[#515151] grid text-sm"
		bind:this={profileDropE}
	>
		<a
			href="/home/settings"
			class="hover:bg-[#676767] rounded-t-md flex items-center justify-center pt-[3px]">Profile</a
		>
		<form
			action="/home?/signout"
			method="post"
			class="hover:bg-[#676767] text-red-400 flex items-center justify-center pb-[3px]"
		>
			<button>Log out</button>
		</form>
	</div>
{/if}
<div class="h-full w-full bg-[#151515] flex flex-col items-center overflow-y-auto">
	<div
		class="relative flex items-center w-full h-[40px] bg-[#272727] border-b-[.3px] border-b-[#70747c]"
	>
		<div class="w-[.6px] h-[26px] bg-[#70747c] mr-[15px] ml-auto" />
		<button
			class="flex items-center mr-[12px] rounded-full size-[25px] flex-grow-0 flex-shrink-0 overflow-hidden {initials
				? 'bg-[#525555]'
				: ''}"
			on:click={profileDropdown}
		>
			{#if initials}
				<p class="text-sm">MH</p>
			{:else}
				<img src="/images/profile_pic.png" on:error={noImage} alt="profile" />
			{/if}
		</button>
	</div>
	<p class="mt-[200px]">hello</p>
</div>
