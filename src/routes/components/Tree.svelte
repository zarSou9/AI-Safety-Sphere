<script lang="ts">
	import { getContext, onMount, tick } from 'svelte';
	import type {
		TreeInterface,
		LinkingCategory,
		CategoriesModal,
		TreeArrayNode,
		NewNodeModalStore,
		NodeTypes
	} from '$lib/types';
	import type { Writable } from 'svelte/store';
	import type { PageData } from '../$types';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	import Node from './Node.svelte';
	import Poll from './Poll.svelte';
	import Thread from './Thread.svelte';
	import Curve from '$lib/components/Curve.svelte';
	import FadeElement from '$lib/components/FadeElement.svelte';
	import Left from '$lib/icons/Left.svelte';
	import Right from '$lib/icons/Right.svelte';
	import Search from '$lib/icons/Search.svelte';

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
	const loginNotif: Writable<boolean> = getContext('loginNotifStore');
	const categoriesModal: Writable<CategoriesModal> = getContext('categoriesModalStore');
	const newNodeModal: NewNodeModalStore = getContext('newNodeModalStore');
	const shortCutsEnabled: Writable<boolean> = getContext('shortCutsEnabledStore');

	let viewingNodeDiv: HTMLDivElement | undefined;
	let treeContainer: {
		width: number;
		height: number;
	};
	let treeActionUnsubscribe: any;
	let viewingNodeUnsubscribe: any;
	let quillsReadyUnsubscribe: any;
	let nodes: TreeArrayNode[] = [];

	let openTree = false;
	let extraShown = true;
	let categorySpacingReady = false;
	let moving = false;
	let root_id = '742b77a5-b4ed-4f16-afe1-630686362d10';
	let lastNavigatedNode = root_id;
	let searchCallback: any;
	let sectionsOpen: string | false;

	viewingNode.set(undefined);
	$quillsReady = false;
	$: if (openTree) {
		setTimeout(() => {
			$quillsReady = true;
		}, 100);
	}

	function findNodeInTreeArrays(uuid: string | undefined) {
		return nodes.find((v) => v.treeNode.uuid === uuid);
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
					calculateCategorySpacing();
					categorySpacingReady = true;
				}, 40);
			} else {
				categorySpacingReady = false;
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
				} else if (action === 'save-new-categories') {
					$categoriesModal.categories.forEach((c) => {
						if (!c.title) c.title = 'untitled';
						delete c?.input;
						delete c?.div;
						delete c?.left;
						delete c?.typesOpen;
						delete c?.permissionsOpen;
					});
					updateCategories($categoriesModal.uuid, $categoriesModal.categories);
				} else if (action === 'create-new-node') {
					publishNode(
						$newNodeModal.uuid || '',
						$newNodeModal.category_id || '',
						$newNodeModal.title,
						$newNodeModal.type || 'Default'
					);
					$newNodeModal.title = '';
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

	function calculateCategorySpacing() {
		nodes.forEach((n) => {
			let catWidths = 0;
			n.treeNode.linking_categories.forEach((lc) => (catWidths += lc.div?.offsetWidth || 0));
			let spacing = (800 - catWidths) / (n.treeNode.linking_categories.length + 1);
			let accumulator = 0;
			n.treeNode.linking_categories.forEach((lc) => {
				lc.left = accumulator + spacing;
				accumulator += spacing + (lc.div?.offsetWidth || 0);
			});
		});
	}

	function updateTreeArray(
		obj = tree.getTree()?.node,
		parent?: {
			node: TreeArrayNode;
			category: LinkingCategory;
		}
	) {
		if (!obj) return;
		const searchArray =
			parent?.category.type === 'Collapsed'
				? parent?.node.treeNode.fullChildren
						?.filter((fullChild) => fullChild.parent_category === parent?.category.id)
						.map((child) => {
							return { uuid: child.uuid, title: child.data.title };
						})
				: undefined;
		const node: TreeArrayNode = {
			treeNode: obj,
			arrayChildren: obj.children.map((n) => {
				return {
					uuid: n.uuid,
					pos: { left: n.left || 0, top: n.top || 0 },
					parent_category: obj.linking_categories.find(
						(lc) => lc.id === n.parent_category
					) as LinkingCategory
				};
			}),
			parent,
			fullSearchSiblings: searchArray,
			searchSiblings: searchArray
		};
		nodes.push(node);
		for (let child of obj.children) {
			updateTreeArray(child, {
				node,
				category: obj.linking_categories.find(
					(cat) => cat.id === child.parent_category
				) as LinkingCategory
			});
		}
	}
	const removeType = (o: any) => o;

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
			tree.setClientTree(result.data.tree);
			rehydrateTree();
			$processing = false;
		} catch (error: any) {
			failurePopUp.set('Error: ' + error.message);
			$processing = false;
		}
	}
	async function updateCategories(
		uuid: string | undefined,
		newCategories: LinkingCategory[]
	): Promise<void> {
		$categoriesModal.waiting = true;
		try {
			const response = await fetch('/actions/update_categories', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ uuid, newCategories, userId: data.session?.user.id })
			});

			const result: any = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
			tree.setClientTree(result.data.tree);
			rehydrateTree();
			$categoriesModal.visible = false;
		} catch (error: any) {
			failurePopUp.set('Error: ' + error.message);
		} finally {
			$categoriesModal.waiting = false;
		}
	}
	async function publishNode(
		parentUUID: string,
		parentCategory: string,
		title: string,
		type: NodeTypes
	): Promise<void> {
		$processing = true;
		try {
			const response = await fetch('/actions/publish_node', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					parentUUID,
					parentCategory,
					title,
					type,
					userId: data.session?.user.id
				})
			});

			const result: any = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
			tree.setClientTree(result.data.tree);
			rehydrateTree();
			$processing = false;
		} catch (error: any) {
			$processing = false;
			failurePopUp.set('Error: ' + error.message);
		}
	}

	function navigateToNode(node: string | TreeArrayNode | undefined) {
		let nRect;
		if (typeof node === 'string') nRect = findNodeInTreeArrays(node)?.div?.getBoundingClientRect();
		else nRect = node?.div?.getBoundingClientRect();
		if (nRect && node) {
			lastNavigatedNode = typeof node === 'string' ? node : node.treeNode.uuid;
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
				else navigateToNode(root_id);
				setTimeout(() => (moving = false), 320);
			} else if (k === 'ArrowDown') {
				moving = true;
				const n = tree.getObjFromId(lastNavigatedNode);
				if (n) navigateToNode(n.children[0]?.uuid);
				else navigateToNode(root_id);
				setTimeout(() => (moving = false), 320);
			} else if (k === 'ArrowLeft') {
				const node = findNodeInTreeArrays(lastNavigatedNode);
				if (node?.parent) {
					let move = false;
					if (node.parent.category.type === 'Collapsed') {
						let startIndex = node.parent.node.treeNode.fullChildren?.findIndex(
							(fellow) => fellow.parent_category === node.parent?.category.id
						);
						let nodeIndexFull = node.parent.node.treeNode.fullChildren?.findIndex(
							(child) => child.uuid === node.treeNode.uuid
						);
						if (startIndex !== nodeIndexFull) {
							selectNodeInTreeArray(node, -1, nodeIndexFull);
						} else move = true;
					} else move = true;

					if (move) {
						let nodeIndex = node.parent.node.treeNode.children.findIndex(
							(child) => child.uuid === node.treeNode.uuid
						);
						if (nodeIndex) {
							moving = true;
							navigateToNode(node.parent.node.treeNode.children[nodeIndex - 1]?.uuid);
							setTimeout(() => (moving = false), 320);
						}
					}
				}
			} else if (k === 'ArrowRight') {
				const node = findNodeInTreeArrays(lastNavigatedNode);
				if (node?.parent) {
					let move = false;
					if (node.parent.category.type === 'Collapsed') {
						let endIndex = node.parent.node.treeNode.fullChildren?.findLastIndex(
							(fellow) => fellow.parent_category === node.parent?.category.id
						);
						let nodeIndexFull = node.parent.node.treeNode.fullChildren?.findIndex(
							(child) => child.uuid === node.treeNode.uuid
						);
						if (endIndex !== nodeIndexFull) {
							selectNodeInTreeArray(node, 1, nodeIndexFull);
						} else move = true;
					} else move = true;

					if (move) {
						let nodeIndex = node.parent.node.treeNode.children.findIndex(
							(child) => child.uuid === node.treeNode.uuid
						);
						if (nodeIndex !== node.parent.node.treeNode.children.length) {
							moving = true;
							navigateToNode(node.parent.node.treeNode.children[nodeIndex + 1]?.uuid);
							setTimeout(() => (moving = false), 320);
						}
					}
				}
			}
		}
	}
	function selectNodeInTreeArray(node: TreeArrayNode, dir: number, nodeIndexFull?: number) {
		let endIndex = node.parent?.node.treeNode.fullChildren?.findLastIndex(
			(fellow) => fellow.parent_category === node.parent?.category.id
		);
		let nodeIndex = node.parent?.node.treeNode.children.findIndex(
			(child) => child.uuid === node.treeNode.uuid
		);
		if (!nodeIndexFull)
			nodeIndexFull = node.parent?.node.treeNode.fullChildren?.findIndex(
				(child) => child.uuid === node.treeNode.uuid
			);
		if (
			nodeIndex !== undefined &&
			nodeIndexFull !== undefined &&
			node.parent?.node.treeNode.fullChildren &&
			nodeIndexFull + dir <= (endIndex ?? -1)
		) {
			let newNode = node.parent?.node.treeNode.fullChildren[nodeIndexFull + dir];
			if (newNode) {
				node.parent?.node.treeNode.children.splice(nodeIndex, 1, newNode);
				rehydrateTree();
				lastNavigatedNode = newNode.uuid;
			}
		}
	}

	function selectSpecificNodeInTreeArray(uuid: string, node: TreeArrayNode) {
		let nodeIndex = node.parent?.node.treeNode.children.findIndex(
			(child) => child.uuid === node.treeNode.uuid
		);
		let newNode = node.parent?.node.treeNode.fullChildren?.find((child) => child.uuid === uuid);
		if (nodeIndex && newNode) {
			node.parent?.node.treeNode.children.splice(nodeIndex, 1, newNode);
			rehydrateTree();
			lastNavigatedNode = newNode.uuid;
		}
	}

	function rehydrateTree() {
		treeContainer = tree.calculateSpacing();
		nodes = [];
		updateTreeArray();
		categorySpacingReady = false;
		tick().then(() => {
			calculateCategorySpacing();
			categorySpacingReady = true;
		});
	}
