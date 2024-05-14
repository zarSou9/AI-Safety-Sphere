<script lang="ts">
	import { getContext, onMount, tick } from 'svelte';
	import Problem from './nodes/Problem.svelte';
	import Strategy from './nodes/Strategy.svelte';
	import Left from '$lib/icons/Left.svelte';
	import Right from '$lib/icons/Right.svelte';
	import Curve from '$lib/components/Curve.svelte';
	import type { TreeInterface } from '$lib/types/nodes';
	import type { Writable } from 'svelte/store';
	import type { PageData } from './$types';
	import { slide } from 'svelte/transition';
	import FolderArrow from '$lib/icons/FolderArrow.svelte';

	import { quintOut } from 'svelte/easing';

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
	const nodeToRemove: Writable<any> = getContext('nodeToRemoveStore');
	const successPopUp: Writable<any> = getContext('successPopUpStore');
	const redoTree: Writable<boolean> = getContext('redoTreeStore');
	const processing: Writable<boolean> = getContext('processingStore');
	const loginNotif: Writable<any> = getContext('loginNotifStore');

	let newProbTitle: string;
	let sectionsOpen: any;
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
		uuid: string;
		data: { title: string; tldr?: Object };
		div?: HTMLDivElement;
		top: number;
		left: number;
		parent: any;
		last: boolean;
		owners: Array<string>;
		referenced?: string;
	}[] = [];
	let strategies: {
		id: string;
		uuid: string;
		data: { title: string; tldr?: Object };
		div?: HTMLDivElement;
		top: number;
		left: number;
		probs: any[];
		owners: Array<string>;
		arrow: any;
		referenced?: string;
	}[] = [];
	let openTree = false;
	let extraShown = true;
	let titleSpacingReady = false;
	let moving = false;
	let lastNavigatedNode = 'r';
	let newStrategyProblem: any;
	let sectionFunction: any;

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
					publishStrategy(
						newStrategyProblem.id,
						newStrategyProblem.uuid,
						$newStrategyTitleModal.title
					);
					setTimeout(() => {
						$quillsReady = true;
					}, 40);
					$newStrategyTitleModal.title = '';
				} else if (action === 'remove-node') {
					if (tree.getNodeType($nodeToRemove.id) === 's') {
						deleteStrategy($nodeToRemove.id, $nodeToRemove.uuid);
					} else {
						deleteProblem($nodeToRemove.id, $nodeToRemove.uuid);
					}
					nodeToRemove.set(undefined);
				} else if (action === 'remove-linked-node') {
					if ($nodeToRemove.uuid === true) {
						failurePopUp.set('Error: Cannot delete child of referenced node');
					} else {
						deleteLinkedProblem($nodeToRemove.uuid);
					}
					nodeToRemove.set(undefined);
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
		if (obj?.strategies) {
			if (obj?.referenced) {
				const refProb = tree.getObjFromId(undefined, obj.referenced);
				let last = false;
				if (obj.strategies.length !== 0) {
					updateTreeArrays(obj.strategies[obj.selectedStrategy]);
				} else last = true;
				let referenced: any;
				if (obj?.uuid) referenced = obj.uuid;
				else referenced = true;
				problems.push({
					id: obj.id,
					uuid: refProb.uuid,
					data: refProb.data,
					top: obj.top,
					left: obj.left,
					parent: parent,
					last: last,
					owners: refProb.owners,
					referenced
				});
			} else {
				let last = false;
				if (obj.strategies.length !== 0) {
					updateTreeArrays(obj.strategies[obj.selectedStrategy]);
				} else last = true;
				problems.push({
					id: obj.id,
					uuid: obj.uuid,
					data: obj.data,
					top: obj.top,
					left: obj.left,
					parent: parent,
					last: last,
					owners: obj.owners
				});
			}
		} else if (obj?.problems) {
			const probs: any[] = [];
			for (let i = 0; i < obj.problems.length; i++) {
				if (obj?.referenced) {
					if (obj.problems[i]?.referenced) {
						const refStrat = tree.getObjFromId(undefined, obj.referenced);
						const refProb = tree.getObjFromId(undefined, obj.problems[i].referenced);
						updateTreeArrays(obj.problems[i], { data: refStrat.data, id: obj.id });
						probs.push({
							id: obj.problems[i].id,
							data: refProb.data,
							pos: { top: obj.problems[i].top, left: obj.problems[i].left }
						});
					} else {
						const refStrat = tree.getObjFromId(undefined, obj.referenced);
						updateTreeArrays(obj.problems[i], { data: refStrat.data, id: obj.id });
						probs.push({
							id: obj.problems[i].id,
							data: refStrat.problems[i].data,
							pos: { top: obj.problems[i].top, left: obj.problems[i].left }
						});
					}
				} else {
					if (obj.problems[i]?.referenced) {
						const refProb = tree.getObjFromId(undefined, obj.problems[i].referenced);
						updateTreeArrays(obj.problems[i], { data: obj.data, id: obj.id });
						probs.push({
							id: obj.problems[i].id,
							data: refProb.data,
							pos: { top: obj.problems[i].top, left: obj.problems[i].left }
						});
					} else {
						updateTreeArrays(obj.problems[i], { data: obj.data, id: obj.id });
						probs.push({
							id: obj.problems[i].id,
							data: obj.problems[i].data,
							pos: { top: obj.problems[i].top, left: obj.problems[i].left }
						});
					}
				}
			}
			if (obj.referenced) {
				const refStrat = tree.getObjFromId(undefined, obj.referenced);
				let referenced: any;
				if (obj?.uuid) referenced = obj.uuid;
				else referenced = true;
				strategies.push({
					id: obj.id,
					uuid: refStrat.uuid,
					data: refStrat.data,
					top: obj.top,
					left: obj.left,
					probs,
					owners: refStrat.owners,
					arrow: undefined,
					referenced
				});
			} else {
				strategies.push({
					id: obj.id,
					uuid: obj.uuid,
					data: obj.data,
					top: obj.top,
					left: obj.left,
					probs,
					owners: obj.owners,
					arrow: undefined
				});
			}
		}
	}

	async function publishStrategy(probId: string, probUUID: string, title: string): Promise<void> {
		$processing = true;
		try {
			const response = await fetch('/home/tree/actions/publish_strategy', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ probId, probUUID, title, userId: data.session?.user.id })
			});

			const result: any = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
			quillsReady.set(false);
			problems = [];
			strategies = [];
			tree.setClientTree(result.data.tree, tree.getSelections());
			tick().then(() => {
				treeContainer = tree.calculateSpacing();
				updateTreeArrays();
				setTimeout(() => {
					quillsReady.set(true);
				}, 20);
			});
			$processing = false;
		} catch (error: any) {
			failurePopUp.set('Error: ' + error.message);
			$processing = false;
		}
	}
	async function deleteProblem(id: string, uuid: string): Promise<void> {
		$processing = true;
		try {
			const response = await fetch('/home/tree/actions/delete_problem', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ id, uuid, userId: data.session?.user.id })
			});

			const result: any = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
			quillsReady.set(false);
			problems = [];
			strategies = [];
			tree.setClientTree(result.data.tree, tree.getSelections());
			tick().then(() => {
				treeContainer = tree.calculateSpacing();
				updateTreeArrays();
				setTimeout(() => {
					quillsReady.set(true);
					successPopUp.set('Problem successfully deleted');
				}, 20);
			});
			$processing = false;
		} catch (error: any) {
			failurePopUp.set('Error: ' + error.message);
			$processing = false;
		}
	}
	async function deleteLinkedProblem(uuid: string): Promise<void> {
		$processing = true;
		try {
			const response = await fetch('/home/tree/actions/delete_linked_problem', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ uuid, userId: data.session?.user.id })
			});

			const result: any = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
			quillsReady.set(false);
			problems = [];
			strategies = [];
			tree.setClientTree(result.data.tree, tree.getSelections());
			tick().then(() => {
				treeContainer = tree.calculateSpacing();
				updateTreeArrays();
				setTimeout(() => {
					quillsReady.set(true);
					successPopUp.set('Problem successfully deleted');
				}, 20);
			});
			$processing = false;
		} catch (error: any) {
			failurePopUp.set('Error: ' + error.message);
			$processing = false;
		}
	}
	async function deleteStrategy(id: string, uuid: string): Promise<void> {
		$processing = true;
		try {
			const response = await fetch('/home/tree/actions/delete_strategy', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ id, uuid, userId: data.session?.user.id })
			});

			const result: any = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
			quillsReady.set(false);
			problems = [];
			strategies = [];
			tree.setClientTree(result.data.tree, []);
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
	function switchToStrategy(stratI: number, id: string) {
		const nRect = findNodeInTreeArrays(id)?.div?.getBoundingClientRect();
		if (nRect) {
			stratChange.pl = nRect.left;
			stratChange.pt = nRect.top;
		}
		let problem = tree.getObjFromId(tree.getParent(id) as string);
		$quillsReady = false;
		problem.selectedStrategy = stratI;
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
								if (!data.props?.loggedIn) {
									if (!$loginNotif) $loginNotif = true;
								} else {
									newStrategyProblem = { id: problem.id, uuid: problem.uuid };
									$newStrategyTitleModal.visible = true;
								}
							}}
							class="absolute left-[22px] bottom-[-25px] text-[#5f66a0] text-[12px] underline hover:text-[#8a93eb]"
							>New Strategy</button
						>
					{/if}
					<Problem
						treeData={tree.getObjFromId(problem.id, problem.uuid)}
						referenced={{ id: problem?.id, uuid: problem?.referenced }}
					></Problem>
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
						<Strategy
							treeData={tree.getObjFromId(strategy.id, strategy.uuid)}
							referenced={{ id: strategy?.id, uuid: strategy?.referenced }}
						></Strategy>
						{#if $quillsReady}
							{#if tree.getObjFromId(tree.getParent(strategy.id) || '')?.strategies.length > 1}
								<button
									on:click={() => {
										if (sectionsOpen) {
											strategy.arrow.style.transform = `rotate(90deg)`;
											sectionsOpen = false;
											window.removeEventListener('click', sectionFunction);
										} else {
											strategy.arrow.style.transform = `rotate(270deg)`;
											sectionsOpen = strategy.id;
											sectionFunction = () => {
												strategy.arrow.style.transform = `rotate(90deg)`;
												sectionsOpen = false;
												window.removeEventListener('click', sectionFunction);
											};
											setTimeout(() => window.addEventListener('click', sectionFunction), 2);
										}
									}}
									class="text-[11px] text-[#b0b0b0] h-[23px] rounded-[5px] absolute top-[-30px] left-[70px] w-[160px] border-[#606060] border-[1px]"
								>
									<p class="p-0 mt-[-1.8px]">
										{strategy.data.title.length < 20
											? strategy.data.title
											: strategy.data.title.substring(0, 18) + '..'}
									</p>
									<div bind:this={strategy.arrow} class="absolute top-[2.5px] right-[3px] arrow">
										<FolderArrow color="#484848" size="16px" />
									</div>
									{#if sectionsOpen === strategy.id}
										<div
											transition:slide={{ duration: 150, easing: quintOut }}
											class="z-[400] absolute bg-[#474747] rounded-[6px] top-[25px] right-[0px] left-0 flex flex-col text-[11px] py-[6px] space-y-[3px] text-[#e9e9e9]"
										>
											{#each tree.getObjFromId(tree.getParent(strategy.id) || '')?.strategies || [] as strat, i}
												{#if strat.id !== strategy.id}
													<button
														on:click={() => {
															sectionsOpen = false;
															window.removeEventListener('click', sectionFunction);
															switchToStrategy(i, strategy.id);
														}}
														class="hover:bg-[#626262] pl-[10px] flex justify-start"
														>{strat?.referenced
															? tree.getObjFromId(undefined, strat.referenced).data.title
															: strat.data.title}</button
													>
												{/if}
											{/each}
										</div>
									{/if}
								</button>
							{/if}
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

<style>
	.arrow {
		transform: rotate(90deg);
		transition: transform 150ms ease-out;
	}
</style>
