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
		<div class="w-[80%] max-w-[713px] flex flex-col items-start mt-[80px] mb-[120px]">
			<p class="c1"><span class="c16">Thank you for participating in this </span></p>
			<p class="c1"><span class="c4 c17">feedback</span><span class="c17">&nbsp;session!</span></p>
			<p class="c1 c3"><span class="c12"></span></p>
			<p class="c1"><span class="c10">TO DO:</span></p>
			<p class="c1 c3"><span class="c0"></span></p>
			<ol class="c9 lst-kix_5n9jywy0rmvt-0 start" start="1">
				<li class="c1 c6 li-bullet-0">
					<span>Read: &ldquo;Problem Solving Ideology&rdquo;, &ldquo;Ho</span><span
						>w to Use&rdquo;, and &ldquo;Guidelines&rdquo;</span
					>
				</li>
				<li class="c1 c6 li-bullet-0">
					<span class="c0">Play around: &ldquo;Tree&rdquo; page</span>
				</li>
				<li class="c1 c6 li-bullet-0">
					<span>Give feedback: </span><span class="c11"
						><a
							class="c7"
							href="https://www.google.com/url?q=https://forms.gle/PPUF31AoGTTURx5D8&amp;sa=D&amp;source=editors&amp;ust=1714229965133753&amp;usg=AOvVaw22_rQJUPhME3EQRPCjJUBx"
							>https://forms.gle/PPUF31AoGTTURx5D8</a
						></span
					>
				</li>
			</ol>
			<p class="c1 c3"><span class="c0"></span></p>
			<p class="c1 c3"><span class="c0"></span></p>
			<p class="c1"><span class="c10">Problem Solving Ideology:</span></p>
			<p class="c1 c3"><span class="c0"></span></p>
			<p class="c1">
				<span
					>At AISS, we define problems as essentially goals in which collaborators strive to grasp
					how to complete.</span
				><span>&nbsp;</span><span class="c0"
					>Once we have gained a solid understanding of how to complete said goal, we consider the
					problem solved. Here is an example:</span
				>
			</p>
			<p class="c1 c3"><span class="c0"></span></p>
			<ul class="c9 lst-kix_xbgds6zcul8s-0 start">
				<li class="c1 c6 li-bullet-0">
					<span class="c0">Problem: I need milk but don&#39;t have it (Goal: acquire milk)</span>
				</li>
				<li class="c1 c6 li-bullet-0">
					<span class="c0">Proposed solution: Go to the grocery store and get milk</span>
				</li>
			</ul>
			<p class="c1 c3"><span class="c0"></span></p>
			<p class="c1">
				<span class="c0"
					>Even though I haven&#39;t necessarily gone out to get milk, I consider this problem to be
					solved. As in, I don&#39;t need to think too much more about achieving my goal, I just
					have to act on my proposed solution.</span
				>
			</p>
			<p class="c1 c3"><span class="c0"></span></p>
			<p class="c1">
				<span>However, when </span><span>big</span><span class="c0"
					>&nbsp;problems need solving, it might be easier to break a problem down into smaller,
					more manageable subproblems. How one decides to break down a big problem and why, could be
					encapsulated in a strategy (instead of a solution).</span
				>
			</p>
			<p class="c1 c3"><span class="c0"></span></p>
			<div class="mx-auto">
				<p class="c2">
					<span
						style="overflow: hidden; display: inline-block; margin: 0.00px 0.00px; border: 0.00px solid #000000; transform: rotate(0.00rad) translateZ(0px); -webkit-transform: rotate(0.00rad) translateZ(0px); width: 538.50px; height: 460.00px;"
						><img
							alt="Problem broken down into subproblems through a tree"
							src="/images/image1.png"
							style="width: 538.50px; height: 460.00px; margin-left: 0.00px; margin-top: 0.00px; transform: rotate(0.00rad) translateZ(0px); -webkit-transform: rotate(0.00rad) translateZ(0px);"
							title=""
						/></span
					>
				</p>
				<p class="c2">
					<span class="c20">Problem broken down into subproblems through a tree</span>
				</p>
			</div>
			<p class="c1 c3"><span class="c0"></span></p>
			<p class="c1">
				<span class="c0"
					>A strategy breaks down a problem in a way where if all of its sub-problems are solved,
					then the parent problem gets solved. For a developed strategy to have been considered
					successful, it must:</span
				>
			</p>
			<p class="c1 c3"><span class="c0"></span></p>
			<ol class="c9 lst-kix_k39ns5nc81d5-0 start" start="1">
				<li class="c1 c6 li-bullet-0">
					<span class="c0"
						>Break down the parent problem into a definitive set of subproblems, which if solved,
						would in turn solve the parent problem. (As defined by some logic)</span
					>
				</li>
				<li class="c1 c6 li-bullet-0">
					<span class="c0"
						>Define subproblems which are all simpler or very likely easier to solve/think about
						than the parent problem. They don&rsquo;t have to be collectively easier, just
						individually.</span
					>
				</li>
			</ol>
			<p class="c1 c3"><span class="c0"></span></p>
			<p class="c1">
				<span class="c0"
					>You can imagine how, as the tree gets deeper, problems become easier and easier to solve.
					Hopefully to a point where they don&rsquo;t need to be broken down further and can simply
					be solved out right. If all of the problem leaves of a tree get solved, then the solving
					of problems cascades up the tree solving the big problem.</span
				>
			</p>
			<p class="c1 c3"><span class="c0"></span></p>
			<p class="c1">
				<span class="c0"
					>As this is a collaborative tool, people are likely to disagree on how a problem should be
					broken down. After all, a problem can be broken down in any number of ways. The solution
					here is to allow people to propose as many different strategies as they want (In the tree
					page you can navigate between strategies with arrow buttons). Thus, the system still
					thrives in the face of disagreement. Another issue is redundancy. Strategies, particularly
					those to the same problem, are likely to have overlap in terms of what problems they
					decide on. To solve this, people would be allowed to link to any existing subproblem in
					the tree, if it fits within their strategy.</span
				>
			</p>
			<p class="c1 c3"><span class="c0"></span></p>
			<p class="c1">
				<span class="c0"
					>It is important to point out that this structure is not perfect, and can be semantically
					confusing. I am not currently crystal clear on how this structure should be used. The
					following are some questions which are currently unanswered:</span
				>
			</p>
			<p class="c1 c3"><span class="c0"></span></p>
			<ul class="c9 lst-kix_38zswjdicgwh-0 start">
				<li class="c1 c6 li-bullet-0">
					<span class="c0">To what level should a given strategy break down a problem?</span>
				</li>
				<li class="c1 c6 li-bullet-0"><span class="c0">How detailed should each node be?</span></li>
				<li class="c1 c6 li-bullet-0">
					<span class="c0"
						>How difficult is it to actually break down a problem into a definitive set of
						subproblems which solve the problem? (ie. Is this system even practical?)</span
					>
				</li>
				<li class="c1 c6 li-bullet-0">
					<span class="c0">How should strategies be ranked? (up/down votes, moderators, etc.)</span>
				</li>
			</ul>
			<p class="c1 c3"><span class="c0"></span></p>
			<p class="c1">
				<span class="c0"
					>I do hope that as more people use it, these questions (and many others) will become more
					clear, but in the meantime, feel free to ponder these, and let us know your thoughts. (The
					&ldquo;Ideas&rdquo; page is coming soon!)</span
				>
			</p>
			<p class="c1 c3"><span class="c0"></span></p>
			<p class="c1">
				<span class="c0"
					>As stated earlier, problems are solved independent of completing the objective defined by
					the problem. By framing problems in terms of an objective, which is preferably measurable,
					it helps people ideate strategies and frame their thinking.
				</span>
			</p>
			<p class="c1 c3"><span class="c0"></span></p>
			<p class="c1 c3"><span class="c0"></span></p>
			<p class="c1"><span class="c10">Pages:</span></p>
			<p class="c1 c3"><span class="c0"></span></p>
			<ul class="c9 lst-kix_eymv275zzudt-0 start">
				<li class="c1 c6 li-bullet-0">
					<span class="c4">Tree</span><span class="c0"
						>: See &ldquo;Problem Solving Ideology&rdquo;</span
					>
				</li>
				<li class="c1 c6 li-bullet-0">
					<span class="c4">Plan</span><span class="c0"
						>: Once a big problem has been solved, because achieving the goal of a problem is
						independent of solving it, there exists an incomplete plan as defined by the strategies.
						This page would be for distilling that plan into a list of actionable items which our
						community would carry out.
					</span>
				</li>
				<li class="c1 c6 li-bullet-0">
					<span class="c4">Team</span><span
						>: This page links you to our discord which is where we currently communicate</span
					>
				</li>
				<li class="c1 c6 li-bullet-0">
					<span class="c4">Ideas</span><span class="c0"
						>: A place for people to post feature ideas, questions, thoughts, bugs, etc.</span
					>
				</li>
				<li class="c1 c6 li-bullet-0">
					<span class="c4">Learn</span><span class="c0"
						>: List of helpful resources to get you familiar with AI Safety</span
					>
				</li>
			</ul>
			<p class="c1 c3"><span class="c0"></span></p>
			<p class="c1 c3"><span class="c0"></span></p>
			<p class="c1"><span class="c10">How to Use:</span></p>
			<p class="c1 c3"><span class="c0"></span></p>
			<ul class="c9 lst-kix_4mdn3jwye9e0-0 start">
				<li class="c1 c6 li-bullet-0">
					<span class="c0">To read a node click the book button at the top right of the node</span>
				</li>
				<li class="c1 c6 li-bullet-0">
					<span class="c0">Click the edit button in the same place to begin editing</span>
				</li>
				<li class="c1 c6 li-bullet-0">
					<span class="c0"
						>Only one person can edit a node at a time (so the edit button might be grayed out)</span
					>
				</li>
				<li class="c1 c6 li-bullet-0">
					<span class="c0">If don&rsquo;t own a node, you are put in suggesting mode</span>
				</li>
				<li class="c1 c6 li-bullet-0">
					<span class="c0">Navigate between nodes with the arrow keys</span>
				</li>
				<li class="c1 c6 li-bullet-0"><span class="c0">Shortcuts</span></li>
			</ul>
			<ul class="c9 lst-kix_4mdn3jwye9e0-1 start">
				<li class="c1 c5 li-bullet-0">
					<span class="c4">IMPORTANT</span><span>:</span><span class="c0"
						>&nbsp;Leave/Escape node: esc</span
					>
				</li>
				<li class="c1 c5 li-bullet-0"><span class="c0">Set home position: ctrl/cmd h</span></li>
				<li class="c1 c5 li-bullet-0"><span class="c0">Go to home position: h</span></li>
				<li class="c1 c5 li-bullet-0"><span class="c0">Full view: f</span></li>
			</ul>
			<ul class="c9 lst-kix_4mdn3jwye9e0-0">
				<li class="c1 c6 li-bullet-0">
					<span class="c0">Double click title/subsections to edit</span>
				</li>
				<li class="c1 c6 li-bullet-0"><span class="c0">Right click subsections to delete</span></li>
				<li class="c1 c6 li-bullet-0">
					<span class="c0">Use the three dots in navbar to add a section</span>
				</li>
			</ul>
			<p class="c1 c3"><span class="c0"></span></p>
			<p class="c1 c3"><span class="c0"></span></p>
			<p class="c1"><span class="c10">Guidelines:</span></p>
			<p class="c1 c3"><span class="c0"></span></p>
			<p class="c1">
				<span class="c0"
					>I recently did some very crude user testing where I gave people a piece of paper and
					asked them to solve a problem using this idea. I found it very common for people to not
					only use the system to solve the problem, but also to figure out how to solve the problem
					in a way which violated the constraints of the system. For example, when given a problem
					like &quot;building a house&quot;, people might write a strategy which includes the
					problem, &quot;talk to a house expert&quot;, and then they might have another problem
					which depends on that problem, say &quot;write a plan based on what the expert said&quot;.
					This kind of dependency is problematic because it breaks the first rule for strategies. If
					the logic is not yet defined for how the solving of all of the subproblems will result in
					the solving of the parent problem, then the cascading effect is broken. Using this
					example, it would have been better if the user first talked to the expert, and then wrote
					their sub-problems depending on what the expert said. This is not to be confused with the
					fact that subproblems can intertwine with each other, as long as that logic is defined
					within the strategy. How defined the logic for a strategy should be and how that is even
					measured are still open questions. I also noticed people using strategies to critique the
					problem they were supposed to be solving. Don&#39;t do this.
				</span>
			</p>
			<p class="c1 c3"><span class="c0"></span></p>
			<p class="c1">
				<span
					>It is generally recommended to try and edit existing strategies rather than create a new
					one. If you have an idea for a direction or strategy, FIRST propose it to the existing
					owner. If they aren&rsquo;t receptive, then create your own.</span
				>
			</p>
			<p class="c1 c3"><span class="c0"></span></p>
			<p class="c1"><span class="c10">FAQs:</span></p>
			<p class="c1 c3"><span class="c0"></span></p>
			<p class="c15"><span class="c4 c8">How can I help?</span></p>
			<ul class="c9 lst-kix_s8ga7gzevg2y-0 start">
				<li class="c6 c15 li-bullet-0">
					<span
						>Testing out the site is a big help, so thank you! If you are interested to help out
						further. Feel free to email me at
					</span><span class="c11"
						><a class="c7" href="mailto:aisafetysphere@gmail.com">aisafetysphere@gmail.com</a></span
					><span>. I am in need of people to help further develop the site. </span>
				</li>
			</ul>
			<a
				class="hover:underline text-[#1155cc] text-[13px] mt-[40px] ml-auto"
				href="https://docs.google.com/document/d/1SYBkAybnBulbF5w7YbxMIzVngomiCMs_6k7tDjz29Hk/edit?usp=sharing"
				target="_blank">Edit this page</a
			>
		</div>
	</div>