</script>

<div class="h-[20px]" />
{#if openTree}
	<div class="relative" style="height: {treeContainer.height}px; width: {treeContainer.width}px;">
		{#each nodes as node (node.treeNode.uuid)}
			{#if extraShown || node.treeNode.uuid === $viewingNode}
				<div
					role="presentation"
					bind:this={node.div}
					class="absolute"
					style="left: {node.treeNode.left}px; top: {node.treeNode.top}px;"
				>
					{#if extraShown && node.parent}
						<div class="absolute top-[-30px] flex w-[800px] justify-center">
							<button
								on:click={() => {
									navigateToNode(node.parent?.node);
								}}
								class="underline underline-offset-[-15px] text-[13px] transition-colors text-[#9a9a9a] hover:text-[#ffffff]"
								>{`${node.parent.node.treeNode.data.title} (${node.parent.category.title})`}
							</button>
						</div>
					{/if}
					{#if node.treeNode.type === 'Default'}
						<Node shadowColor={node.parent?.category.color || '#a53a3a'} treeData={node.treeNode} />
						{#if extraShown}
							<div class="absolute flex w-[800px] top-[calc(100%+12px)]">
								{#each node.treeNode.linking_categories as category (category.id)}
									<div
										role="presentation"
										on:click={() =>
											navigateToNode(
												node.arrayChildren.find((n) => n.parent_category.id === category.id)?.uuid
											)}
										bind:this={category.div}
										class="absolute group top-0 text-[12.8px] px-[8px] py-[1px] rounded-[6px] cursor-pointer"
										style="background-color: {category.color}; left: {categorySpacingReady
											? category.left
											: '380'}px;"
									>
										<p class="selection:bg-none">{category.title}</p>
										{#if node.treeNode.owners?.includes(data.props?.profile?.username)}
											<FadeElement className="cursor-auto" side="bottom">
												<div
													role="presentation"
													on:click={(e) => e.stopPropagation()}
													class="flex flex-col items-center w-[180px] bg-[#282828] rounded-[6px] px-[10px] pb-[10px] text-[11.5px] text-[#e4e4e4]"
												>
													{#if category.description}
														<p class="mt-[7px]">{category.description}</p>
														<div class="bg-[#7c7c7c] h-[.3px] w-full mt-[8px]" />
													{/if}
													{#if category.postPermissions === 'Anyone' || node.treeNode.owners.includes(data.props.profile?.username)}
														<button
															on:click={() => {
																if (data.props.loggedIn) {
																	$newNodeModal.uuid = node.treeNode.uuid;
																	$newNodeModal.category_id = category.id;
																	$newNodeModal.allowedTypes = category.nodesAllowed;
																	$newNodeModal.type = category.nodesAllowed[0];
																	$newNodeModal.visible = true;
																} else loginNotif.set(true);
															}}
															class="border-[#3d6297] border-[1px] hover:bg-[#3d6297] transition-colors rounded-[6px] w-full py-[1px] mt-[10px]"
															>Add Node</button
														>{/if}
													{#if node.treeNode.owners?.includes(data.props?.profile?.username)}
														<button
															on:click={() => {
																$categoriesModal = {
																	visible: true,
																	uuid: node.treeNode.uuid,
																	categories: node.treeNode.linking_categories,
																	uneditableCats: new Set(
																		node.arrayChildren.map((child) => child.parent_category.id)
																	),
																	waiting: false
																};
															}}
															class="border-[#2d7356] border-[1px] hover:bg-[#2d7356] transition-colors rounded-[6px] w-full py-[1px] mt-[6px]"
															>Edit Categories</button
														>
													{/if}
												</div>
											</FadeElement>
										{/if}
									</div>
								{/each}
							</div>
							{#if node.parent?.category?.type === 'Collapsed'}
								<div class="absolute top-[-33px] left-[30px]">
									<input
										bind:value={node.searchInput}
										on:input={(e) => {
											if (sectionsOpen !== node.treeNode.uuid) {
												removeType(e).target?.blur();
												if (searchCallback) searchCallback();
											}
											node.searchSiblings = node.fullSearchSiblings?.filter((ss) =>
												ss.title.toLowerCase().includes(node.searchInput?.toLowerCase() || '')
											);
										}}
										on:click={(e) => {
											e.stopPropagation();
											if (!sectionsOpen) {
												sectionsOpen = node.treeNode.uuid;
												$shortCutsEnabled = false;
												searchCallback = () => {
													sectionsOpen = false;
													$shortCutsEnabled = true;
													window.removeEventListener('click', searchCallback);
													node.searchInput = '';
													node.searchSiblings = JSON.parse(JSON.stringify(node.fullSearchSiblings));
												};
												setTimeout(() => window.addEventListener('click', searchCallback), 2);
											}
										}}
										class="text-[11px] text-[#b0b0b0] w-[120px] pl-[22px] h-[23px] bg-[#151515] placeholder:text-[#848484] rounded-md outline-none transition-colors border-[#606060] border-[1px]"
										style={sectionsOpen === node.treeNode.uuid
											? 'border-color: #9c9c9c; width: 150px; transition: width 0.15s ease-out;'
											: 'transition: width 0.15s ease-out;'}
										placeholder="Search nodes..."
									/>
									<div class="absolute top-[8px] left-[7px] pointer-events-none transition-colors">
										<Search
											color={sectionsOpen === node.treeNode.uuid ? '#9c9c9c' : '#606060'}
											size="12px"
										/>
									</div>
									{#if sectionsOpen === node.treeNode.uuid}
										<div
											transition:slide={{ duration: 150, easing: quintOut }}
											class="h-[200px] absolute bg-[#474747] rounded-[6px] top-[25px] right-[0px] left-0 flex flex-col text-[11px] py-[6px] space-y-[1px] text-[#e9e9e9] overflow-auto"
										>
											{#each node.searchSiblings || [] as child (child.uuid)}
												<button
													on:click={() => {
														searchCallback();
														selectSpecificNodeInTreeArray(child.uuid, node);
													}}
													class="hover:bg-[#626262] pl-[13px] flex justify-start"
													>{child.title}</button
												>
											{/each}
											{#if !node.searchSiblings?.length}<p
													class="pl-[13px] text-[#d5d5d5] justify-start"
												>
													No results found
												</p>{/if}
										</div>
									{/if}
								</div>
								<button
									on:click={() => selectNodeInTreeArray(node, -1)}
									class="absolute left-[-25px] top-1/2 -translate-y-1/2"
									style={`opacity: ${
										node.parent.node.treeNode.fullChildren?.find(
											(fellow) => fellow.parent_category === node.parent?.category.id
										)?.uuid ===
										node.parent.node.treeNode.fullChildren?.find(
											(fellow) => fellow.uuid === node.treeNode.uuid
										)?.uuid
											? '0; pointer-events: none;'
											: '1;'
									}`}
									><Left color="#f0f0f0" size="24px" />
								</button>
								<button
									on:click={() => selectNodeInTreeArray(node, 1)}
									class="absolute right-[-25px] top-1/2 -translate-y-1/2"
									style={`opacity: ${
										node.parent.node.treeNode.fullChildren?.findLast(
											(fellow) => fellow.parent_category === node.parent?.category.id
										)?.uuid ===
										node.parent.node.treeNode.fullChildren?.find(
											(fellow) => fellow.uuid === node.treeNode.uuid
										)?.uuid
											? '0; pointer-events: none;'
											: '1;'
									};`}
									><Right color="#f0f0f0" size="24px" />
								</button>
							{/if}
						{/if}
					{:else if node.treeNode.type === 'Thread'}
						<Thread
							shadowColor={node.parent?.category.color || '#a53a3a'}
							treeData={node.treeNode}
						/>
					{:else if node.treeNode.type === 'Poll'}
						<Poll />
					{/if}
				</div>
				{#if $quillsReady && !node.last && categorySpacingReady}
					{#each node?.arrayChildren || [] as child (child.uuid)}
						<Curve
							pointA={{
								x:
									(node.treeNode.left || 0) +
									(child.parent_category.left || 0) +
									(child.parent_category.div?.offsetWidth || 0) / 2,
								y: (node.treeNode.top || 0) + (node.div?.clientHeight || 0) + 33
							}}
							pointB={{
								x: child.pos.left + 400,
								y: child.pos.top - 30
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
