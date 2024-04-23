<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import Problem from './nodes/Problem.svelte';
	import Strategy from './nodes/Strategy.svelte';
	import Left from '$lib/icons/Left.svelte';
	import Right from '$lib/icons/Right.svelte';
	import Curve from '$lib/components/Curve.svelte';
	import { tick } from 'svelte';
	import type { TreeInterface } from '$lib/types/nodes';
	import type { Writable } from 'svelte/store';
	import type { PageData } from './$types';

	const tree: TreeInterface = getContext('tree');
	const viewingNodeRect: { l: number; t: number; w: number; h: number } =
		getContext('viewingNodeRect');
	const navNodeRect: { l: number; t: number; w: number; h: number } = getContext('navNodeRect');
	const stratChange: { l: number; t: number; pl: number; pt: number } = getContext('stratChange');
	const nodeHeight: any = getContext('nodeHeightStore');
	const canvasAction: Writable<string | null> = getContext('canvasActionStore');
	const treeAction: Writable<string | null> = getContext('treeActionStore');
	const data: PageData = getContext('data');
	const viewingNode: Writable<any> = getContext('viewingNodeStore');
	const quillsReady: Writable<boolean> = getContext('quillsReadyStore');
	const newStrategyTitleModal: Writable<{
		visible: boolean;
		title: string;
	}> = getContext('newStrategyTitleModalStore');
	const failurePopUp: Writable<any> = getContext('failurePopUpStore');
	const nodeIdToRemove: Writable<string | undefined> = getContext('nodeIdToRemoveStore');
	const successPopUp: Writable<any> = getContext('successPopUpStore');
	const redoTree: Writable<boolean> = getContext('redoTreeStore');
	const processing: Writable<boolean> = getContext('processingStore');

	let newProbTitle: string;
	let viewingNodeDiv: HTMLDivElement | undefined;
	let treeContainer: {
		width: number;
		height: number;
	};
	let treeActionUnsubscribe: any;
	let viewingNodeUnsubscribe: any;
	let quillsReadyUnsubscribe: any;
	let problems: {
		id: string;
		data: { title: string; tldr?: Object };
		div?: HTMLDivElement;
		top: number;
		left: number;
		parent: any;
		last: boolean;
		owners: Array<string>;
	}[] = [];
	let strategies: {
		id: string;
		data: { title: string; tldr?: Object };
		div?: HTMLDivElement;
		top: number;
		left: number;
		probs: any[];
		owners: Array<string>;
	}[] = [];
	let openTree = false;
	let extraShown = true;
	let titleSpacingReady = false;
	let moving = false;
	let lastNavigatedNode = 'r';
	let newStrategyProblemId = '';
	viewingNode.set(undefined);
	$quillsReady = false;
	$: if (openTree) {
		setTimeout(() => {
			$quillsReady = true;
		}, 100);
	}

	function findNodeInTreeArrays(id: string) {
		const t = tree.getNodeType(id);
		if (t === undefined) return t;
		if (t === 's') {
			return strategies.find((v) => v.id === id);
		} else {
			return problems.find((v) => v.id === id);
		}
	}

	onMount(() => {
		if (tree.getTree()?.problem !== undefined) {
			treeContainer = tree.calculateSpacing();
			updateTreeArrays();
			openTree = true;
		}
		viewingNodeUnsubscribe = viewingNode.subscribe((v) => {
			if (v) {
				viewingNodeDiv = findNodeInTreeArrays(v)?.div;
			} else if (v === false) {
				if ($redoTree) {
					problems = [];
					strategies = [];
					treeContainer = tree.calculateSpacing();
					updateTreeArrays();
					redoTree.set(false);
				}
				extraShown = true;
				setTimeout(() => {
					$quillsReady = true;
				}, 100);
			}
		});
		quillsReadyUnsubscribe = quillsReady.subscribe((v) => {
			if (v) {
				window.addEventListener('keydown', handleKeydown);
				setTimeout(() => {
					strategies.forEach((v) => {
						calculateTitleSpacing(v.probs);
					});
					titleSpacingReady = true;
				}, 40);
			} else {
				titleSpacingReady = false;
			}
		});
		treeActionUnsubscribe = treeAction.subscribe((action) => {
			if (action) {
				if (action === 'find-node-position') {
					window.removeEventListener('keydown', handleKeydown);
					const nRect = viewingNodeDiv?.getBoundingClientRect();
					if (nRect) {
						viewingNodeRect.l = nRect.left;
						viewingNodeRect.t = nRect.top;
						viewingNodeRect.w = nRect.width;
						viewingNodeRect.h = nRect.height;
						canvasAction.set('move-to-node');
					}
				} else if (action === 'calibrate-node-height') {
					const nRect = viewingNodeDiv?.getBoundingClientRect();
					if (nRect) $nodeHeight = nRect.height;
				} else if (action === 'fade-out-extra') {
					extraShown = false;
					$quillsReady = false;
				} else if (action === 'create-new-strategy') {
					createStrategyNode(newStrategyProblemId, $newStrategyTitleModal.title);
					setTimeout(() => {
						$quillsReady = true;
					}, 40);
					$newStrategyTitleModal.title = '';
				} else if (action === 'remove-node') {
					if (tree.getNodeType($nodeIdToRemove) === 's') {
						deleteStrategy($nodeIdToRemove as string);
					} else {
						deleteProblem($nodeIdToRemove as string);
					}
					nodeIdToRemove.set(undefined);
				}
				treeAction.set(null);
			}
		});

		return () => {
			if (treeActionUnsubscribe) treeActionUnsubscribe();
			if (quillsReadyUnsubscribe) quillsReadyUnsubscribe();
			if (viewingNodeUnsubscribe) viewingNodeUnsubscribe();
			window.removeEventListener('keydown', handleKeydown);
		};
	});

	function updateTreeArrays(
		obj: any = tree.getTree().problem,
		parent = { data: { title: '' }, id: '' }
	) {
		if (obj?.strategies !== undefined) {
			let last = false;
			if (obj.strategies.length !== 0) {
				updateTreeArrays(obj.strategies[obj.selectedStrategy]);
			} else last = true;
			problems.push({
				id: obj.id,
				data: obj.data,
				top: obj.top,
				left: obj.left,
				parent: parent,
				last: last,
				owners: obj.owners
			});
		} else {
			const probs: any[] = [];
			for (let i = 0; i < obj.problems.length; i++) {
				updateTreeArrays(obj.problems[i], { data: obj.data, id: obj.id });
				probs.push({
					id: obj.problems[i].id,
					data: obj.problems[i].data,
					pos: { top: obj.problems[i].top, left: obj.problems[i].left }
				});
			}
			strategies.push({
				id: obj.id,
				data: obj.data,
				top: obj.top,
				left: obj.left,
				probs: probs,
				owners: obj.owners
			});
		}
	}

	function createStrategyNode(probId: string, title: string) {
		quillsReady.set(false);
		problems = [];
		strategies = [];
		tree.createStrategy(probId, title, true, undefined, [data.props?.profile.username]);
		treeContainer = tree.calculateSpacing();
		updateTreeArrays();
		tick().then(() => quillsReady.set(true));
		publishStrategy(probId, title);
	}
	async function publishStrategy(probId: string, title: string): Promise<void> {
		try {
			const response = await fetch('/home/tree/actions/publish_strategy', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ probId, title, userId: data.session?.user.id })
			});

			const result: any = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
		} catch (error: any) {
			failurePopUp.set('Error: ' + error.message);
			setTimeout(() => {
				location.reload();
			}, 500);
		}
	}
	async function deleteProblem(id: string): Promise<void> {
		$processing = true;
		try {
			const response = await fetch('/home/tree/actions/delete_problem', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ id, userId: data.session?.user.id })
			});

			const result: any = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
			quillsReady.set(false);
			problems = [];
			strategies = [];
			tree.setTree(result.data.tree, tree.getSelections());
			tick().then(() => {
				treeContainer = tree.calculateSpacing();
				updateTreeArrays();
				setTimeout(() => {
					quillsReady.set(true);
					successPopUp.set('Problem successfully deleted');
				}, 20);
			});
			successPopUp.set('Problem successfully deleted');
			$processing = false;
		} catch (error: any) {
			failurePopUp.set('Error: ' + error.message);
			$processing = false;
		}
	}
	async function deleteStrategy(id: string): Promise<void> {
		$processing = true;
		try {
			const response = await fetch('/home/tree/actions/delete_strategy', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ id, userId: data.session?.user.id })
			});

			const result: any = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
			quillsReady.set(false);
			problems = [];
			strategies = [];
			tree.setTree(result.data.tree, result.data.ss);
			tick().then(() => {
				treeContainer = tree.calculateSpacing();
				updateTreeArrays();
				setTimeout(() => {
					quillsReady.set(true);
					successPopUp.set('Strategy successfully deleted');
				}, 20);
			});
			$processing = false;
		} catch (error: any) {
			failurePopUp.set('Error: ' + error.message);
			$processing = false;
		}
	}

	function changeOpenStrategy(direction: boolean, id: string) {
		const nRect = findNodeInTreeArrays(id)?.div?.getBoundingClientRect();
		if (nRect) {
			stratChange.pl = nRect.left;
			stratChange.pt = nRect.top;
		}

		let problem = tree.getObjFromId(tree.getParent(id) as string);
		let nodeIndex = problem.strategies.findIndex((strat: any) => strat.id === id);
		if (direction) {
			if (nodeIndex > 0) {
				$quillsReady = false;
				problem.selectedStrategy = nodeIndex - 1;
				tree.updateSelected(tree.getParent(id), problem.selectedStrategy);
				problems = [];
				strategies = [];
				treeContainer = tree.calculateSpacing();
				updateTreeArrays();
				data.supabase
					.from('Profiles')
					.update({ selected_strategies: tree.getSelections() })
					.eq('user_id', data.session?.user.id)
					.then(({ error }) => {
						if (error) console.log(error);
					});
				tick().then(() => {
					const nRect = findNodeInTreeArrays(
						problem.strategies[problem.selectedStrategy].id
					)?.div?.getBoundingClientRect();

					if (nRect) {
						stratChange.l = nRect.left;
						stratChange.t = nRect.top;
					}
					canvasAction.set('adjust-for-strat-change');
					setTimeout(() => {
						$quillsReady = true;
					}, 40);
				});
			}
		} else if (nodeIndex < problem.strategies.length - 1) {
			$quillsReady = false;
			problem.selectedStrategy = nodeIndex + 1;
			tree.updateSelected(tree.getParent(id), problem.selectedStrategy);
			problems = [];
			strategies = [];
			treeContainer = tree.calculateSpacing();
			updateTreeArrays();
			data.supabase
				.from('Profiles')
				.update({ selected_strategies: tree.getSelections() })
				.eq('user_id', data.session?.user.id)
				.then(({ error }) => {
					if (error) console.log(error);
				});
			tick().then(() => {
				const nRect = findNodeInTreeArrays(
					problem.strategies[problem.selectedStrategy].id
				)?.div?.getBoundingClientRect();

				if (nRect) {
					stratChange.l = nRect.left;
					stratChange.t = nRect.top;
				}
				canvasAction.set('adjust-for-strat-change');
				setTimeout(() => {
					$quillsReady = true;
				}, 40);
			});
		}
	}

	function calculateTitleSpacing(probs: any[]) {
		const spacing = 800 / (probs.length + 1);
		for (let i = 0; i < probs.length; i++) {
			if (probs[i]?.div) probs[i].space = (i + 1) * spacing - probs[i].div.clientWidth / 2;
		}
	}
	function navigateToNode(id: string) {
		const nRect = findNodeInTreeArrays(id)?.div?.getBoundingClientRect();
		if (nRect) {
			lastNavigatedNode = id;
			navNodeRect.l = nRect.left;
			navNodeRect.t = nRect.top;
			navNodeRect.w = nRect.width;
			navNodeRect.h = nRect.height;
			canvasAction.set('nav-to-node');
		}
	}
	function handleKeydown(event: KeyboardEvent) {
		const k = event.key;
		if (k && !moving) {
			if (k === 'ArrowUp') {
				moving = true;
				let nId = tree.getParent(lastNavigatedNode);
				if (nId) navigateToNode(nId);
				setTimeout(() => (moving = false), 320);
			} else if (k === 'ArrowDown') {
				moving = true;
				const n = tree.getObjFromId(lastNavigatedNode);
				if (n) {
					const nt = tree.getNodeType(lastNavigatedNode);
					if (nt === 's') {
						if (n.problems.length !== 0) navigateToNode(n.problems[0].id);
					} else if (nt === 'p' || nt === 'r') {
						if (n.strategies.length !== 0) navigateToNode(n.strategies[n.selectedStrategy].id);
					}
				}
				setTimeout(() => (moving = false), 320);
			} else if (k === 'ArrowLeft') {
				moving = true;
				const nl = tree.getObjFromId(lastNavigatedNode);
				if (nl) {
					if (tree.getNodeType(lastNavigatedNode) === 'p') {
						const nlp = tree.getObjFromId(tree.getParent(lastNavigatedNode) as string);
						let i = nlp.problems.findIndex((prob: any) => prob.id === lastNavigatedNode) - 1;
						if (i >= 0) {
							navigateToNode(nlp.problems[i].id);
						}
					}
				}
				setTimeout(() => (moving = false), 320);
			} else if (k === 'ArrowRight') {
				moving = true;
				const nr = tree.getObjFromId(lastNavigatedNode);
				if (nr) {
					if (tree.getNodeType(lastNavigatedNode) === 'p') {
						const nrp = tree.getObjFromId(tree.getParent(lastNavigatedNode) as string);
						let i = nrp.problems.findIndex((prob: any) => prob.id === lastNavigatedNode) + 1;
						if (i < nrp.problems.length) {
							navigateToNode(nrp.problems[i].id);
						}
					}
				}
				setTimeout(() => (moving = false), 320);
			}
		}
	}