</div>

<style>
	ol.lst-kix_5n9jywy0rmvt-0.start {
		counter-reset: lst-ctn-kix_5n9jywy0rmvt-0 0;
	}
	ol.lst-kix_k39ns5nc81d5-0.start {
		counter-reset: lst-ctn-kix_k39ns5nc81d5-0 0;
	}
	ol.lst-kix_l4163ogvpnex-5.start {
		counter-reset: lst-ctn-kix_l4163ogvpnex-5 0;
	}
	.lst-kix_k39ns5nc81d5-3 > li {
		counter-increment: lst-ctn-kix_k39ns5nc81d5-3;
	}
	.lst-kix_38zswjdicgwh-5 > li:before {
		content: '\0025a0   ';
	}
	.lst-kix_38zswjdicgwh-6 > li:before {
		content: '\0025cf   ';
	}
	ul.lst-kix_38zswjdicgwh-4 {
		list-style-type: none;
	}
	.lst-kix_s8ga7gzevg2y-0 > li:before {
		content: '-  ';
	}
	ul.lst-kix_38zswjdicgwh-5 {
		list-style-type: none;
	}
	ul.lst-kix_38zswjdicgwh-2 {
		list-style-type: none;
	}
	.lst-kix_k39ns5nc81d5-1 > li {
		counter-increment: lst-ctn-kix_k39ns5nc81d5-1;
	}
	ol.lst-kix_5n9jywy0rmvt-6.start {
		counter-reset: lst-ctn-kix_5n9jywy0rmvt-6 0;
	}
	ul.lst-kix_38zswjdicgwh-3 {
		list-style-type: none;
	}
	ul.lst-kix_38zswjdicgwh-0 {
		list-style-type: none;
	}
	ul.lst-kix_38zswjdicgwh-1 {
		list-style-type: none;
	}
	.lst-kix_38zswjdicgwh-4 > li:before {
		content: '\0025cb   ';
	}
	.lst-kix_s8ga7gzevg2y-1 > li:before {
		content: '-  ';
	}
	.lst-kix_38zswjdicgwh-3 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_s8ga7gzevg2y-4 > li:before {
		content: '-  ';
	}
	.lst-kix_38zswjdicgwh-1 > li:before {
		content: '\0025cb   ';
	}
	.lst-kix_s8ga7gzevg2y-2 > li:before {
		content: '-  ';
	}
	.lst-kix_38zswjdicgwh-2 > li:before {
		content: '\0025a0   ';
	}
	.lst-kix_s8ga7gzevg2y-3 > li:before {
		content: '-  ';
	}
	ol.lst-kix_9e4jxz58ijhi-7.start {
		counter-reset: lst-ctn-kix_9e4jxz58ijhi-7 0;
	}
	.lst-kix_s8ga7gzevg2y-8 > li:before {
		content: '-  ';
	}
	.lst-kix_38zswjdicgwh-0 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_s8ga7gzevg2y-5 > li:before {
		content: '-  ';
	}
	ol.lst-kix_k39ns5nc81d5-6.start {
		counter-reset: lst-ctn-kix_k39ns5nc81d5-6 0;
	}
	.lst-kix_9e4jxz58ijhi-1 > li {
		counter-increment: lst-ctn-kix_9e4jxz58ijhi-1;
	}
	ul.lst-kix_38zswjdicgwh-8 {
		list-style-type: none;
	}
	.lst-kix_s8ga7gzevg2y-6 > li:before {
		content: '-  ';
	}
	.lst-kix_l4163ogvpnex-7 > li {
		counter-increment: lst-ctn-kix_l4163ogvpnex-7;
	}
	ul.lst-kix_38zswjdicgwh-6 {
		list-style-type: none;
	}
	.lst-kix_s8ga7gzevg2y-7 > li:before {
		content: '-  ';
	}
	ul.lst-kix_38zswjdicgwh-7 {
		list-style-type: none;
	}
	.lst-kix_dyfx29dgxuhb-6 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_xbgds6zcul8s-8 > li:before {
		content: '\0025a0   ';
	}
	.lst-kix_1kqqzx8lmu5v-0 > li:before {
		content: '-  ';
	}
	.lst-kix_dyfx29dgxuhb-4 > li:before {
		content: '\0025cb   ';
	}
	.lst-kix_dyfx29dgxuhb-8 > li:before {
		content: '\0025a0   ';
	}
	.lst-kix_xbgds6zcul8s-7 > li:before {
		content: '\0025cb   ';
	}
	.lst-kix_dyfx29dgxuhb-5 > li:before {
		content: '\0025a0   ';
	}
	ul.lst-kix_kpbry39snu81-7 {
		list-style-type: none;
	}
	.lst-kix_dyfx29dgxuhb-2 > li:before {
		content: '\0025a0   ';
	}
	ul.lst-kix_kpbry39snu81-6 {
		list-style-type: none;
	}
	.lst-kix_xbgds6zcul8s-4 > li:before {
		content: '\0025cb   ';
	}
	.lst-kix_xbgds6zcul8s-5 > li:before {
		content: '\0025a0   ';
	}
	ul.lst-kix_kpbry39snu81-5 {
		list-style-type: none;
	}
	.lst-kix_1kqqzx8lmu5v-2 > li:before {
		content: '-  ';
	}
	ul.lst-kix_kpbry39snu81-4 {
		list-style-type: none;
	}
	ul.lst-kix_kpbry39snu81-3 {
		list-style-type: none;
	}
	.lst-kix_1kqqzx8lmu5v-1 > li:before {
		content: '-  ';
	}
	ul.lst-kix_kpbry39snu81-2 {
		list-style-type: none;
	}
	.lst-kix_xbgds6zcul8s-6 > li:before {
		content: '\0025cf   ';
	}
	ul.lst-kix_kpbry39snu81-1 {
		list-style-type: none;
	}
	.lst-kix_dyfx29dgxuhb-3 > li:before {
		content: '\0025cf   ';
	}
	ul.lst-kix_kpbry39snu81-0 {
		list-style-type: none;
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
	.lst-kix_1kqqzx8lmu5v-6 > li:before {
		content: '-  ';
	}
	.lst-kix_1kqqzx8lmu5v-8 > li:before {
		content: '-  ';
	}
	ol.lst-kix_9e4jxz58ijhi-4 {
		list-style-type: none;
	}
	.lst-kix_dyfx29dgxuhb-0 > li:before {
		content: '\0025cf   ';
	}
	ol.lst-kix_9e4jxz58ijhi-5 {
		list-style-type: none;
	}
	ol.lst-kix_k39ns5nc81d5-5.start {
		counter-reset: lst-ctn-kix_k39ns5nc81d5-5 0;
	}
	.lst-kix_i9pmjo5plrvi-6 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_xbgds6zcul8s-3 > li:before {
		content: '\0025cf   ';
	}
	ol.lst-kix_9e4jxz58ijhi-2 {
		list-style-type: none;
	}
	.lst-kix_dyfx29dgxuhb-1 > li:before {
		content: '\0025cb   ';
	}
	ol.lst-kix_9e4jxz58ijhi-3 {
		list-style-type: none;
	}
	ul.lst-kix_kpbry39snu81-8 {
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
	.lst-kix_1kqqzx8lmu5v-5 > li:before {
		content: '-  ';
	}
	.lst-kix_i9pmjo5plrvi-5 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_xbgds6zcul8s-2 > li:before {
		content: '\0025a0   ';
	}
	ul.lst-kix_nznj7f2h3dvk-1 {
		list-style-type: none;
	}
	ul.lst-kix_nznj7f2h3dvk-0 {
		list-style-type: none;
	}
	.lst-kix_i9pmjo5plrvi-0 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_l4163ogvpnex-5 > li {
		counter-increment: lst-ctn-kix_l4163ogvpnex-5;
	}
	ul.lst-kix_nznj7f2h3dvk-5 {
		list-style-type: none;
	}
	ul.lst-kix_nznj7f2h3dvk-4 {
		list-style-type: none;
	}
	.lst-kix_i9pmjo5plrvi-2 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_l4163ogvpnex-2 > li {
		counter-increment: lst-ctn-kix_l4163ogvpnex-2;
	}
	ul.lst-kix_nznj7f2h3dvk-3 {
		list-style-type: none;
	}
	ul.lst-kix_nznj7f2h3dvk-2 {
		list-style-type: none;
	}
	ul.lst-kix_dyfx29dgxuhb-0 {
		list-style-type: none;
	}
	ul.lst-kix_dyfx29dgxuhb-1 {
		list-style-type: none;
	}
	ul.lst-kix_nznj7f2h3dvk-8 {
		list-style-type: none;
	}
	ul.lst-kix_dyfx29dgxuhb-2 {
		list-style-type: none;
	}
	ul.lst-kix_nznj7f2h3dvk-7 {
		list-style-type: none;
	}
	ul.lst-kix_dyfx29dgxuhb-3 {
		list-style-type: none;
	}
	ul.lst-kix_nznj7f2h3dvk-6 {
		list-style-type: none;
	}
	ul.lst-kix_dyfx29dgxuhb-4 {
		list-style-type: none;
	}
	ul.lst-kix_dyfx29dgxuhb-5 {
		list-style-type: none;
	}
	ol.lst-kix_5n9jywy0rmvt-1.start {
		counter-reset: lst-ctn-kix_5n9jywy0rmvt-1 0;
	}
	.lst-kix_9e4jxz58ijhi-5 > li {
		counter-increment: lst-ctn-kix_9e4jxz58ijhi-5;
	}
	.lst-kix_9e4jxz58ijhi-8 > li {
		counter-increment: lst-ctn-kix_9e4jxz58ijhi-8;
	}
	ul.lst-kix_dyfx29dgxuhb-6 {
		list-style-type: none;
	}
	.lst-kix_i9pmjo5plrvi-1 > li:before {
		content: '\0025cf   ';
	}
	ul.lst-kix_dyfx29dgxuhb-7 {
		list-style-type: none;
	}
	ul.lst-kix_dyfx29dgxuhb-8 {
		list-style-type: none;
	}
	.lst-kix_5n9jywy0rmvt-1 > li {
		counter-increment: lst-ctn-kix_5n9jywy0rmvt-1;
	}
	.lst-kix_k39ns5nc81d5-5 > li {
		counter-increment: lst-ctn-kix_k39ns5nc81d5-5;
	}
	.lst-kix_dyfx29dgxuhb-7 > li:before {
		content: '\0025cb   ';
	}
	.lst-kix_5n9jywy0rmvt-6 > li {
		counter-increment: lst-ctn-kix_5n9jywy0rmvt-6;
	}
	.lst-kix_kpbry39snu81-0 > li:before {
		content: '\0025cf   ';
	}
	ol.lst-kix_k39ns5nc81d5-4.start {
		counter-reset: lst-ctn-kix_k39ns5nc81d5-4 0;
	}
	ol.lst-kix_5n9jywy0rmvt-4.start {
		counter-reset: lst-ctn-kix_5n9jywy0rmvt-4 0;
	}
	ul.lst-kix_eymv275zzudt-7 {
		list-style-type: none;
	}
	.lst-kix_kpbry39snu81-8 > li:before {
		content: '\0025a0   ';
	}
	ul.lst-kix_eymv275zzudt-8 {
		list-style-type: none;
	}
	.lst-kix_5n9jywy0rmvt-7 > li {
		counter-increment: lst-ctn-kix_5n9jywy0rmvt-7;
	}
	.lst-kix_4mdn3jwye9e0-8 > li:before {
		content: '\0025a0   ';
	}
	ul.lst-kix_eymv275zzudt-5 {
		list-style-type: none;
	}
	ul.lst-kix_eymv275zzudt-6 {
		list-style-type: none;
	}
	ul.lst-kix_eymv275zzudt-3 {
		list-style-type: none;
	}
	ol.lst-kix_9e4jxz58ijhi-6.start {
		counter-reset: lst-ctn-kix_9e4jxz58ijhi-6 0;
	}
	ul.lst-kix_eymv275zzudt-4 {
		list-style-type: none;
	}
	ul.lst-kix_eymv275zzudt-1 {
		list-style-type: none;
	}
	ol.lst-kix_5n9jywy0rmvt-7.start {
		counter-reset: lst-ctn-kix_5n9jywy0rmvt-7 0;
	}
	ul.lst-kix_eymv275zzudt-2 {
		list-style-type: none;
	}
	ul.lst-kix_eymv275zzudt-0 {
		list-style-type: none;
	}
	.lst-kix_k39ns5nc81d5-7 > li {
		counter-increment: lst-ctn-kix_k39ns5nc81d5-7;
	}
	ol.lst-kix_l4163ogvpnex-1.start {
		counter-reset: lst-ctn-kix_l4163ogvpnex-1 0;
	}
	.lst-kix_kpbry39snu81-6 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_nznj7f2h3dvk-0 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_kpbry39snu81-4 > li:before {
		content: '\0025cb   ';
	}
	.lst-kix_l4163ogvpnex-1 > li {
		counter-increment: lst-ctn-kix_l4163ogvpnex-1;
	}
	.lst-kix_9e4jxz58ijhi-4 > li {
		counter-increment: lst-ctn-kix_9e4jxz58ijhi-4;
	}
	.lst-kix_nznj7f2h3dvk-2 > li:before {
		content: '\0025a0   ';
	}
	.lst-kix_kpbry39snu81-2 > li:before {
		content: '\0025a0   ';
	}
	.lst-kix_5n9jywy0rmvt-5 > li {
		counter-increment: lst-ctn-kix_5n9jywy0rmvt-5;
	}
	.lst-kix_nznj7f2h3dvk-4 > li:before {
		content: '\0025cb   ';
	}
	.lst-kix_nznj7f2h3dvk-8 > li:before {
		content: '\0025a0   ';
	}
	ol.lst-kix_5n9jywy0rmvt-5.start {
		counter-reset: lst-ctn-kix_5n9jywy0rmvt-5 0;
	}
	ol.lst-kix_9e4jxz58ijhi-8.start {
		counter-reset: lst-ctn-kix_9e4jxz58ijhi-8 0;
	}
	.lst-kix_nznj7f2h3dvk-6 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_9e4jxz58ijhi-3 > li {
		counter-increment: lst-ctn-kix_9e4jxz58ijhi-3;
	}
	.lst-kix_eymv275zzudt-1 > li:before {
		content: '\0025cb   ';
	}
	.lst-kix_k39ns5nc81d5-6 > li {
		counter-increment: lst-ctn-kix_k39ns5nc81d5-6;
	}
	.lst-kix_l4163ogvpnex-6 > li {
		counter-increment: lst-ctn-kix_l4163ogvpnex-6;
	}
	ol.lst-kix_k39ns5nc81d5-0 {
		list-style-type: none;
	}
	.lst-kix_eymv275zzudt-3 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_k39ns5nc81d5-0 > li {
		counter-increment: lst-ctn-kix_k39ns5nc81d5-0;
	}
	ol.lst-kix_k39ns5nc81d5-2 {
		list-style-type: none;
	}
	ol.lst-kix_k39ns5nc81d5-1 {
		list-style-type: none;
	}
	ol.lst-kix_l4163ogvpnex-0.start {
		counter-reset: lst-ctn-kix_l4163ogvpnex-0 0;
	}
	ol.lst-kix_k39ns5nc81d5-4 {
		list-style-type: none;
	}
	ol.lst-kix_k39ns5nc81d5-3 {
		list-style-type: none;
	}
	ol.lst-kix_k39ns5nc81d5-6 {
		list-style-type: none;
	}
	ol.lst-kix_k39ns5nc81d5-5 {
		list-style-type: none;
	}
	ol.lst-kix_k39ns5nc81d5-8 {
		list-style-type: none;
	}
	ol.lst-kix_k39ns5nc81d5-2.start {
		counter-reset: lst-ctn-kix_k39ns5nc81d5-2 0;
	}
	ol.lst-kix_k39ns5nc81d5-7 {
		list-style-type: none;
	}
	.lst-kix_38zswjdicgwh-7 > li:before {
		content: '\0025cb   ';
	}
	.lst-kix_eymv275zzudt-7 > li:before {
		content: '\0025cb   ';
	}
	ol.lst-kix_k39ns5nc81d5-1.start {
		counter-reset: lst-ctn-kix_k39ns5nc81d5-1 0;
	}
	.lst-kix_eymv275zzudt-5 > li:before {
		content: '\0025a0   ';
	}
	.lst-kix_4mdn3jwye9e0-0 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_4mdn3jwye9e0-6 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_l4163ogvpnex-0 > li {
		counter-increment: lst-ctn-kix_l4163ogvpnex-0;
	}
	.lst-kix_4mdn3jwye9e0-4 > li:before {
		content: '\0025cb   ';
	}
	.lst-kix_4mdn3jwye9e0-2 > li:before {
		content: '\0025a0   ';
	}
	ul.lst-kix_1kqqzx8lmu5v-2 {
		list-style-type: none;
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
	.lst-kix_k39ns5nc81d5-1 > li:before {
		content: '' counter(lst-ctn-kix_k39ns5nc81d5-1, lower-latin) '. ';
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
	.lst-kix_k39ns5nc81d5-0 > li:before {
		content: '' counter(lst-ctn-kix_k39ns5nc81d5-0, decimal) '. ';
	}
	ul.lst-kix_i9pmjo5plrvi-1 {
		list-style-type: none;
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
	.lst-kix_k39ns5nc81d5-4 > li {
		counter-increment: lst-ctn-kix_k39ns5nc81d5-4;
	}
	ol.lst-kix_9e4jxz58ijhi-4.start {
		counter-reset: lst-ctn-kix_9e4jxz58ijhi-4 0;
	}
	.lst-kix_k39ns5nc81d5-7 > li:before {
		content: '' counter(lst-ctn-kix_k39ns5nc81d5-7, lower-latin) '. ';
	}
	.lst-kix_k39ns5nc81d5-8 > li:before {
		content: '' counter(lst-ctn-kix_k39ns5nc81d5-8, lower-roman) '. ';
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
	.lst-kix_k39ns5nc81d5-2 > li:before {
		content: '' counter(lst-ctn-kix_k39ns5nc81d5-2, lower-roman) '. ';
	}
	.lst-kix_k39ns5nc81d5-3 > li:before {
		content: '' counter(lst-ctn-kix_k39ns5nc81d5-3, decimal) '. ';
	}
	.lst-kix_k39ns5nc81d5-4 > li:before {
		content: '' counter(lst-ctn-kix_k39ns5nc81d5-4, lower-latin) '. ';
	}
	ol.lst-kix_k39ns5nc81d5-3.start {
		counter-reset: lst-ctn-kix_k39ns5nc81d5-3 0;
	}
	.lst-kix_k39ns5nc81d5-5 > li:before {
		content: '' counter(lst-ctn-kix_k39ns5nc81d5-5, lower-roman) '. ';
	}
	.lst-kix_k39ns5nc81d5-6 > li:before {
		content: '' counter(lst-ctn-kix_k39ns5nc81d5-6, decimal) '. ';
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
	ol.lst-kix_5n9jywy0rmvt-6 {
		list-style-type: none;
	}
	ol.lst-kix_5n9jywy0rmvt-5 {
		list-style-type: none;
	}
	ol.lst-kix_5n9jywy0rmvt-0 {
		list-style-type: none;
	}
	ol.lst-kix_5n9jywy0rmvt-2 {
		list-style-type: none;
	}
	ol.lst-kix_5n9jywy0rmvt-1 {
		list-style-type: none;
	}
	ol.lst-kix_5n9jywy0rmvt-8 {
		list-style-type: none;
	}
	ol.lst-kix_5n9jywy0rmvt-7 {
		list-style-type: none;
	}
	ul.lst-kix_s8ga7gzevg2y-0 {
		list-style-type: none;
	}
	.lst-kix_5n9jywy0rmvt-4 > li {
		counter-increment: lst-ctn-kix_5n9jywy0rmvt-4;
	}
	ul.lst-kix_s8ga7gzevg2y-2 {
		list-style-type: none;
	}
	ul.lst-kix_s8ga7gzevg2y-1 {
		list-style-type: none;
	}
	ul.lst-kix_s8ga7gzevg2y-4 {
		list-style-type: none;
	}
	ul.lst-kix_s8ga7gzevg2y-3 {
		list-style-type: none;
	}
	ol.lst-kix_5n9jywy0rmvt-2.start {
		counter-reset: lst-ctn-kix_5n9jywy0rmvt-2 0;
	}
	ul.lst-kix_s8ga7gzevg2y-6 {
		list-style-type: none;
	}
	ul.lst-kix_s8ga7gzevg2y-5 {
		list-style-type: none;
	}
	ul.lst-kix_s8ga7gzevg2y-8 {
		list-style-type: none;
	}
	ul.lst-kix_s8ga7gzevg2y-7 {
		list-style-type: none;
	}
	ol.lst-kix_l4163ogvpnex-3.start {
		counter-reset: lst-ctn-kix_l4163ogvpnex-3 0;
	}
	.lst-kix_9e4jxz58ijhi-6 > li:before {
		content: '' counter(lst-ctn-kix_9e4jxz58ijhi-6, decimal) '. ';
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
	ul.lst-kix_xbgds6zcul8s-5 {
		list-style-type: none;
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
	.lst-kix_9e4jxz58ijhi-2 > li:before {
		content: '' counter(lst-ctn-kix_9e4jxz58ijhi-2, lower-roman) '. ';
	}
	ul.lst-kix_xbgds6zcul8s-0 {
		list-style-type: none;
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
	.lst-kix_k39ns5nc81d5-2 > li {
		counter-increment: lst-ctn-kix_k39ns5nc81d5-2;
	}
	.lst-kix_k39ns5nc81d5-8 > li {
		counter-increment: lst-ctn-kix_k39ns5nc81d5-8;
	}
	ol.lst-kix_9e4jxz58ijhi-5.start {
		counter-reset: lst-ctn-kix_9e4jxz58ijhi-5 0;
	}
	ol.lst-kix_5n9jywy0rmvt-8.start {
		counter-reset: lst-ctn-kix_5n9jywy0rmvt-8 0;
	}
	ol.lst-kix_k39ns5nc81d5-7.start {
		counter-reset: lst-ctn-kix_k39ns5nc81d5-7 0;
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
	.lst-kix_kpbry39snu81-7 > li:before {
		content: '\0025cb   ';
	}
	.lst-kix_4mdn3jwye9e0-7 > li:before {
		content: '\0025cb   ';
	}
	ol.lst-kix_l4163ogvpnex-4.start {
		counter-reset: lst-ctn-kix_l4163ogvpnex-4 0;
	}
	.lst-kix_kpbry39snu81-5 > li:before {
		content: '\0025a0   ';
	}
	ol.lst-kix_9e4jxz58ijhi-0.start {
		counter-reset: lst-ctn-kix_9e4jxz58ijhi-0 0;
	}
	.lst-kix_nznj7f2h3dvk-3 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_9e4jxz58ijhi-7 > li {
		counter-increment: lst-ctn-kix_9e4jxz58ijhi-7;
	}
	.lst-kix_l4163ogvpnex-4 > li {
		counter-increment: lst-ctn-kix_l4163ogvpnex-4;
	}
	.lst-kix_kpbry39snu81-1 > li:before {
		content: '\0025cb   ';
	}
	.lst-kix_kpbry39snu81-3 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_5n9jywy0rmvt-8 > li {
		counter-increment: lst-ctn-kix_5n9jywy0rmvt-8;
	}
	.lst-kix_nznj7f2h3dvk-1 > li:before {
		content: '\0025cb   ';
	}
	.lst-kix_nznj7f2h3dvk-7 > li:before {
		content: '\0025cb   ';
	}
	.lst-kix_5n9jywy0rmvt-3 > li {
		counter-increment: lst-ctn-kix_5n9jywy0rmvt-3;
	}
	ol.lst-kix_l4163ogvpnex-7.start {
		counter-reset: lst-ctn-kix_l4163ogvpnex-7 0;
	}
	.lst-kix_nznj7f2h3dvk-5 > li:before {
		content: '\0025a0   ';
	}
	.lst-kix_eymv275zzudt-0 > li:before {
		content: '\0025cf   ';
	}
	.lst-kix_eymv275zzudt-2 > li:before {
		content: '\0025a0   ';
	}
	ol.lst-kix_9e4jxz58ijhi-1.start {
		counter-reset: lst-ctn-kix_9e4jxz58ijhi-1 0;
	}
	.lst-kix_4mdn3jwye9e0-1 > li:before {
		content: '\0025cb   ';
	}
	.lst-kix_38zswjdicgwh-8 > li:before {
		content: '\0025a0   ';
	}
	.lst-kix_eymv275zzudt-4 > li:before {
		content: '\0025cb   ';
	}
	.lst-kix_eymv275zzudt-8 > li:before {
		content: '\0025a0   ';
	}
	ol.lst-kix_l4163ogvpnex-6.start {
		counter-reset: lst-ctn-kix_l4163ogvpnex-6 0;
	}
	ol.lst-kix_k39ns5nc81d5-8.start {
		counter-reset: lst-ctn-kix_k39ns5nc81d5-8 0;
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
	.lst-kix_eymv275zzudt-6 > li:before {
		content: '\0025cf   ';
	}
	ol.lst-kix_9e4jxz58ijhi-2.start {
		counter-reset: lst-ctn-kix_9e4jxz58ijhi-2 0;
	}
	.lst-kix_4mdn3jwye9e0-3 > li:before {
		content: '\0025cf   ';
	}
	ol {
		margin: 0;
		padding: 0;
	}
	table td,
	table th {
		padding: 0;
	}
	.c18 {
		-webkit-text-decoration-skip: none;
		color: #ebebeb;
		font-weight: 400;
		text-decoration: underline;
		vertical-align: baseline;
		text-decoration-skip-ink: none;
		font-size: 11pt;
		font-family: 'Arial';
		font-style: italic;
	}
	.c16 {
		color: #ebebeb;
		font-weight: 400;
		text-decoration: none;
		vertical-align: baseline;
		font-size: 22pt;
		font-family: 'Arial';
		font-style: normal;
	}
	.c0 {
		color: #ebebeb;
		font-weight: 400;
		text-decoration: none;
		vertical-align: baseline;
		font-size: 11pt;
		font-family: 'Arial';
		font-style: normal;
	}
	.c20 {
		color: #666666;
		font-weight: 400;
		text-decoration: none;
		vertical-align: baseline;
		font-size: 9pt;
		font-family: 'Arial';
		font-style: italic;
	}
	.c13 {
		color: #ebebeb;
		font-weight: 400;
		text-decoration: none;
		vertical-align: baseline;
		font-size: 10pt;
		font-family: 'Arial';
		font-style: normal;
	}
	.c12 {
		color: #ebebeb;
		font-weight: 400;
		text-decoration: none;
		vertical-align: baseline;
		font-size: 20pt;
		font-family: 'Arial';
		font-style: normal;
	}
	.c10 {
		color: #ebebeb;
		font-weight: 400;
		text-decoration: none;
		vertical-align: baseline;
		font-size: 15pt;
		font-family: 'Arial';
		font-style: normal;
	}
	.c14 {
		color: #666666;
		font-weight: 400;
		text-decoration: none;
		vertical-align: baseline;
		font-size: 10pt;
		font-family: 'Arial';
		font-style: normal;
	}
	.c2 {
		padding-top: 0pt;
		padding-bottom: 0pt;
		line-height: 1.15;
		orphans: 2;
		widows: 2;
		text-align: center;
	}
	.c15 {
		padding-top: 0pt;
		padding-bottom: 10pt;
		line-height: 1.15;
		orphans: 2;
		widows: 2;
		text-align: left;
	}
	.c8 {
		color: #ebebeb;
		text-decoration: none;
		vertical-align: baseline;
		font-size: 11pt;
		font-family: 'Arial';
		font-style: normal;
	}
	.c1 {
		padding-top: 0pt;
		padding-bottom: 0pt;
		line-height: 1.15;
		orphans: 2;
		widows: 2;
		text-align: left;
	}
	.c11 {
		text-decoration-skip-ink: none;
		-webkit-text-decoration-skip: none;
		color: #1155cc;
		text-decoration: underline;
	}
	.c19 {
		background-color: #ffffff;
		max-width: 468pt;
		padding: 72pt 72pt 72pt 72pt;
	}
	.c6 {
		margin-left: 36pt;
		padding-left: 0pt;
	}
	.c7 {
		color: inherit;
		text-decoration: inherit;
	}
	.c9 {
		padding: 0;
		margin: 0;
	}
	.c5 {
		margin-left: 72pt;
		padding-left: 0pt;
	}
	.c4 {
		font-weight: 700;
	}
	.c17 {
		font-size: 22pt;
	}
	.c3 {
		height: 11pt;
	}
	.title {
		padding-top: 0pt;
		color: #ebebeb;
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
		color: #ebebeb;
		font-size: 11pt;
		font-family: 'Arial';
	}
	p {
		margin: 0;
		color: #ebebeb;
		font-size: 11pt;
		font-family: 'Arial';
	}
	h1 {
		padding-top: 20pt;
		color: #ebebeb;
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
		color: #ebebeb;
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
