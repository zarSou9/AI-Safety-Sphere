<script lang="ts">
	import type { TrackChanges, TreeInterface } from '$lib/types/nodes';
	import { getContext, onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import type { Writable } from 'svelte/store';
	import type { PageData } from './$types';
	import { tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	import OpenFolder from '$lib/icons/OpenFolder.svelte';
	import ClosedFolder from '$lib/icons/ClosedFolder.svelte';
	import FolderArrow from '$lib/icons/FolderArrow.svelte';
	import Edit from '$lib/icons/Edit.svelte';
	import Profile from '$lib/icons/Profile.svelte';
	import Cross from '$lib/icons/Cross.svelte';
	import Discussion from '$lib/icons/Discussion.svelte';
	import PullRequest from '$lib/icons/PullRequest.svelte';
	import Settings from '$lib/icons/Settings.svelte';

	interface PublishServerResponse {
		message: string;
		error: string;
		newChanges: TrackChanges;
	}

	const dashboardAction: Writable<string | null> = getContext('dashboardActionStore');
	const data: PageData = getContext('data');
	const tree: TreeInterface = getContext('tree');

	const resizeObserver = new ResizeObserver((entries) => {
		for (let entry of entries) {
			containerWidth = entry.contentRect.width;
		}
	});

	let trasitionDuration = 300;
	let containerWidth = 1600;
	let pageTab = '';
	let container: HTMLDivElement;
	let open = false;
	let folderTreeOpen = true;
	let folderTreeOutro = false;
	let openPage: any;
	let folderTree: any = [
		{
			title: 'Nodes',
			open: false,
			children: [
				{
					title: 'Published',
					open: false,
					children: [
						{ title: 'Strategies', open: false, children: [] },
						{ title: 'Problems', open: false, children: [] }
					]
				},
				{
					title: 'Unpublished',
					open: false,
					children: [
						{ title: 'Strategies', open: false, children: [] },
						{ title: 'Problems', open: false, children: [] }
					]
				},
				{ title: 'Archived', open: false, children: [] }
			]
		},
		{
			title: 'Edits',
			open: false,
			children: [
				{ title: 'Active', open: false, children: [] },
				{ title: 'Pending', open: false, children: [] },
				{
					title: 'History',
					open: false,
					children: [
						{ title: 'Aproved', open: false, children: [] },
						{ title: 'Denied', open: false, children: [] }
					]
				}
			]
		}
	];
	let dashboardActionUnsubscribe: any;
	let processing = false;
	let successPopUp: any = false;
	let failurePopUp: any = false;
	let subProblemsChecked = true;

	let changes = tree.getChanges();

	onMount(() => {
		if (changes.new.length || changes.nodes.length || data?.props?.ownedIds?.length) {
			open = true;
		}
		if (open) {
			changes.new.forEach((id) => {
				if (tree.getNodeType(id) === 's') {
					folderTree[0].children[1].children[0].children.push({
						title: tree.getObjFromId(id).data.title,
						id
					});
				} else {
					folderTree[0].children[1].children[1].children.push({
						title: tree.getObjFromId(id).data.title,
						id
					});
				}
			});
			const editedOwned: any = [];
			changes.nodes.forEach((n) => {
				if (changes.new.find((id) => id === n.id) === undefined) {
					if (data?.props?.ownedIds.find((oid: any) => n.id === oid)) {
						editedOwned.push(n.id);
						const newPage = {
							title: tree.getObjFromId(n.id).data.title,
							id: n.id,
							edited: true
						};
						if (tree.getNodeType(n.id) === 's')
							folderTree[0].children[0].children[0].children.push(newPage);
						else folderTree[0].children[0].children[1].children.push(newPage);
					} else {
						folderTree[1].children[0].children.push({
							title: tree.getObjFromId(n.id).data.title,
							id: n.id
						});
					}
				}
			});
			data?.props?.ownedIds.forEach((id: any) => {
				if (!editedOwned.includes(id)) {
					const newPage = {
						title: tree.getObjFromId(id).data.title,
						id,
						edited: false
					};
					if (tree.getNodeType(id) === 's')
						folderTree[0].children[0].children[0].children.push(newPage);
					else folderTree[0].children[0].children[1].children.push(newPage);
				}
			});

			openFirstPage();
			setTimeout(() => {
				updateArrows();
			}, 20);

			dashboardActionUnsubscribe = dashboardAction.subscribe((action) => {
				if (action) {
					if (action === 'handle-destroy') {
						trasitionDuration = 0;
					}
					dashboardAction.set(null);
				}
			});
			resizeObserver.observe(container);
			trasitionDuration = 300;
		}
		return () => {
			if (dashboardActionUnsubscribe) {
				dashboardActionUnsubscribe();
			}
			resizeObserver.unobserve(container);
		};
	});

	function openFirstPage(obj: any = folderTree) {
		for (let fold of obj) {
			if (fold?.children) {
				fold.open = true;
				if (openFirstPage(fold.children)) {
					return true;
				}
			} else {
				openPage = fold;
				return true;
			}
		}
	}
	function openSelectPage(page: any, obj: any = folderTree) {
		for (let fold of obj) {
			if (fold?.children) {
				fold.open = true;
				if (openSelectPage(page, fold.children)) {
					return true;
				}
			} else if (page === fold) {
				openPage = fold;
				return true;
			}
		}
	}

	function getParentFolderFromPage(page: any) {
		for (let fold of folderTree) {
			for (let fold1 of fold.children) {
				for (let fold2 of fold1.children) {
					if (fold2 === page) {
						return fold1;
					}
					if (fold2?.children) {
						for (let fold3 of fold2?.children) {
							if (fold3 === page) return fold2;
						}
					}
				}
			}
		}
	}
	function getGrandParentFolderFromPage(page: any) {
		for (let fold of folderTree) {
			for (let fold1 of fold.children) {
				for (let fold2 of fold1.children) {
					if (fold2 === page) {
						return fold;
					}
					if (fold2?.children) {
						for (let fold3 of fold2?.children) {
							if (fold3 === page) return fold1;
						}
					}
				}
			}
		}
	}
	function getPagePriorFromId(pageId: string, obj: any = folderTree): any {
		for (let fold of obj) {
			if (fold?.children) {
				fold.open = true;
				const page = getPagePriorFromId(pageId, fold.children);
				if (page) return page;
			} else if (fold?.id === pageId) {
				return obj[obj.indexOf(fold) - 1];
			}
		}
	}
	function updateArrows(obj: any = folderTree) {
		for (let fold of obj) {
			if (fold?.open) {
				if (fold?.div) fold.div.style.transform = `rotate(90deg)`;
				if (fold?.children) updateArrows(fold.children);
			} else if (fold?.div !== undefined) fold.div.style.transform = `rotate(0deg)`;
		}
	}
	function setPageTab(tab: string) {
		pageTab = tab;
		return true;
	}

	async function publishStrategyWithSubProblems(): Promise<void> {
		let strategy;
		let problems: any = [];
		let c = tree.getChanges();
		for (let n of c.nodes) {
			if (openPage.id === n.id) {
				strategy = { id: n.id, ...n.quills };
			}
			if (openPage.id === tree.getParent(n.id)) {
				problems.push({ id: n.id, ...n.quills });
			}
		}
		try {
			const response = await fetch('/home/tree/actions/publish', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ strategies: [strategy], problems, changes: c })
			});

			const result: PublishServerResponse = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}

			tree.setChanges(result.newChanges);
			data.props?.ownedIds.push(openPage.id);
			tree.getObjFromId(openPage.id).problems.forEach((p: any) => {
				data.props?.ownedIds.push(p.id);
			});
			updateTreeFolder();

			processing = false;
			successPopUp = 'Success: ' + result.message;
		} catch (error: any) {
			processing = false;
			failurePopUp = 'Error: ' + error.message;
		}
	}
	async function publishStrategy(): Promise<void> {
		let strategy;
		let c = tree.getChanges();
		for (let n of c.nodes) {
			if (openPage.id === n.id) {
				strategy = { id: n.id, ...n.quills };
			}
		}
		try {
			const response = await fetch('/home/tree/actions/publish_strategy', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ strategy, changes: c })
			});

			const result: PublishServerResponse = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}

			tree.setChanges(result.newChanges);
			data.props?.ownedIds.push(openPage.id);
			updateTreeFolder();

			processing = false;
			successPopUp = 'Success: ' + result.message;
		} catch (error: any) {
			processing = false;
			failurePopUp = 'Error: ' + error.message;
		}
	}
	async function publishProblem(): Promise<void> {
		let problem;
		let c = tree.getChanges();
		for (let n of c.nodes) {
			if (openPage.id === n.id) {
				problem = { id: n.id, ...n.quills };
			}
		}
		try {
			const response = await fetch('/home/tree/actions/publish_problem', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ problem, changes: c })
			});

			const result: PublishServerResponse = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}

			tree.setChanges(result.newChanges);
			data.props?.ownedIds.push(openPage.id);
			updateTreeFolder();

			processing = false;
			successPopUp = 'Success: ' + result.message;
		} catch (error: any) {
			processing = false;
			failurePopUp = 'Error: ' + error.message;
		}
	}
	async function commitChangesToOwnedNode(): Promise<void> {
		let c = tree.getChanges();
		let nodeChanges: any;
		let type: any;
		for (let n of c.nodes) {
			if (openPage.id === n.id) {
				nodeChanges = { id: n.id, ...n.quills };
				type = tree.getNodeType(n.id);
			}
		}
		try {
			const response = await fetch('/home/tree/actions/commit_owned', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ type, nodeChanges })
			});

			const result: any = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
			openPage.edited = false;
			tree.setChanges({
				new: c.new,
				nodes: c.nodes.filter((n) => n.id !== openPage.id)
			});

			const obj = tree.getObjFromId(openPage.id);
			obj.data.title = result.newNode.title;
			obj.data.tldr = result.newNode.tldr;

			data.supabase
				.from('Profiles')
				.update({ changes: tree.getChanges() })
				.eq('user_id', data.session?.user.id)
				.then(({ error }) => {
					if (error) {
						console.log(error);
					}
				});

			processing = false;
			successPopUp = 'Success: ' + result.message;
		} catch (error: any) {
			processing = false;
			failurePopUp = 'Error: ' + error.message;
		}
	}
	async function deleteProblem(): Promise<void> {
		let c = tree.getChanges();
		try {
			const response = await fetch('/home/tree/actions/delete_problem', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ problemId: openPage.id, changes: c })
			});

			const result: any = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}

			tree.setChanges(result.newChanges);
			if (data.props)
				data.props.ownedIds = data.props?.ownedIds.filter((oid: any) => openPage.id !== oid);
			tree.setTree(result.newTree, tree.getChanges(), tree.getSelections());

			const newPageId = getPagePriorFromId(openPage.id)?.id;
			updateTreeFolder(newPageId);
			if (!newPageId) openFirstPage();

			processing = false;
			successPopUp = 'Success: ' + result.message;
		} catch (error: any) {
			processing = false;
			failurePopUp = 'Error: ' + error.message;
		}
	}
	async function deleteStrategy(): Promise<void> {
		let c = tree.getChanges();
		try {
			const response = await fetch('/home/tree/actions/delete_strategy', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ strategyId: openPage.id, changes: c })
			});

			const result: any = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}

			tree.setChanges(result.newChanges);
			if (data.props)
				data.props.ownedIds = data.props?.ownedIds.filter((oid: any) => openPage.id !== oid);
			tree.setTree(result.newTree, tree.getChanges(), []);

			const newPageId = getPagePriorFromId(openPage.id)?.id;
			updateTreeFolder(newPageId);
			if (!newPageId) openFirstPage();

			processing = false;
			successPopUp = 'Success: ' + result.message;
		} catch (error: any) {
			processing = false;
			failurePopUp = 'Error: ' + error.message;
		}
	}
	async function pushEditsToOwner(): Promise<void> {
		let nodeChange;
		const t = tree.getNodeType(openPage.id);
		let c = tree.getChanges();
		for (let n of c.nodes) {
			if (openPage.id === n.id) {
				nodeChange = n;
				break;
			}
		}
		try {
			let response;
			if (t === 's') {
				response = await fetch('/home/tree/actions/push_strategy_edit', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ strategyChange: nodeChange })
				});
			} else {
				response = await fetch('/home/tree/actions/push_problem_edit', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ problemChange: nodeChange })
				});
			}
			const result: any = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}

			tree.setChanges(result.newChanges);
			if (data.props)
				data.props.ownedIds = data.props?.ownedIds.filter((oid: any) => openPage.id !== oid);
			tree.setTree(result.newTree, tree.getChanges(), []);

			const newPageId = getPagePriorFromId(openPage.id)?.id;
			updateTreeFolder(newPageId);
			if (!newPageId) openFirstPage();

			processing = false;
			successPopUp = 'Success: ' + result.message;
		} catch (error: any) {
			processing = false;
			failurePopUp = 'Error: ' + error.message;
		}
	}

	function successWait() {
		setTimeout(() => (successPopUp = false), 4000);
		return true;
	}
	function faliureWait() {
		setTimeout(() => (failurePopUp = false), 4000);
		return true;
	}

	function updateTreeFolder(openPageId: string = openPage.id) {
		folderTree = [
			{
				title: 'Nodes',
				open: false,
				children: [
					{
						title: 'Published',
						open: false,
						children: [
							{ title: 'Strategies', open: false, children: [] },
							{ title: 'Problems', open: false, children: [] }
						]
					},
					{
						title: 'Unpublished',
						open: false,
						children: [
							{ title: 'Strategies', open: false, children: [] },
							{ title: 'Problems', open: false, children: [] }
						]
					},
					{ title: 'Archived', open: false, children: [] }
				]
			},
			{
				title: 'Edits',
				open: false,
				children: [
					{ title: 'Active', open: false, children: [] },
					{ title: 'Pending', open: false, children: [] },
					{
						title: 'History',
						open: false,
						children: [
							{ title: 'Aproved', open: false, children: [] },
							{ title: 'Denied', open: false, children: [] }
						]
					}
				]
			}
		];
		changes = tree.getChanges();
		changes.new.forEach((id) => {
			const newPage = {
				title: tree.getObjFromId(id).data.title,
				id
			};
			if (tree.getNodeType(id) === 's')
				folderTree[0].children[1].children[0].children.push(newPage);
			else folderTree[0].children[1].children[1].children.push(newPage);

			if (id === openPageId) openSelectPage(newPage);
		});
		const editedOwned: any = [];
		changes.nodes.forEach((n) => {
			if (changes.new.find((id) => id === n.id) === undefined) {
				let newPage;
				if (data?.props?.ownedIds.find((oid: any) => n.id === oid)) {
					editedOwned.push(n.id);
					newPage = {
						title: tree.getObjFromId(n.id).data.title,
						id: n.id,
						edited: true
					};
					if (tree.getNodeType(n.id) === 's')
						folderTree[0].children[0].children[0].children.push(newPage);
					else folderTree[0].children[0].children[1].children.push(newPage);
				} else {
					newPage = {
						title: tree.getObjFromId(n.id).data.title,
						id: n.id
					};
					folderTree[1].children[0].children.push(newPage);
				}
				if (n.id === openPageId) openSelectPage(newPage);
			}
		});
		data?.props?.ownedIds.forEach((id: any) => {
			if (!editedOwned.includes(id)) {
				const newPage = {
					title: tree.getObjFromId(id).data.title,
					id,
					edited: false
				};
				if (tree.getNodeType(id) === 's')
					folderTree[0].children[0].children[0].children.push(newPage);
				else folderTree[0].children[0].children[1].children.push(newPage);
				if (id === openPageId) openSelectPage(newPage);
			}
		});
		setTimeout(() => {
			updateArrows();
		}, 20);
	}