</script>

<div class="h-[20px]" />
{#if openTree}
	<div class="relative" style="height: {treeContainer.height}px; width: {treeContainer.width}px;">
		{#each problems as problem (problem.id)}
			{#if extraShown || problem.id === $viewingNode}
				<div
					role="presentation"
					bind:this={problem.div}
					class="absolute"
					style="left: {problem.left}px; top: {problem.top}px;"
				>
					{#if extraShown}
						<div class="absolute top-[-30px] flex w-[800px] justify-center">
							<button
								on:click={() => {
									navigateToNode(problem.parent.id);
								}}
								class="underline underline-offset-[-14px] text-[13px] text-[#9a9a9a] hover:text-[#ffffff]"
								>{problem.parent.data.title}
							</button>
						</div>
						<button
							on:click={() => {
								newStrategyProblemId = problem.id;
								$newStrategyTitleModal.visible = true;
							}}
							class="absolute left-[22px] bottom-[-25px] text-[#5f66a0] text-[12px] underline hover:text-[#8a93eb]"
							>New Strategy</button
						>
					{/if}
					<Problem treeData={problem}></Problem>
				</div>
				{#if $quillsReady && !problem.last}
					<Curve
						pointA={{
							x: problem.left + 400,
							y: problem.top + problem.div.clientHeight
						}}
						pointB={{
							x: problem.left + 400,
							y: problem.top + 560
						}}
						size={treeContainer}
					/>
				{/if}
			{/if}
		{/each}
		{#each strategies as strategy (strategy.id)}
			{#if extraShown || strategy.id === $viewingNode}
				<div
					class="flex items-center absolute"
					style="left: {strategy.left}px; top: {strategy.top}px;"
				>
					{#if extraShown}
						<button on:click={() => changeOpenStrategy(true, strategy.id)}>
							<Left color="#b1b1b1" size="40px" /></button
						>
					{:else}
						<div class="h-[40px] w-[40px]" />
					{/if}
					<div role="presentation" bind:this={strategy.div}>
						<Strategy treeData={tree.getObjFromId(strategy.id)}></Strategy>
						{#if $quillsReady}
							<div
								class="absolute flex w-[800px] justify-center"
								style="top: {strategy.div.clientHeight + 6}px;"
							>
								{#each strategy.probs as prob (prob.id)}
									<button
										bind:this={prob.div}
										on:click={() => {
											navigateToNode(prob.id);
										}}
										class="absolute underline underline-offset-[3px] text-[13px] text-[#9a9a9a] hover:text-[#ffffff]"
										style="left: {titleSpacingReady ? prob.space : '380'}px;"
										>{prob.data.title}
									</button>
								{/each}
							</div>
						{/if}
					</div>
					{#if extraShown}
						<button on:click={() => changeOpenStrategy(false, strategy.id)}>
							<Right color="#b1b1b1" size="40px" /></button
						>
					{:else}
						<div class="h-[40px] w-[40px]" />
					{/if}
				</div>
				{#if $quillsReady && titleSpacingReady}
					{#each strategy.probs as prob}
						<Curve
							pointA={{
								x: strategy.left + prob.space + prob.div.clientWidth / 2 + 40,
								y: strategy.top + strategy.div.clientHeight + 27
							}}
							pointB={{
								x: prob.pos.left + 400,
								y: prob.pos.top - 27
							}}
							size={treeContainer}
						/>
					{/each}
				{/if}
			{/if}
		{/each}
	</div>
{/if}
<div class="h-[20px]" />
