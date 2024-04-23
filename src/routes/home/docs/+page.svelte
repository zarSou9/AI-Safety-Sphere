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
<div class="h-full w-full bg-[#151515] relative">
	<div
		class="relative flex items-center w-full h-[40px] bg-[#272727] border-b-[.3px] border-b-[#70747c] flex-shrink-0"
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
	<div class="h-full w-full overflow-y-auto flex flex-col items-center">
		<div class="w-[800px] flex flex-col items-start mt-[80px] mb-[120px]">
			<p class="c4">
				<span class="c14">Thank you for participating in this </span>
			</p>
			<p class="c4"><span class="c12 c15">Feedback</span><span class="c15">&nbsp;session!</span></p>
			<p class="c2"><span class="c13"></span></p>
			<p class="c2"><span class="c13"></span></p>
			<p class="c2"><span class="c13"></span></p>
			<p class="c4"><span class="c5">TO DO:</span></p>
			<p class="c2"><span class="c1"></span></p>
			<ol class="c11 lst-kix_5n9jywy0rmvt-0 start" start="1">
				<li class="c0 li-bullet-0">
					<span class="c1">Read: &ldquo;Problem Solving Ideology&rdquo;</span>
				</li>
				<li class="c0 li-bullet-0"><span class="c1">Read: &ldquo;How to Use&rdquo;</span></li>
				<li class="c0 li-bullet-0"><span class="c1">Play: in &ldquo;Tree&rdquo; page</span></li>
				<li class="c0 li-bullet-0">
					<span>Give Feedback: </span><span class="c16"
						><a
							class="c3"
							href="https://www.google.com/url?q=https://forms.gle/PPUF31AoGTTURx5D8&amp;sa=D&amp;source=editors&amp;ust=1713890106064883&amp;usg=AOvVaw3XBjgbsPjovlE-323q5P2T"
							>https://forms.gle/PPUF31AoGTTURx5D8</a
						></span
					>
				</li>
			</ol>
			<p class="c2"><span class="c1"></span></p>
			<p class="c2"><span class="c1"></span></p>
			<p class="c4"><span class="c5">Problem Solving Ideology:</span></p>
			<p class="c2"><span class="c1"></span></p>
			<p class="c4">
				<span class="c1"
					>At AISS, we define problems as essentially goals in which collaborators strive to grasp
					how to complete. Once we have gained a solid understanding of how to complete said goal,
					we consider the problem solved. Here is an example:</span
				>
			</p>
			<p class="c2"><span class="c1"></span></p>
			<ul class="c11 lst-kix_xbgds6zcul8s-0 start">
				<li class="c0 li-bullet-0">
					<span class="c1">Problem: I need milk but don&#39;t have it</span>
				</li>
				<li class="c0 li-bullet-0"><span class="c1">Goal: Have milk</span></li>
				<li class="c0 li-bullet-0">
					<span class="c1">Proposed solution: Go to the grocery store and get milk</span>
				</li>
			</ul>
			<p class="c2"><span class="c1"></span></p>
			<p class="c4">
				<span class="c1"
					>Even though I haven&#39;t necessarily gone out to get milk, I consider this problem to be
					solved. As in, I don&#39;t need to think too much more about achieving my goal, I just
					have to act on my proposed solution. However, when big problems need solving, they must be
					broken down into smaller, more manageable subproblems. How one decides to break down a big
					problem and why, could be encapsulated in a strategy.</span
				>
			</p>
			<p class="c2"><span class="c1"></span></p>
			<div class="mx-auto">
				<p class="c6">
					<span
						style="overflow: hidden; display: inline-block; margin: 0.00px 0.00px; border: 0.00px solid #d6d6d6; transform: rotate(0.00rad) translateZ(0px); -webkit-transform: rotate(0.00rad) translateZ(0px); width: 491.50px; height: 400.13px;"
						><img
							alt="Problem broken down into subproblems through a tree"
							src="/images/image1.png"
							style="width: 491.50px; height: 400.13px; margin-left: 0.00px; margin-top: 0.00px; transform: rotate(0.00rad) translateZ(0px); -webkit-transform: rotate(0.00rad) translateZ(0px);"
							title=""
						/></span
					>
				</p>
				<p class="c6">
					<span class="c7">Problem broken down into subproblems through a tree</span>
				</p>
			</div>
			<p class="c2"><span class="c1"></span></p>
			<p class="c4">
				<span class="c1"
					>This raises an issue however. What if people disagree on how a problem should be broken
					down. After all, a problem can be broken down in any number of ways. The solution here is
					to allow people to propose as many different strategies as they want. The system still
					thrives in the face of disagreement. Another issue is redundancy. Strategies, particularly
					those to the same problem, are likely to have overlap in terms of what problems they
					decide on. To solve this, people would be allowed to link to any existing subproblem in
					the tree, if it fits within their strategy.
				</span>
			</p>
			<p class="c2"><span class="c1"></span></p>
			<p class="c4">
				<span class="c1"
					>As stated earlier, problems are solved independent of completing the objective defined by
					the problem. We consider proposed solutions to be plans on how to achieve the problem.
					This is why we have a &ldquo;Plan&rdquo; page. This page would be dedicated to distilling
					the tree page into a list of action steps.
				</span>
			</p>
			<p class="c2"><span class="c1"></span></p>
			<p class="c4">
				<span class="c1"
					>This is a collaborative website, and what is a collaborative website without
					communication. This is the purpose of the &ldquo;Team&rdquo; page. A place for direct
					messaging, group chats(teams), forms, polls, etc.</span
				>
			</p>
			<p class="c2"><span class="c1"></span></p>
			<p class="c2"><span class="c1"></span></p>
			<p class="c2"><span class="c1"></span></p>
			<p class="c4"><span class="c5">How to Use:</span></p>
			<p class="c2"><span class="c1"></span></p>
			<p class="c4">
				<span class="c1">These are just the important notes on how to navigate the site:</span>
			</p>
			<p class="c2"><span class="c1"></span></p>
			<ul class="c11 lst-kix_4mdn3jwye9e0-0 start">
				<li class="c0 li-bullet-0">
					<span class="c1">To read a node click the book button at the top right of the node</span>
				</li>
				<li class="c0 li-bullet-0">
					<span class="c1">Click the edit button in the same place to begin editing</span>
				</li>
				<li class="c0 li-bullet-0">
					<span class="c1">Navigate between nodes with the arrow keys</span>
				</li>
				<li class="c0 li-bullet-0"><span class="c1">Shortcuts</span></li>
			</ul>
			<ul class="c11 lst-kix_4mdn3jwye9e0-1 start">
				<li class="c4 c8 li-bullet-0">
					<span class="c12">IMPORTANT</span><span>:</span><span class="c1"
						>&nbsp;Leave/Escape node: esc</span
					>
				</li>
				<li class="c4 c8 li-bullet-0"><span class="c1">Set home position: ctrl/cmd h</span></li>
				<li class="c4 c8 li-bullet-0"><span class="c1">Go to home position: h</span></li>
				<li class="c4 c8 li-bullet-0"><span class="c1">Full view: f</span></li>
			</ul>
			<ul class="c11 lst-kix_4mdn3jwye9e0-0">
				<li class="c0 li-bullet-0">
					<span class="c1">Double click title/subsections to edit</span>
				</li>
				<li class="c0 li-bullet-0">
					<span class="c1">Use the three dots in navbar to add a section</span>
				</li>
			</ul>
			<p class="c2"><span class="c5"></span></p>
			<a
				class="hover:underline text-[#1155cc] text-[13px] mt-[40px] ml-auto"
				href="https://docs.google.com/document/d/1SYBkAybnBulbF5w7YbxMIzVngomiCMs_6k7tDjz29Hk/edit?usp=sharing"
				target="_blank">Edit this page</a
			>
		</div>
	</div>
