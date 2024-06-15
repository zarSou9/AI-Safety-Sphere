<script lang="ts">
	import { getContext, onMount, tick } from 'svelte';
	import Node from './Node.svelte';
	import Curve from '$lib/components/Curve.svelte';
	import type { TreeInterface, linking_category } from '$lib/types/nodes';
	import type { Writable } from 'svelte/store';
	import type { PageData } from '../$types';
	import ToolTip from '$lib/components/ToolTip.svelte';
	import FadeElement from '$lib/components/FadeElement.svelte';

	const tree: TreeInterface = getContext('tree');
	const viewingNodeRect: { l: number; t: number; w: number; h: number } =
		getContext('viewingNodeRect');
	const navNodeRect: { l: number; t: number; w: number; h: number } = getContext('navNodeRect');
	const nodeHeight: any = getContext('nodeHeightStore');
	const canvasAction: Writable<string | null> = getContext('canvasActionStore');
	const treeAction: Writable<string | null> = getContext('treeActionStore');
	const data: PageData = getContext('data');
	const viewingNode: Writable<any> = getContext('viewingNodeStore');
	const quillsReady: Writable<boolean> = getContext('quillsReadyStore');
	const failurePopUp: Writable<any> = getContext('failurePopUpStore');
	const nodeToRemove: Writable<string | undefined> = getContext('nodeToRemoveStore');
	const successPopUp: Writable<any> = getContext('successPopUpStore');
	const redoTree: Writable<boolean> = getContext('redoTreeStore');
	const processing: Writable<boolean> = getContext('processingStore');
	const loginNotif: Writable<any> = getContext('loginNotifStore');

	let viewingNodeDiv: HTMLDivElement | undefined;
	let treeContainer: {
		width: number;
		height: number;
	};
	let treeActionUnsubscribe: any;
	let viewingNodeUnsubscribe: any;
	let quillsReadyUnsubscribe: any;
	let nodes: {
		uuid: string;
		data: { title: string; tldr?: Object };
		div?: HTMLDivElement;
		top?: number;
		left?: number;
		parent?: any;
		last?: boolean;
		owners?: Array<string>;
		children?: Array<any>;
		linking_categories: linking_category[];
	}[] = [];
	let openTree = false;
	let extraShown = true;
	let titleSpacingReady = false;
	let moving = false;
	let lastNavigatedNode = 'r';

	viewingNode.set(undefined);
	$quillsReady = false;
	$: if (openTree) {
		setTimeout(() => {
			$quillsReady = true;
		}, 100);
	}

	function findNodeInTreeArrays(uuid: string | undefined) {
		return nodes.find((v) => v.uuid === uuid);
	}

	onMount(() => {
		if (tree.getTree()?.node) {
			treeContainer = tree.calculateSpacing();
			updateTreeArray();
			openTree = true;
		}
		viewingNodeUnsubscribe = viewingNode.subscribe((v) => {
			if (v) {
				viewingNodeDiv = findNodeInTreeArrays(v)?.div;
			} else if (v === false) {
				if ($redoTree) {
					nodes = [];
					treeContainer = tree.calculateSpacing();
					updateTreeArray();
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
				} else if (action === 'remove-node') {
					deleteNode($nodeToRemove);
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

	function updateTreeArray(obj = tree.getTree()?.node, parent: any = undefined) {
		if (!obj) return;
		nodes.push({
			uuid: obj.uuid,
			data: obj.data,
			owners: obj.owners,
			top: obj.top,
			left: obj.left,
			parent,
			linking_categories: obj.linking_categories
		});
		for (let node of obj.children) {
			updateTreeArray(node, {
				data: obj.data,
				uuid: obj.uuid,
				category: obj.linking_categories.find((cat) => cat.id === node.parent_category)
			});
		}
	}

	async function deleteNode(uuid: string | undefined): Promise<void> {
		$processing = true;
		try {
			const response = await fetch('/actions/delete_node', {
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
			nodes = [];
			tree.setTree(result.data.tree);
			tick().then(() => {
				treeContainer = tree.calculateSpacing();
				updateTreeArray();
				setTimeout(() => {
					quillsReady.set(true);
					successPopUp.set('Node successfully deleted');
				}, 20);
			});
			$processing = false;
		} catch (error: any) {
			failurePopUp.set('Error: ' + error.message);
			$processing = false;
		}
	}
	function navigateToNode(uuid: string | undefined) {
		const nRect = findNodeInTreeArrays(uuid)?.div?.getBoundingClientRect();
		if (nRect && uuid) {
			lastNavigatedNode = uuid;
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
				let parent = tree.getParent(lastNavigatedNode);
				if (parent) navigateToNode(parent.node.uuid);
				setTimeout(() => (moving = false), 320);
			} else if (k === 'ArrowDown') {
				moving = true;
				const n = tree.getObjFromId(lastNavigatedNode);
				if (n) navigateToNode(n.children[0]?.uuid);
				setTimeout(() => (moving = false), 320);
			} else if (k === 'ArrowLeft') {
				moving = true;
				const parent = tree.getParent(lastNavigatedNode);
				let i = -1;
				if (parent) i += parent.i;
				if (i >= 0) {
					navigateToNode(parent?.node.children[i]?.uuid);
				}
				setTimeout(() => (moving = false), 320);
			} else if (k === 'ArrowRight') {
				moving = true;
				const parent = tree.getParent(lastNavigatedNode);
				let i = 1;
				if (parent) i += parent.i;
				if (i < (parent?.node.children.length || 0)) {
					navigateToNode(parent?.node.children[i]?.uuid);
				}
				setTimeout(() => (moving = false), 320);
			}
		}
	}
</script>

<div class="h-[20px]" />
{#if openTree}
	<div class="relative" style="height: {treeContainer.height}px; width: {treeContainer.width}px;">
		{#each nodes as node (node.uuid)}
			{#if extraShown || node.uuid === $viewingNode}
				<div
					role="presentation"
					bind:this={node.div}
					class="absolute"
					style="left: {node.left}px; top: {node.top}px;"
				>
					<Node treeData={tree.getObjFromId(node.uuid)} />
					{#if extraShown}
						{#if node.parent}
							<div class="absolute top-[-30px] flex w-[800px] justify-center">
								<button
									on:click={() => {
										navigateToNode(node.parent.uuid);
									}}
									class="underline underline-offset-[-14px] text-[13px] text-[#9a9a9a] hover:text-[#ffffff]"
									>{node.parent.data.title}
								</button>
							</div>
						{/if}
						<div class="absolute flex w-[800px] justify-evenly top-[calc(100%+12px)]">
							{#each node.linking_categories as category}
								<div
									role="button"
									bind:this={category.div}
									class="relative group text-[13px] px-[12px] py-[1px] rounded-[6px] cursor-pointer"
									style="background-color: {category.color};"
								>
									<p class="selection:bg-none">{category.title}</p>
									<FadeElement className="cursor-auto" side="bottom">
										<div
											class="flex flex-col items-center w-[180px] bg-[#282828] rounded-[6px] px-[10px] pb-[10px] text-[11.5px] text-[#e4e4e4]"
										>
											{#if category.description}
												<p class="mt-[7px]">{category.description}</p>
												<div class="bg-[#7c7c7c] h-[.3px] w-full mt-[8px]"></div>
											{/if}
											<button
												class="border-[#33517b] border-[1px] hover:bg-[#33517b] transition-colors rounded-[6px] w-full py-[1px] mt-[10px]"
												>Add Node</button
											>
											{#if node.owners?.includes(data.props?.profile?.username)}
												<button
													class="border-[#2d7356] border-[1px] hover:bg-[#2d7356] transition-colors rounded-[6px] w-full py-[1px] mt-[6px]"
													>Edit Categories</button
												>
											{/if}
										</div>
									</FadeElement>
								</div>
							{/each}
						</div>
					{/if}
					{#if $quillsReady && !node.last}
						{#each node?.children || [] as child (child.uuid)}
							<Curve
								pointA={{
									x: node.left || 0,
									y: (node.top || 0) + node.div.clientHeight
								}}
								pointB={{
									x: child.pos.left + 400,
									y: child.pos.top - 27
								}}
								size={treeContainer}
							/>
						{/each}
					{/if}
				</div>
			{/if}
		{/each}
	</div>
{/if}
<div class="h-[20px]" />