</script>

<div
	bind:this={container}
	class="relative h-[calc(100vh-40.3px)] w-full flex justify-center bg-[#151515] overflow-auto"
>
	{#if successPopUp && successWait()}
		<div
			in:fly={{ duration: 300, x: 0, y: 200, opacity: 0.5, easing: quintOut }}
			class="fixed left-0 bottom-[20px] w-[100vw] flex items-center justify-center"
		>
			<div class="flex bg-[#ffffff] py-[10px] rounded-[6px]" style="box-shadow: -4px 4px #4ad36c;">
				<p class="text-[#000000] mr-[20px] ml-[25px]">{successPopUp}</p>
				<button class="mr-[15px]" on:click={() => (successPopUp = false)}
					><Cross color="#70747c" size="16px" /></button
				>
			</div>
		</div>
	{/if}
	{#if failurePopUp && faliureWait()}
		<div
			in:fly={{ duration: 300, x: 0, y: 200, opacity: 0.5, easing: quintOut }}
			class="fixed left-0 bottom-[20px] w-[100vw] flex items-center justify-center"
		>
			<div class="flex bg-[#ffffff] py-[10px] rounded-[6px]" style="box-shadow: -4px 4px #be4141;">
				<p class="text-[#000000] mr-[20px] ml-[25px]">{failurePopUp}</p>
				<button class="mr-[15px]" on:click={() => (failurePopUp = false)}
					><Cross color="#70747c" size="16px" /></button
				>
			</div>
		</div>
	{/if}
	{#if open && trasitionDuration}
		<div
			style="left: calc(100vw - {containerWidth}px + 48px);"
			class="fixed top-[115px] flex flex-col text-[13px] text-[#dedede]"
		>
			{#if folderTreeOpen}
				<button
					class="mb-[8px]"
					on:click={() => {
						folderTreeOpen = false;
					}}><OpenFolder color="#9c9c9c" size="25px" /></button
				>
				{#each folderTree as folder}
					<button
						transition:slide|global={{ duration: trasitionDuration }}
						on:outroend={() => {
							setTimeout(() => {
								folderTreeOutro = true;
							}, 0);
						}}
						on:click={() => {
							folder.open = true;
							openFirstPage(folder.children);
							setTimeout(() => {
								updateArrows();
							}, 10);
						}}
						class="flex items-center pr-[10px] pl-[1px] rounded-[4px]"
					>
						<button
							bind:this={folder.div}
							class="arrow"
							on:click={(e) => {
								e.stopPropagation();
								folder.open = !folder.open;
								setTimeout(() => {
									updateArrows();
								}, 10);
							}}><FolderArrow color="#9c9c9c" size="15px" /></button
						>
						{folder.title}
					</button>
					{#if folder?.open}
						{#each folder.children as child1}
							{#if child1?.children?.length && (child1?.children[0]?.children?.length !== 0 || child1?.children[1]?.children?.length !== 0)}
								<button
									transition:slide|global={{ duration: trasitionDuration }}
									on:click={() => {
										child1.open = true;
										if (child1?.children[0]?.children?.length > 0) {
											child1.children[0].open = true;
											openPage = child1.children[0]?.children[0];
										} else if (child1?.children[1]?.children?.length > 0) {
											child1.children[1].open = true;
											openPage = child1.children[1]?.children[0];
										} else openPage = child1.children[0];
										setTimeout(() => {
											updateArrows();
										}, 10);
									}}
									class="flex items-center ml-[12px] pr-[10px] pl-[1px] rounded-[4px]"
								>
									<button
										bind:this={child1.div}
										class="arrow"
										on:click={(e) => {
											e.stopPropagation();
											child1.open = !child1.open;
											setTimeout(() => {
												updateArrows();
											}, 10);
										}}><FolderArrow color="#9c9c9c" size="15px" /></button
									>
									{child1.title}
								</button>
								{#if child1.open}
									{#each child1.children as child2}
										{#if child2?.children?.length}
											<button
												transition:slide|global={{ duration: trasitionDuration }}
												on:click={() => {
													child2.open = true;
													openPage = child2.children[0];
													child2.div.style.transform = `rotate(90deg)`;
												}}
												class="flex items-center ml-[24px] pr-[10px] pl-[1px] rounded-[4px]"
											>
												<button
													bind:this={child2.div}
													class="arrow"
													on:click={(e) => {
														e.stopPropagation();
														child2.open = !child2.open;
														if (child2.open) child2.div.style.transform = `rotate(90deg)`;
														else child2.div.style.transform = `rotate(0deg)`;
													}}><FolderArrow color="#9c9c9c" size="15px" /></button
												>
												{child2.title}
											</button>
											{#if child2.open}
												{#each child2.children as child3}
													<button
														transition:slide|global={{ duration: trasitionDuration }}
														on:click={() => {
															openPage = child3;
														}}
														class="flex items-center ml-[44px] pr-[10px] pl-[8px] rounded-[4px] {openPage ===
														child3
															? 'bg-[#222222]'
															: ''}"
													>
														{child3.title.length > 15
															? child3.title.substring(0, 15) + '...'
															: child3.title}
													</button>
												{/each}
											{/if}
										{:else if child2?.children?.length === 0}
											<div
												transition:slide|global={{ duration: 300 }}
												class="flex items-center ml-[24px] pr-[10px] pl-[16px] rounded-[4px] text-[#8d8d8d]"
											>
												{child2.title}
											</div>
										{:else}
											<button
												transition:slide|global={{ duration: trasitionDuration }}
												on:click={() => {
													openPage = child2;
												}}
												class="flex items-center ml-[32px] pr-[10px] pl-[8px] rounded-[4px] {openPage ===
												child2
													? 'bg-[#222222]'
													: ''}"
											>
												{child2.title.length > 15
													? child2.title.substring(0, 15) + '...'
													: child2.title}
											</button>
										{/if}
									{/each}
								{/if}
							{:else}
								<div
									transition:slide|global={{ duration: 300 }}
									class="flex items-center ml-[12px] pr-[10px] pl-[16px] rounded-[4px] text-[#8d8d8d]"
								>
									{child1.title}
								</div>
							{/if}
						{/each}
					{/if}
				{/each}
			{:else if folderTreeOutro}
				<button
					on:click={() => {
						folderTreeOpen = true;
						folderTreeOutro = false;
						setTimeout(() => {
							updateArrows();
						}, 10);
					}}><ClosedFolder color="#9c9c9c" size="24px" /></button
				>
			{/if}
		</div>
		<div
			class="w-[1000px] rounded-[40px] bg-[#232323] h-[2000px] flex flex-col mt-[55px] mb-[55px]"
			transition:slide|global={{ duration: trasitionDuration * 1.5 }}
		>
			{#if getGrandParentFolderFromPage(openPage)?.title === 'Published' && setPageTab('Edit')}
				<nav
					class="flex h-[50px] w-full pl-[60px] space-x-[20px] bg-[#1b1b1b] border-b-[.3px] border-b-[#53565c] rounded-t-[40px] items-end"
				>
					<div
						class="flex pb-[7px] {pageTab === 'Edit'
							? 'border-b-[#265bcd] border-b-[2px]'
							: 'border-b-[#1b1b1b] border-b-[2px]'}"
					>
						<button
							on:click={() => (pageTab = 'Edit')}
							class="tab flex items-center justify-center rounded-[4px] px-[7px] py-[2px] {pageTab ===
							'Edit'
								? 'font-[500]'
								: ''}"
						>
							<Edit size="18px" color="#70747c" />
							<p class="ml-[6px]">Edit</p>
						</button>
					</div>
					<div
						class="flex pb-[7px] {pageTab === 'Pull requests'
							? 'border-b-[#265bcd] border-b-[2px]'
							: 'border-b-[#1b1b1b] border-b-[2px]'}"
					>
						<button
							on:click={() => (pageTab = 'Pull requests')}
							class="tab flex items-center justify-center rounded-[4px] px-[7px] py-[2px] {pageTab ===
							'Pull requests'
								? 'font-[500]'
								: ''}"
						>
							<PullRequest size="18px" color="#70747c" />
							<p class="ml-[6px]">Pull requests</p>
						</button>
					</div>
					<div
						class="flex pb-[7px] relative {pageTab === 'Discussion'
							? 'border-b-[#265bcd] border-b-[2px]'
							: 'border-b-[#1b1b1b] border-b-[2px]'}"
					>
						<button
							on:click={() => (pageTab = 'Discussion')}
							class="tab flex items-center justify-center rounded-[4px] px-[7px] py-[2px] {pageTab ===
							'Discussion'
								? 'font-[500]'
								: ''}"
						>
							<div class="absolute left-[4px] top-[2px]">
								<Discussion size="25px" color="#70747c" />
							</div>
							<div class="size-[18px]" />
							<p class="ml-[6px]">Discussion</p>
						</button>
					</div>
					<div
						class="flex pb-[7px] {pageTab === 'Settings'
							? 'border-b-[#265bcd] border-b-[2px]'
							: 'border-b-[2px] border-b-[#1b1b1b]'}"
					>
						<button
							on:click={() => (pageTab = 'Settings')}
							class="tab flex items-center justify-center rounded-[4px] px-[7px] py-[2px] {pageTab ===
							'Settings'
								? 'font-[500]'
								: ''}"
						>
							<Settings size="18px" color="#70747c" />
							<p class="ml-[6px]">Settings</p>
						</button>
					</div>
				</nav>
				{#if getParentFolderFromPage(openPage)?.title === 'Strategies'}
					{#if pageTab === 'Edit'}
						<div class="mx-auto mt-[23px] relative">
							<button
								class="px-[10px] py-[5px] rounded-md {!openPage?.edited || processing
									? 'bg-[#363c74] text-[#ffffff65]'
									: 'bg-[#6976ff] hover:bg-[#9ba3ff]'}"
								disabled={!openPage?.edited || processing}
								on:click={() => {
									processing = true;
									tick().then(commitChangesToOwnedNode);
								}}
							>
								Commit Changes to {openPage?.title}
							</button>
							{#if processing}<div class="spinner absolute left-[-30px] top-[6px]" />{/if}
						</div>
					{:else if pageTab === 'Pull requests'}
						<textarea
							class="mx-auto mt-[23px] resize-none"
							value={'Co<strong>' + 'html' + '</strong>ng \n Soon!'}
							disabled={true}
						></textarea>
					{:else if pageTab === 'Discussion'}
						<p class="mx-auto mt-[23px]">Comming Soon!</p>
					{:else if pageTab === 'Settings'}
						<div class="mx-auto mt-[23px] relative">
							<button
								class="px-[10px] py-[5px] rounded-md {processing
									? 'bg-[#743636] text-[#ffffff65]'
									: 'bg-[#d55353] hover:bg-[#ff9b9b]'}"
								disabled={processing}
								on:click={() => {
									processing = true;
									tick().then(deleteStrategy);
								}}
							>
								Delete {openPage?.title}
							</button>
							{#if processing}<div class="spinner absolute left-[-30px] top-[6px]" />{/if}
						</div>
					{/if}
				{:else if getParentFolderFromPage(openPage)?.title === 'Problems'}
					{#if pageTab === 'Edit'}
						<div class="mx-auto mt-[23px] relative">
							<button
								class="px-[10px] py-[5px] rounded-md {!openPage?.edited || processing
									? 'bg-[#363c74] text-[#ffffff65]'
									: 'bg-[#6976ff] hover:bg-[#9ba3ff]'}"
								disabled={!openPage?.edited || processing}
								on:click={() => {
									processing = true;
									tick().then(commitChangesToOwnedNode);
								}}
							>
								Commit Changes to {openPage?.title}
							</button>
							{#if processing}<div class="spinner absolute left-[-30px] top-[6px]" />{/if}
						</div>
					{:else if pageTab === 'Pull requests'}
						<textarea
							class="mx-auto mt-[23px] resize-none"
							value={'Co<strong>' + 'html' + '</strong>ng \n Soon!'}
							disabled={true}
						></textarea>
					{:else if pageTab === 'Discussion'}
						<p class="mx-auto mt-[23px]">Comming Soon!</p>
					{:else if pageTab === 'Settings'}
						{#if openPage?.id !== 'r'}
							<div class="mx-auto mt-[23px] relative">
								<button
									class="px-[10px] py-[5px] rounded-md {processing
										? 'bg-[#743636] text-[#ffffff65]'
										: 'bg-[#d55353] hover:bg-[#ff9b9b]'}"
									disabled={processing}
									on:click={() => {
										processing = true;
										tick().then(deleteProblem);
									}}
								>
									Delete {openPage?.title}
								</button>
								{#if processing}<div class="spinner absolute left-[-30px] top-[6px]" />{/if}
							</div>
						{/if}
					{/if}
				{/if}
			{:else if getGrandParentFolderFromPage(openPage)?.title === 'Unpublished' && setPageTab('Edit')}
				<nav
					class="flex h-[50px] w-full pl-[60px] space-x-[20px] bg-[#1b1b1b] border-b-[.3px] border-b-[#53565c] rounded-t-[40px] items-end"
				>
					<div
						class="flex pb-[7px] {pageTab === 'Edit'
							? 'border-b-[#265bcd] border-b-[2px]'
							: 'border-b-[#1b1b1b] border-b-[2px]'}"
					>
						<button
							on:click={() => (pageTab = 'Edit')}
							class="tab flex items-center justify-center rounded-[4px] px-[7px] py-[2px] {pageTab ===
							'Edit'
								? 'font-[500]'
								: ''}"
						>
							<Edit size="18px" color="#70747c" />
							<p class="ml-[6px]">Edit</p>
						</button>
					</div>
					<div
						class="flex pb-[7px] {pageTab === 'Settings'
							? 'border-b-[#265bcd] border-b-[2px]'
							: 'border-b-[2px] border-b-[#1b1b1b]'}"
					>
						<button
							on:click={() => (pageTab = 'Settings')}
							class="tab flex items-center justify-center rounded-[4px] px-[7px] py-[2px] {pageTab ===
							'Settings'
								? 'font-[500]'
								: ''}"
						>
							<Settings size="18px" color="#70747c" />
							<p class="ml-[6px]">Settings</p>
						</button>
					</div>
				</nav>
				{#if getParentFolderFromPage(openPage)?.title === 'Strategies'}
					{#if pageTab === 'Edit'}
						<div class="mx-auto mt-[23px] relative flex flex-col">
							<button
								class="px-[10px] py-[5px] rounded-md {processing
									? 'bg-[#363c74] text-[#ffffff65]'
									: 'bg-[#6976ff] hover:bg-[#9ba3ff]'}"
								disabled={processing}
								on:click={() => {
									processing = true;
									if (subProblemsChecked) tick().then(publishStrategyWithSubProblems);
									else tick().then(publishStrategy);
								}}
							>
								Publish {openPage?.title}
							</button>
							{#if processing}<div class="spinner absolute left-[-30px] top-[6px]" />{/if}
							<label class="flex items-center text-[#bdbdbd] text-[13px] mt-[10px]"
								><input
									bind:checked={subProblemsChecked}
									type="checkbox"
									class="mr-[6px] size-[12px]"
								/>And its sub-problems</label
							>
						</div>
					{:else if pageTab === 'Settings'}
						<div class="mx-auto mt-[23px] relative">
							<button
								class="px-[10px] py-[5px] rounded-md {processing
									? 'bg-[#743636] text-[#ffffff65]'
									: 'bg-[#d55353] hover:bg-[#ff9b9b]'}"
								disabled={processing}
								on:click={() => {
									processing = true;
									tick().then(deleteStrategy);
								}}
							>
								Delete {openPage?.title}
							</button>
							{#if processing}<div class="spinner absolute left-[-30px] top-[6px]" />{/if}
						</div>
					{/if}
				{:else if getParentFolderFromPage(openPage)?.title === 'Problems'}
					{#if pageTab === 'Edit'}
						<div class="mx-auto mt-[23px] relative">
							<button
								class="px-[10px] py-[5px] rounded-md {processing
									? 'bg-[#363c74] text-[#ffffff65]'
									: 'bg-[#6976ff] hover:bg-[#9ba3ff]'}"
								disabled={processing}
								on:click={() => {
									processing = true;
									tick().then(publishProblem);
								}}
							>
								Publish {openPage?.title}
							</button>
							{#if processing}<div class="spinner absolute left-[-30px] top-[6px]" />{/if}
						</div>
					{:else if pageTab === 'Settings'}
						<div class="mx-auto mt-[23px] relative">
							<button
								class="px-[10px] py-[5px] rounded-md {processing
									? 'bg-[#743636] text-[#ffffff65]'
									: 'bg-[#d55353] hover:bg-[#ff9b9b]'}"
								disabled={processing}
								on:click={() => {
									processing = true;
									tick().then(deleteProblem);
								}}
							>
								Delete {openPage?.title}
							</button>
							{#if processing}<div class="spinner absolute left-[-30px] top-[6px]" />{/if}
						</div>
					{/if}
				{/if}
			{:else if getParentFolderFromPage(openPage)?.title === 'Active' && setPageTab('Edit')}
				<nav
					class="flex h-[50px] w-full pl-[60px] space-x-[20px] bg-[#1b1b1b] border-b-[.3px] border-b-[#53565c] rounded-t-[40px] items-end"
				>
					<div
						class="flex pb-[7px] {pageTab === 'Edit'
							? 'border-b-[#265bcd] border-b-[2px]'
							: 'border-b-[#1b1b1b] border-b-[2px]'}"
					>
						<button
							on:click={() => (pageTab = 'Edit')}
							class="tab flex items-center justify-center rounded-[4px] px-[7px] py-[2px] {pageTab ===
							'Edit'
								? 'font-[500]'
								: ''}"
						>
							<Edit size="18px" color="#70747c" />
							<p class="ml-[6px]">Edit</p>
						</button>
					</div>
				</nav>
				{#if pageTab === 'Edit'}
					<button
						class="px-[10px] py-[5px] rounded-md bg-[#6976ff] mx-auto mt-[23px] hover:bg-[#9ba3ff]"
						on:click={pushEditsToOwner}
					>
						Push your edits of {openPage?.title} to owner/s
					</button>
				{/if}
			{/if}
		</div>
	{:else}
		<p class="my-auto">You have not made any edits yet</p>
	{/if}
</div>

<style>
	.arrow {
		transition: transform 300ms ease-out;
	}
	.tab {
		background-color: inherit;
		transition: background-color 0.1s ease-in-out;
	}

	.tab:hover {
		background-color: #2c2c2c;
	}

	.spinner {
		border: 1.5px solid #232323;
		border-top: 1.5px solid #3498db;
		border-radius: 50%;
		width: 22px;
		height: 22px;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
