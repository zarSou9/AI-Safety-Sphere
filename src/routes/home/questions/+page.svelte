<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import Vote from '$lib/icons/Vote.svelte';
	import Cross from '$lib/icons/Cross.svelte';
	import { fly, slide, fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import Search from '$lib/icons/Search.svelte';
	import Arrow from '$lib/icons/FolderArrow.svelte';
	import Plus from '$lib/icons/Plus.svelte';
	import ToolTip from '$lib/components/ToolTip.svelte';

	export let data;

	let questions = data.props.questions;

	let mounted = false;
	let posting = false;
	let loginNotif = false;
	let loginNotifTime: any;
	let failurePopUp: any = false;
	let failurePopUpTime: any;
	let searchPlaceHolder = true;
	let searchInput = writable('');
	let tagInput = '';
	let tagPlaceHolder = true;
	let tagOpen = false;
	let tagOpenForCorners = false;
	let cornersTimeout: any;
	let arrow: HTMLButtonElement;
	let tags = [
		'General AI Safety',
		'Ethics',
		'Robustness',
		'Fairness',
		'Mech Interp',
		'Explainability',
		'Bias Mitigation',
		'Value Alignment',
		'Human-AI Interaction',
		'AI Governance',
		'Policy and Regulation',
		'Long-term Risks',
		'Short-term Risks',
		'Adversarial Attacks',
		'Safety Testing',
		'Risk Management',
		'Human Oversight',
		'Data Privacy',
		'System Resilience',
		'Multi-agent Systems',
		'Preventing Misuse',
		'Scalable Oversight',
		'Ethical Implications of AI',
		'AI Safety Metrics',
		'AI Safety Research',
		'Robotics',
		'AI Safety Education',
		'AI Safety Funding',
		'Tools for AI Safety',
		'Inner Alignment',
		'Outer Alignment',
		'Distrobutional Shift',
		'Negative Side Effects',
		'Reward Hacking'
	];

	let intervalI = 0;

	const profDropdown: Writable<boolean> = getContext('profDropdownStore');
	function getVote(votes: any) {
		return votes.find((v: any) => v.user === data.props.profile?.username)?.vote;
	}
	function activateLoginNotif() {
		failurePopUp = false;
		loginNotif = true;
		clearTimeout(loginNotifTime);
		loginNotifTime = setTimeout(() => (loginNotif = false), 5000);
	}
	function activateFaliurePopUp(message: string) {
		failurePopUp = message;
		loginNotif = false;
		clearTimeout(failurePopUpTime);
		failurePopUpTime = setTimeout(() => (failurePopUp = false), 5000);
	}
	async function handleVote(vote: number, id: string, question: any) {
		let userVote = question.votes.find((v: any) => v.user === data.props.profile?.username);
		if (userVote?.vote === vote) vote = 0;
		if (!userVote) {
			question.votes.push({ vote, user: data.props.profile?.username });
		} else {
			question.importance -= userVote.vote;
			userVote.vote = vote;
		}
		question.importance += vote;
		questions = [...questions];
		if (posting) {
			try {
				await waitForServer();
			} catch (error: any) {
				return;
			}
		}
		posting = true;
		try {
			const response = await fetch('/home/questions/actions/vote', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id,
					userId: data.session?.user.id,
					vote
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
		} catch (error: any) {
			activateFaliurePopUp('Error: ' + error.message);
		}
		posting = false;
	}
	function waitForServer() {
		intervalI += 1;
		const thisI = intervalI;
		return new Promise<void>((resolve, reject) => {
			const intervalId = setInterval(() => {
				if (thisI !== intervalI) {
					clearInterval(intervalId);
					reject(new Error('New Interval'));
				}
				if (!posting) {
					clearInterval(intervalId);
					resolve();
				}
			}, 20);
			setTimeout(() => {
				clearInterval(intervalId);
				reject(new Error('Condition not met within time limit'));
			}, 1000);
		});
	}
	function handleCorners() {
		tagOpenForCorners = false;
	}
	function handleTagClose() {
		arrow.style.transform = 'rotate(90deg)';
		tagOpen = false;
		if (!tagInput) tagPlaceHolder = true;
		cornersTimeout = setTimeout(handleCorners, 70);
		window.removeEventListener('click', handleTagClose);
	}
	function organizeQuestions(array: any): any {
		if (array.length < 2) {
			return array;
		}

		const pivot = array[array.length - 1];
		const left = [];
		const right = [];

		for (let i = 0; i < array.length - 1; i++) {
			if (array[i].importance >= pivot.importance) {
				left.push(array[i]);
			} else {
				right.push(array[i]);
			}
		}

		return [...organizeQuestions(left), pivot, ...organizeQuestions(right)];
	}

	questions = organizeQuestions(questions);
	let questionsShown = JSON.parse(JSON.stringify(questions));

	searchInput.subscribe((si) => {
		questionsShown = [];
		for (let q of questions) {
			if (q.question.toLowerCase().includes(si.toLowerCase())) {
				questionsShown.push(q);
			}
		}
	});
	onMount(() => (mounted = true));
</script>

{#if loginNotif}
	<div
		in:fly={{ duration: 300, x: 0, y: 200, opacity: 0.5, easing: quintOut }}
		class="z-[400] fixed left-0 bottom-[20px] w-[100vw] flex items-center justify-center"
	>
		<div class="flex bg-[#ffffff] py-[10px] rounded-[6px]" style="box-shadow: -4px 4px #be4141;">
			<p class="text-[#000000] mr-[20px] ml-[25px]">
				You must <a class="text-[#3476c2] hover:underline" href="/login">log in</a> to vote
			</p>
			<button class="mr-[15px]" on:click={() => (loginNotif = false)}
				><Cross color="#70747c" size="16px" /></button
			>
		</div>
	</div>
{/if}
{#if failurePopUp}
	<div
		in:fly={{ duration: 300, x: 0, y: 200, opacity: 0.5, easing: quintOut }}
		class="z-[400] fixed left-0 bottom-[20px] w-[100vw] flex items-center justify-center"
	>
		<div class="flex bg-[#ffffff] py-[10px] rounded-[6px]" style="box-shadow: -4px 4px #be4141;">
			<p class="text-[#000000] mr-[20px] ml-[25px]">{failurePopUp}</p>
			<button class="mr-[15px]" on:click={() => (failurePopUp = false)}
				><Cross color="#70747c" size="16px" /></button
			>
		</div>
	</div>
{/if}

<div class="h-full w-full bg-[#151515] flex flex-col items-center relative">
	<a
		href="https://arxiv.org/abs/2404.09932"
		target="_blank"
		class="citation absolute top-[80px] right-[50px] text-[15px] text-[#565656] hover:text-[#8e8e8e]"
		>{'>'} Anwar et al. (2024)</a
	>
	<div
		class="relative flex items-center w-full h-[40px] bg-[#272727] border-b-[.3px] border-b-[#70747c] flex-shrink-0"
	>
		<div class="w-[.6px] h-[26px] bg-[#70747c] mr-[15px] ml-auto" />
		<button
			class="flex items-center mr-[12px] rounded-full size-[25px] flex-grow-0 flex-shrink-0 overflow-hidden"
			on:click={() => ($profDropdown = true)}
		>
			<img src="/images/profile_pic.png" alt="profile" />
		</button>
	</div>
	<div class="flex flex-col items-center flex-grow size-full overflow-auto">
		<h1 class="text-[40px] mt-[50px] text-[#e9e9e9] text-wrap title">Research Questions</h1>
		<div
			class="flex selection:bg-[#bacaffb0] mt-[35px] space-y-4 flex-col sm:flex-row sm:space-y-0 items-center"
		>
			<div class="relative">
				<div
					class="absolute top-0 bottom-0 left-[13px] pointer-events-none flex items-center justify-center"
				>
					<Search color="#000000" size="17px" />
				</div>
				{#if searchPlaceHolder}
					<div
						class="absolute left-[38px] top-0 bottom-0 flex items-center pointer-events-none justify-center text-[#6b6b6b] text-[13px] italic"
					>
						Search
					</div>
				{/if}
				<input
					on:focus={() => (searchPlaceHolder = false)}
					on:blur={() => {
						if (!$searchInput) searchPlaceHolder = true;
					}}
					bind:value={$searchInput}
					class="border-none outline-none w-[350px] bg-[#e9e9e9] py-[6px] rounded-full text-[#000000] pl-[40px]"
				/>
			</div>
			<div class="flex items-center">
				<div
					role="presentation"
					on:click={(e) => e.stopPropagation()}
					class="relative ml-[20px] text-[#000000]"
				>
					<button
						bind:this={arrow}
						on:click={() => {
							if (tagOpen) {
								handleTagClose();
							} else {
								tagOpen = true;
								tagPlaceHolder = false;
								arrow.style.transform = 'rotate(-90deg)';
								tagOpenForCorners = true;
								clearTimeout(cornersTimeout);
								window.addEventListener('click', handleTagClose);
							}
						}}
						class="transition-transform duration-150 ease-out absolute top-0 bottom-0 left-[12px] flex items-center justify-center rotate-[90deg]"
					>
						<Arrow color="#000000" size="20px" />
					</button>
					{#if tagPlaceHolder}
						<div
							class="absolute left-[38px] top-0 bottom-0 flex items-center justify-center pointer-events-none text-[#6b6b6b] text-[13px] italic"
						>
							Tags
						</div>
					{/if}
					{#if tagOpen}
						<div
							transition:slide={{ duration: 150, easing: quintOut }}
							class="z-[4] absolute left-0 right-0 h-[200px] top-[100%] rounded-b-[20px] overflow-auto flex flex-col items-start py-[5px] bg-[#e9e9e9] border-t-[.3px] border-[#525252]"
						>
							{#each tags as tag}
								<button class="hover:bg-[#cbcbcb] w-full flex items-start pl-[20px] py-[1px]"
									>{tag}</button
								>
							{/each}
						</div>
					{/if}
					<input
						on:focus={() => {
							tagOpen = true;
							tagPlaceHolder = false;
							arrow.style.transform = 'rotate(-90deg)';
							tagOpenForCorners = true;
							clearTimeout(cornersTimeout);
							window.addEventListener('click', handleTagClose);
						}}
						bind:value={tagInput}
						class="border-none outline-none w-[200px] bg-[#e9e9e9] py-[6px] pl-[40px] {tagOpenForCorners
							? 'rounded-t-[18px]'
							: 'rounded-full'} "
					/>
				</div>
				<a
					class="ml-[20px] relative group"
					target="_blank"
					href="https://docs.google.com/forms/d/e/1FAIpQLSd6t6YCF2Mqpgl2-F1BblNMMD4LXz7uT3RUwXI-Ufk2PsiSQQ/viewform"
					><Plus color="#e9e9e9" size="33px" />
					<ToolTip tip="Add research question" />
				</a>
			</div>
		</div>
		<div class="flex flex-col mt-[55px] space-y-[30px]">
			{#each questionsShown as question (question.id)}
				<div
					class="rounded-[10px] mx-[70px] max-w-[800px] bg-[#232323] relative py-[13px] px-[16px] text-[#ebebeb]"
				>
					<div
						role="presentation"
						class="absolute left-[-30px] top-0 bottom-0 flex justify-center items-center"
					>
						<p class="mr-[3px] text-[12px] pointer-events-none absolute right-[25px]">
							{question.importance}
						</p>
						<div class="relative flex flex-col justify-center group">
							<ToolTip top={false} className="translate-y-[calc(100%-4px)]">
								{#if mounted}
									<p class="text-[12px] text-[#e7e7e7]">Importance</p>
									<p class="text-[10px] text-[#acacac] leading-[15px] my-[1px] w-[130px] text-wrap">
										Do you think this question is more or less important to AI Safety than it's
										currently ranked?
									</p>
								{/if}
							</ToolTip>
							<button
								on:click={() => {
									if (data.props.loggedIn) handleVote(1, question.id, question);
									else activateLoginNotif();
								}}
								class="rotate-90"
								><Vote size="25px" voted={getVote(question.votes)} up={true} /></button
							>
							<button
								on:click={() => {
									if (data.props.loggedIn) handleVote(-1, question.id, question);
									else activateLoginNotif();
								}}
								class="rotate-[-90deg]"
								><Vote voted={getVote(question.votes)} size="25px" up={false} /></button
							>
						</div>
					</div>
					<a class="group" href={question.google_doc} target="_blank"
						>{question.question}<ToolTip tip="Google Doc" /></a
					>
				</div>
			{/each}
			<div class="h-[.3px] bg-[#6b6b6b] w-full mx-auto my-[20px]" />
			<p class="text-wrap w-[70%] pb-[80px] mx-auto">
				The vast majority of the research questions posed on this page were directly taken from this
				paper - <br /> "<a
					target="_blank"
					href="https://arxiv.org/abs/2404.09932"
					class="link text-[#7cb6ea]"
					>Foundational Challenges in Assuring Alignment and Safety of Large Language Models</a
				>"
			</p>
		</div>
	</div>
</div>

<style>
	* {
		scrollbar-color: #888 #f1f1f1;
	}
	.citation {
		visibility: hidden;
	}
	@media (min-width: 1000px) {
		.citation {
			visibility: visible;
		}
	}
	@media (min-width: 500px) {
		.title {
			font-size: 50px;
		}
	}
</style>