</div>

<style>
	ul.lst-kix_1kqqzx8lmu5v-2 {
		list-style-type: none;
	}
	ol.lst-kix_5n9jywy0rmvt-0.start {
		counter-reset: lst-ctn-kix_5n9jywy0rmvt-0 0;
	}
	ul.lst-kix_1kqqzx8lmu5v-3 {
		list-style-type: none;
	}
	ul.lst-kix_1kqqzx8lmu5v-0 {
		list-style-type: none;
	}
	ul.lst-kix_1kqqzx8lmu5v-1 {
		list-style-type: none;
	}
	.lst-kix_l4163ogvpnex-2 > li:before {
		content: '' counter(lst-ctn-kix_l4163ogvpnex-2, lower-roman) '. ';
	}
	.lst-kix_l4163ogvpnex-4 > li:before {
		content: '' counter(lst-ctn-kix_l4163ogvpnex-4, lower-latin) '. ';
	}
	ol.lst-kix_l4163ogvpnex-2.start {
		counter-reset: lst-ctn-kix_l4163ogvpnex-2 0;
	}
	.lst-kix_l4163ogvpnex-3 > li:before {
		content: '' counter(lst-ctn-kix_l4163ogvpnex-3, decimal) '. ';
	}
	.lst-kix_l4163ogvpnex-7 > li:before {
		content: '' counter(lst-ctn-kix_l4163ogvpnex-7, lower-latin) '. ';
	}
	ul.lst-kix_1kqqzx8lmu5v-8 {
		list-style-type: none;
	}
	.lst-kix_l4163ogvpnex-0 > li:before {
		content: '' counter(lst-ctn-kix_l4163ogvpnex-0, decimal) '. ';
	}
	.lst-kix_l4163ogvpnex-8 > li:before {
		content: '' counter(lst-ctn-kix_l4163ogvpnex-8, lower-roman) '. ';
	}
	ul.lst-kix_1kqqzx8lmu5v-6 {
		list-style-type: none;
	}
	ul.lst-kix_1kqqzx8lmu5v-7 {
		list-style-type: none;
	}
	ul.lst-kix_1kqqzx8lmu5v-4 {
		list-style-type: none;
	}
	ul.lst-kix_1kqqzx8lmu5v-5 {
		list-style-type: none;
	}
	.lst-kix_l4163ogvpnex-1 > li:before {
		content: '' counter(lst-ctn-kix_l4163ogvpnex-1, lower-latin) '. ';
	}
	.lst-kix_5n9jywy0rmvt-3 > li:before {
		content: '' counter(lst-ctn-kix_5n9jywy0rmvt-3, decimal) '. ';
	}
	.lst-kix_5n9jywy0rmvt-4 > li:before {
		content: '' counter(lst-ctn-kix_5n9jywy0rmvt-4, lower-latin) '. ';
	}
	ul.lst-kix_i9pmjo5plrvi-2 {
		list-style-type: none;
	}
	ul.lst-kix_i9pmjo5plrvi-1 {
		list-style-type: none;
	}
	ol.lst-kix_l4163ogvpnex-5.start {
		counter-reset: lst-ctn-kix_l4163ogvpnex-5 0;
	}
	ul.lst-kix_i9pmjo5plrvi-0 {
		list-style-type: none;
	}
	ul.lst-kix_i9pmjo5plrvi-6 {
		list-style-type: none;
	}
	.lst-kix_5n9jywy0rmvt-0 > li:before {
		content: '' counter(lst-ctn-kix_5n9jywy0rmvt-0, decimal) '. ';
	}
	ul.lst-kix_i9pmjo5plrvi-5 {
		list-style-type: none;
	}
	.lst-kix_5n9jywy0rmvt-0 > li {
		counter-increment: lst-ctn-kix_5n9jywy0rmvt-0;
	}
	ul.lst-kix_4mdn3jwye9e0-1 {
		list-style-type: none;
	}
	ul.lst-kix_i9pmjo5plrvi-4 {
		list-style-type: none;
	}
	ul.lst-kix_4mdn3jwye9e0-0 {
		list-style-type: none;
	}
	ul.lst-kix_i9pmjo5plrvi-3 {
		list-style-type: none;
	}
	ul.lst-kix_4mdn3jwye9e0-3 {
		list-style-type: none;
	}
	.lst-kix_5n9jywy0rmvt-1 > li:before {
		content: '' counter(lst-ctn-kix_5n9jywy0rmvt-1, lower-latin) '. ';
	}
	.lst-kix_5n9jywy0rmvt-2 > li:before {
		content: '' counter(lst-ctn-kix_5n9jywy0rmvt-2, lower-roman) '. ';
	}
	ul.lst-kix_4mdn3jwye9e0-2 {
		list-style-type: none;
	}
	ul.lst-kix_4mdn3jwye9e0-5 {
		list-style-type: none;
	}
	ul.lst-kix_i9pmjo5plrvi-8 {
		list-style-type: none;
	}
	ul.lst-kix_4mdn3jwye9e0-4 {
		list-style-type: none;
	}
	ul.lst-kix_i9pmjo5plrvi-7 {
		list-style-type: none;
	}
	ol.lst-kix_l4163ogvpnex-8.start {
		counter-reset: lst-ctn-kix_l4163ogvpnex-8 0;
	}
	ol.lst-kix_9e4jxz58ijhi-4.start {
		counter-reset: lst-ctn-kix_9e4jxz58ijhi-4 0;
	}
	ol.lst-kix_5n9jywy0rmvt-6.start {
		counter-reset: lst-ctn-kix_5n9jywy0rmvt-6 0;
	}
	.lst-kix_9e4jxz58ijhi-7 > li:before {
		content: '' counter(lst-ctn-kix_9e4jxz58ijhi-7, lower-latin) '. ';
	}
	.lst-kix_9e4jxz58ijhi-8 > li:before {
		content: '' counter(lst-ctn-kix_9e4jxz58ijhi-8, lower-roman) '. ';
	}
	.lst-kix_5n9jywy0rmvt-7 > li:before {
		content: '' counter(lst-ctn-kix_5n9jywy0rmvt-7, lower-latin) '. ';
	}
	.lst-kix_5n9jywy0rmvt-5 > li:before {
		content: '' counter(lst-ctn-kix_5n9jywy0rmvt-5, lower-roman) '. ';
	}
	.lst-kix_5n9jywy0rmvt-6 > li:before {
		content: '' counter(lst-ctn-kix_5n9jywy0rmvt-6, decimal) '. ';
	}
	ol.lst-kix_9e4jxz58ijhi-7.start {
		counter-reset: lst-ctn-kix_9e4jxz58ijhi-7 0;
	}
	.lst-kix_5n9jywy0rmvt-8 > li:before {
		content: '' counter(lst-ctn-kix_5n9jywy0rmvt-8, lower-roman) '. ';
	}
	.lst-kix_5n9jywy0rmvt-2 > li {
		counter-increment: lst-ctn-kix_5n9jywy0rmvt-2;
	}
	.lst-kix_l4163ogvpnex-6 > li:before {
		content: '' counter(lst-ctn-kix_l4163ogvpnex-6, decimal) '. ';
	}
	.lst-kix_9e4jxz58ijhi-1 > li {
		counter-increment: lst-ctn-kix_9e4jxz58ijhi-1;
	}
	.lst-kix_l4163ogvpnex-7 > li {
		counter-increment: lst-ctn-kix_l4163ogvpnex-7;
	}
	ol.lst-kix_5n9jywy0rmvt-3.start {
		counter-reset: lst-ctn-kix_5n9jywy0rmvt-3 0;
	}
	.lst-kix_l4163ogvpnex-5 > li:before {
		content: '' counter(lst-ctn-kix_l4163ogvpnex-5, lower-roman) '. ';
	}
	ol.lst-kix_5n9jywy0rmvt-4 {
		list-style-type: none;
	}
	ol.lst-kix_5n9jywy0rmvt-3 {
		list-style-type: none;
	}
	.lst-kix_xbgds6zcul8s-8 > li:before {
		content: '\0025a0   ';
	}
	ol.lst-kix_5n9jywy0rmvt-6 {
		list-style-type: none;
	}
	.lst-kix_1kqqzx8lmu5v-0 > li:before {
		content: '-  ';
	}
	ol.lst-kix_5n9jywy0rmvt-5 {
		list-style-type: none;
	}
	ol.lst-kix_5n9jywy0rmvt-0 {
		list-style-type: none;
	}
	.lst-kix_xbgds6zcul8s-7 > li:before {
		content: '\0025cb   ';
	}
	ol.lst-kix_5n9jywy0rmvt-2 {
		list-style-type: none;
	}
	ol.lst-kix_5n9jywy0rmvt-1 {
		list-style-type: none;
	}
	.lst-kix_xbgds6zcul8s-4 > li:before {
		content: '\0025cb   ';
	}
	.lst-kix_xbgds6zcul8s-5 > li:before {
		content: '\0025a0   ';
	}
	.lst-kix_1kqqzx8lmu5v-2 > li:before {
		content: '-  ';
	}
	ol.lst-kix_5n9jywy0rmvt-8 {
		list-style-type: none;
	}
	.lst-kix_1kqqzx8lmu5v-1 > li:before {
		content: '-  ';
	}
	ol.lst-kix_5n9jywy0rmvt-7 {
		list-style-type: none;
	}
	.lst-kix_xbgds6zcul8s-6 > li:before {
		content: '\0025cf   ';
	}
	ol.lst-kix_9e4jxz58ijhi-0 {
		list-style-type: none;
	}
	.lst-kix_1kqqzx8lmu5v-7 > li:before {
		content: '-  ';
	}
	ol.lst-kix_9e4jxz58ijhi-1 {
		list-style-type: none;
	}
	.lst-kix_i9pmjo5plrvi-7 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_i9pmjo5plrvi-8 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_xbgds6zcul8s-0 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_xbgds6zcul8s-1 > li:before {
		content: '\0025cb   ';
	}
	.lst-kix_5n9jywy0rmvt-4 > li {
		counter-increment: lst-ctn-kix_5n9jywy0rmvt-4;
	}
	.lst-kix_1kqqzx8lmu5v-6 > li:before {
		content: '-  ';
	}
	.lst-kix_1kqqzx8lmu5v-8 > li:before {
		content: '-  ';
	}
	ol.lst-kix_9e4jxz58ijhi-4 {
		list-style-type: none;
	}
	ol.lst-kix_9e4jxz58ijhi-5 {
		list-style-type: none;
	}
	.lst-kix_i9pmjo5plrvi-6 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_xbgds6zcul8s-3 > li:before {
		content: '\0025cf   ';
	}
	ol.lst-kix_5n9jywy0rmvt-2.start {
		counter-reset: lst-ctn-kix_5n9jywy0rmvt-2 0;
	}
	ol.lst-kix_9e4jxz58ijhi-2 {
		list-style-type: none;
	}
	ol.lst-kix_9e4jxz58ijhi-3 {
		list-style-type: none;
	}
	ol.lst-kix_9e4jxz58ijhi-8 {
		list-style-type: none;
	}
	.lst-kix_1kqqzx8lmu5v-3 > li:before {
		content: '-  ';
	}
	.lst-kix_i9pmjo5plrvi-3 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_i9pmjo5plrvi-4 > li:before {
		content: '\0025cf   ';
	}
	ol.lst-kix_9e4jxz58ijhi-6 {
		list-style-type: none;
	}
	.lst-kix_1kqqzx8lmu5v-4 > li:before {
		content: '-  ';
	}
	ol.lst-kix_9e4jxz58ijhi-7 {
		list-style-type: none;
	}
	ol.lst-kix_l4163ogvpnex-3.start {
		counter-reset: lst-ctn-kix_l4163ogvpnex-3 0;
	}
	.lst-kix_9e4jxz58ijhi-6 > li:before {
		content: '' counter(lst-ctn-kix_9e4jxz58ijhi-6, decimal) '. ';
	}
	.lst-kix_1kqqzx8lmu5v-5 > li:before {
		content: '-  ';
	}
	.lst-kix_i9pmjo5plrvi-5 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_xbgds6zcul8s-2 > li:before {
		content: '\0025a0   ';
	}
	.lst-kix_9e4jxz58ijhi-5 > li:before {
		content: '' counter(lst-ctn-kix_9e4jxz58ijhi-5, lower-roman) '. ';
	}
	.lst-kix_9e4jxz58ijhi-4 > li:before {
		content: '' counter(lst-ctn-kix_9e4jxz58ijhi-4, lower-latin) '. ';
	}
	ul.lst-kix_4mdn3jwye9e0-7 {
		list-style-type: none;
	}
	ul.lst-kix_xbgds6zcul8s-4 {
		list-style-type: none;
	}
	.lst-kix_l4163ogvpnex-8 > li {
		counter-increment: lst-ctn-kix_l4163ogvpnex-8;
	}
	ul.lst-kix_4mdn3jwye9e0-6 {
		list-style-type: none;
	}
	.lst-kix_i9pmjo5plrvi-0 > li:before {
		content: '\0025cf   ';
	}
	ul.lst-kix_xbgds6zcul8s-5 {
		list-style-type: none;
	}
	.lst-kix_l4163ogvpnex-5 > li {
		counter-increment: lst-ctn-kix_l4163ogvpnex-5;
	}
	ul.lst-kix_xbgds6zcul8s-6 {
		list-style-type: none;
	}
	ul.lst-kix_4mdn3jwye9e0-8 {
		list-style-type: none;
	}
	ul.lst-kix_xbgds6zcul8s-7 {
		list-style-type: none;
	}
	ul.lst-kix_xbgds6zcul8s-8 {
		list-style-type: none;
	}
	ol.lst-kix_l4163ogvpnex-7 {
		list-style-type: none;
	}
	.lst-kix_i9pmjo5plrvi-2 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_l4163ogvpnex-2 > li {
		counter-increment: lst-ctn-kix_l4163ogvpnex-2;
	}
	ol.lst-kix_l4163ogvpnex-6 {
		list-style-type: none;
	}
	.lst-kix_9e4jxz58ijhi-2 > li {
		counter-increment: lst-ctn-kix_9e4jxz58ijhi-2;
	}
	.lst-kix_9e4jxz58ijhi-3 > li:before {
		content: '' counter(lst-ctn-kix_9e4jxz58ijhi-3, decimal) '. ';
	}
	ol.lst-kix_l4163ogvpnex-8 {
		list-style-type: none;
	}
	.lst-kix_9e4jxz58ijhi-0 > li:before {
		content: '' counter(lst-ctn-kix_9e4jxz58ijhi-0, decimal) '. ';
	}
	ol.lst-kix_l4163ogvpnex-3 {
		list-style-type: none;
	}
	ol.lst-kix_l4163ogvpnex-2 {
		list-style-type: none;
	}
	ol.lst-kix_l4163ogvpnex-5 {
		list-style-type: none;
	}
	ol.lst-kix_l4163ogvpnex-4 {
		list-style-type: none;
	}
	ol.lst-kix_5n9jywy0rmvt-1.start {
		counter-reset: lst-ctn-kix_5n9jywy0rmvt-1 0;
	}
	.lst-kix_9e4jxz58ijhi-2 > li:before {
		content: '' counter(lst-ctn-kix_9e4jxz58ijhi-2, lower-roman) '. ';
	}
	ul.lst-kix_xbgds6zcul8s-0 {
		list-style-type: none;
	}
	.lst-kix_9e4jxz58ijhi-5 > li {
		counter-increment: lst-ctn-kix_9e4jxz58ijhi-5;
	}
	.lst-kix_9e4jxz58ijhi-8 > li {
		counter-increment: lst-ctn-kix_9e4jxz58ijhi-8;
	}
	.lst-kix_i9pmjo5plrvi-1 > li:before {
		content: '\0025cf   ';
	}
	ul.lst-kix_xbgds6zcul8s-1 {
		list-style-type: none;
	}
	.lst-kix_9e4jxz58ijhi-1 > li:before {
		content: '' counter(lst-ctn-kix_9e4jxz58ijhi-1, lower-latin) '. ';
	}
	ul.lst-kix_xbgds6zcul8s-2 {
		list-style-type: none;
	}
	ol.lst-kix_l4163ogvpnex-1 {
		list-style-type: none;
	}
	ul.lst-kix_xbgds6zcul8s-3 {
		list-style-type: none;
	}
	ol.lst-kix_l4163ogvpnex-0 {
		list-style-type: none;
	}
	.lst-kix_5n9jywy0rmvt-1 > li {
		counter-increment: lst-ctn-kix_5n9jywy0rmvt-1;
	}
	ol.lst-kix_9e4jxz58ijhi-5.start {
		counter-reset: lst-ctn-kix_9e4jxz58ijhi-5 0;
	}
	ol.lst-kix_5n9jywy0rmvt-8.start {
		counter-reset: lst-ctn-kix_5n9jywy0rmvt-8 0;
	}
	.lst-kix_5n9jywy0rmvt-6 > li {
		counter-increment: lst-ctn-kix_5n9jywy0rmvt-6;
	}
	ol.lst-kix_9e4jxz58ijhi-3.start {
		counter-reset: lst-ctn-kix_9e4jxz58ijhi-3 0;
	}
	.lst-kix_l4163ogvpnex-3 > li {
		counter-increment: lst-ctn-kix_l4163ogvpnex-3;
	}
	.lst-kix_9e4jxz58ijhi-6 > li {
		counter-increment: lst-ctn-kix_9e4jxz58ijhi-6;
	}
	.lst-kix_4mdn3jwye9e0-7 > li:before {
		content: '\0025cb   ';
	}
	ol.lst-kix_5n9jywy0rmvt-4.start {
		counter-reset: lst-ctn-kix_5n9jywy0rmvt-4 0;
	}
	.lst-kix_5n9jywy0rmvt-7 > li {
		counter-increment: lst-ctn-kix_5n9jywy0rmvt-7;
	}
	.lst-kix_4mdn3jwye9e0-8 > li:before {
		content: '\0025a0   ';
	}
	ol.lst-kix_9e4jxz58ijhi-6.start {
		counter-reset: lst-ctn-kix_9e4jxz58ijhi-6 0;
	}
	ol.lst-kix_5n9jywy0rmvt-7.start {
		counter-reset: lst-ctn-kix_5n9jywy0rmvt-7 0;
	}
	ol.lst-kix_l4163ogvpnex-1.start {
		counter-reset: lst-ctn-kix_l4163ogvpnex-1 0;
	}
	ol.lst-kix_l4163ogvpnex-4.start {
		counter-reset: lst-ctn-kix_l4163ogvpnex-4 0;
	}
	ol.lst-kix_9e4jxz58ijhi-0.start {
		counter-reset: lst-ctn-kix_9e4jxz58ijhi-0 0;
	}
	.lst-kix_l4163ogvpnex-1 > li {
		counter-increment: lst-ctn-kix_l4163ogvpnex-1;
	}
	.lst-kix_9e4jxz58ijhi-7 > li {
		counter-increment: lst-ctn-kix_9e4jxz58ijhi-7;
	}
	.lst-kix_l4163ogvpnex-4 > li {
		counter-increment: lst-ctn-kix_l4163ogvpnex-4;
	}
	.lst-kix_5n9jywy0rmvt-8 > li {
		counter-increment: lst-ctn-kix_5n9jywy0rmvt-8;
	}
	.lst-kix_9e4jxz58ijhi-4 > li {
		counter-increment: lst-ctn-kix_9e4jxz58ijhi-4;
	}
	.lst-kix_5n9jywy0rmvt-5 > li {
		counter-increment: lst-ctn-kix_5n9jywy0rmvt-5;
	}
	.lst-kix_5n9jywy0rmvt-3 > li {
		counter-increment: lst-ctn-kix_5n9jywy0rmvt-3;
	}
	ol.lst-kix_l4163ogvpnex-7.start {
		counter-reset: lst-ctn-kix_l4163ogvpnex-7 0;
	}
	ol.lst-kix_5n9jywy0rmvt-5.start {
		counter-reset: lst-ctn-kix_5n9jywy0rmvt-5 0;
	}
	ol.lst-kix_9e4jxz58ijhi-8.start {
		counter-reset: lst-ctn-kix_9e4jxz58ijhi-8 0;
	}
	.lst-kix_9e4jxz58ijhi-3 > li {
		counter-increment: lst-ctn-kix_9e4jxz58ijhi-3;
	}
	.lst-kix_l4163ogvpnex-6 > li {
		counter-increment: lst-ctn-kix_l4163ogvpnex-6;
	}
	ol.lst-kix_l4163ogvpnex-0.start {
		counter-reset: lst-ctn-kix_l4163ogvpnex-0 0;
	}
	ol.lst-kix_9e4jxz58ijhi-1.start {
		counter-reset: lst-ctn-kix_9e4jxz58ijhi-1 0;
	}
	.lst-kix_4mdn3jwye9e0-1 > li:before {
		content: '\0025cb   ';
	}
	.lst-kix_4mdn3jwye9e0-0 > li:before {
		content: '\0025cf   ';
	}
	ol.lst-kix_l4163ogvpnex-6.start {
		counter-reset: lst-ctn-kix_l4163ogvpnex-6 0;
	}
	.lst-kix_4mdn3jwye9e0-5 > li:before {
		content: '\0025a0   ';
	}
	li.li-bullet-0:before {
		margin-left: -18pt;
		white-space: nowrap;
		display: inline-block;
		min-width: 18pt;
	}
	.lst-kix_9e4jxz58ijhi-0 > li {
		counter-increment: lst-ctn-kix_9e4jxz58ijhi-0;
	}
	.lst-kix_4mdn3jwye9e0-6 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_l4163ogvpnex-0 > li {
		counter-increment: lst-ctn-kix_l4163ogvpnex-0;
	}
	ol.lst-kix_9e4jxz58ijhi-2.start {
		counter-reset: lst-ctn-kix_9e4jxz58ijhi-2 0;
	}
	.lst-kix_4mdn3jwye9e0-4 > li:before {
		content: '\0025cb   ';
	}
	.lst-kix_4mdn3jwye9e0-3 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_4mdn3jwye9e0-2 > li:before {
		content: '\0025a0   ';
	}
	ol {
		margin: 0;
		padding: 0;
	}
	table td,
	table th {
		padding: 0;
	}
	.c9 {
		-webkit-text-decoration-skip: none;
		color: #d6d6d6;
		font-weight: 400;
		text-decoration: underline;
		vertical-align: baseline;
		text-decoration-skip-ink: none;
		font-size: 11pt;
		font-family: 'Arial';
		font-style: italic;
	}
	.c0 {
		margin-left: 36pt;
		padding-top: 0pt;
		padding-left: 0pt;
		padding-bottom: 0pt;
		line-height: 1.15;
		orphans: 2;
		widows: 2;
		text-align: left;
	}
	.c13 {
		color: #d6d6d6;
		font-weight: 400;
		text-decoration: none;
		vertical-align: baseline;
		font-size: 20pt;
		font-family: 'Arial';
		font-style: normal;
	}
	.c5 {
		color: #d6d6d6;
		font-weight: 400;
		text-decoration: none;
		vertical-align: baseline;
		font-size: 15pt;
		font-family: 'Arial';
		font-style: normal;
	}
	.c7 {
		color: #b0b0b0;
		font-weight: 400;
		text-decoration: none;
		vertical-align: baseline;
		font-size: 9pt;
		font-family: 'Arial';
		font-style: italic;
	}
	.c14 {
		color: #d6d6d6;
		font-weight: 400;
		text-decoration: none;
		vertical-align: baseline;
		font-size: 22pt;
		font-family: 'Arial';
		font-style: normal;
	}
	.c2 {
		padding-top: 0pt;
		padding-bottom: 0pt;
		line-height: 1.15;
		orphans: 2;
		widows: 2;
		text-align: left;
		height: 11pt;
	}
	.c1 {
		color: #d6d6d6;
		font-weight: 400;
		text-decoration: none;
		vertical-align: baseline;
		font-size: 11pt;
		font-family: 'Arial';
		font-style: normal;
	}
	.c4 {
		padding-top: 0pt;
		padding-bottom: 0pt;
		line-height: 1.15;
		orphans: 2;
		widows: 2;
		text-align: left;
	}
	.c6 {
		padding-top: 0pt;
		padding-bottom: 0pt;
		line-height: 1.15;
		orphans: 2;
		widows: 2;
		text-align: center;
	}
	.c16 {
		text-decoration-skip-ink: none;
		-webkit-text-decoration-skip: none;
		color: #1155cc;
		text-decoration: underline;
	}
	.c10 {
		background-color: #ffffff;
		max-width: 468pt;
		padding: 72pt 72pt 72pt 72pt;
	}
	.c8 {
		margin-left: 72pt;
		padding-left: 0pt;
	}
	.c3 {
		color: inherit;
		text-decoration: inherit;
	}
	.c11 {
		padding: 0;
		margin: 0;
	}
	.c15 {
		font-size: 22pt;
	}
	.c12 {
		font-weight: 700;
	}
	.title {
		padding-top: 0pt;
		color: #d6d6d6;
		font-size: 26pt;
		padding-bottom: 3pt;
		font-family: 'Arial';
		line-height: 1.15;
		page-break-after: avoid;
		orphans: 2;
		widows: 2;
		text-align: left;
	}
	.subtitle {
		padding-top: 0pt;
		color: #666666;
		font-size: 15pt;
		padding-bottom: 16pt;
		font-family: 'Arial';
		line-height: 1.15;
		page-break-after: avoid;
		orphans: 2;
		widows: 2;
		text-align: left;
	}
	li {
		color: #d6d6d6;
		font-size: 11pt;
		font-family: 'Arial';
	}
	p {
		margin: 0;
		color: #d6d6d6;
		font-size: 11pt;
		font-family: 'Arial';
	}
	h1 {
		padding-top: 20pt;
		color: #d6d6d6;
		font-size: 20pt;
		padding-bottom: 6pt;
		font-family: 'Arial';
		line-height: 1.15;
		page-break-after: avoid;
		orphans: 2;
		widows: 2;
		text-align: left;
	}
	h2 {
		padding-top: 18pt;
		color: #d6d6d6;
		font-size: 16pt;
		padding-bottom: 6pt;
		font-family: 'Arial';
		line-height: 1.15;
		page-break-after: avoid;
		orphans: 2;
		widows: 2;
		text-align: left;
	}
	h3 {
		padding-top: 16pt;
		color: #434343;
		font-size: 14pt;
		padding-bottom: 4pt;
		font-family: 'Arial';
		line-height: 1.15;
		page-break-after: avoid;
		orphans: 2;
		widows: 2;
		text-align: left;
	}
	h4 {
		padding-top: 14pt;
		color: #666666;
		font-size: 12pt;
		padding-bottom: 4pt;
		font-family: 'Arial';
		line-height: 1.15;
		page-break-after: avoid;
		orphans: 2;
		widows: 2;
		text-align: left;
	}
	h5 {
		padding-top: 12pt;
		color: #666666;
		font-size: 11pt;
		padding-bottom: 4pt;
		font-family: 'Arial';
		line-height: 1.15;
		page-break-after: avoid;
		orphans: 2;
		widows: 2;
		text-align: left;
	}
	h6 {
		padding-top: 12pt;
		color: #666666;
		font-size: 11pt;
		padding-bottom: 4pt;
		font-family: 'Arial';
		line-height: 1.15;
		page-break-after: avoid;
		font-style: italic;
		orphans: 2;
		widows: 2;
		text-align: left;
	}
</style>
