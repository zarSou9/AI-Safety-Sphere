<script lang="ts">
	import { onMount, onDestroy, tick, getContext } from 'svelte';
	import Edit from '$lib/icons/Edit.svelte';
	import View from '$lib/icons/View.svelte';
	import type { TreeInterface } from '$lib/types/nodes';
	import { get, type Writable } from 'svelte/store';
	import type { PageData } from '../$types';
	import Plus from '$lib/icons/Plus.svelte';
	import Linked from '$lib/icons/Linked.svelte';
	import { v4 as uuidv4 } from 'uuid';

	const tree: TreeInterface = getContext('tree');
	const charPos: { v: number } = getContext('charPos');
	const titleModal: Writable<{
		visible: boolean;
		title: string;
	}> = getContext('titleModalStore');
	const sectionTitleModal: Writable<{
		visible: boolean;
		title: string;
		i: number;
	}> = getContext('sectionTitleModalStore');
	const sectionModal: Writable<{
		visible: boolean;
		title: string;
		suggestions: any;
		sections: any;
		after: number;
	}> = getContext('sectionModalStore');
	const viewingNode: Writable<any> = getContext('viewingNodeStore');
	const nodeAction: Writable<string | null> = getContext('nodeActionStore');
	const canvasAction: Writable<string | null> = getContext('canvasActionStore');
	const shortCutsEnabled: any = getContext('shortCutsEnabledStore');
	const treeAction: Writable<string | null> = getContext('treeActionStore');
	const viewPort: { height: number; top: number } = getContext('viewPort');
	const data: PageData = getContext('data');
	const quillsReady: Writable<boolean> = getContext('quillsReadyStore');
	const toolBarShown: Writable<boolean> = getContext('toolBarShownStore');
	const toolBarDotsShown: Writable<boolean> = getContext('toolBarDotsShownStore');
	const bolded: Writable<boolean> = getContext('boldedStore');
	const italicized: Writable<boolean> = getContext('italicizedStore');
	const successPopUp: Writable<any> = getContext('successPopUpStore');
	const failurePopUp: Writable<any> = getContext('failurePopUpStore');
	const sectionContextE: Writable<any> = getContext('sectionContextEStore');
	const nodeToRemove: Writable<any> = getContext('nodeToRemoveStore');
	const newProblemTitleModal: Writable<any> = getContext('newProblemTitleModalStore');
	const redoTree: Writable<boolean> = getContext('redoTreeStore');
	const processing: Writable<boolean> = getContext('processingStore');
	const loginNotif: Writable<any> = getContext('loginNotifStore');

	export let treeData: any;
	export let referenced: any;

	let children = treeData.problems;

	let sections: any = [
		{
			title: 'TL;DR',
			id: uuidv4(),
			editor: undefined,
			base: undefined,
			quill: undefined,
			eventFunction: undefined
		}
	];

	let deleteI = 1;

	let Quill: any;
	let Delta: any;

	let out = false;
	let pos = 0;
	let outPos = 0;
	let outChar = '';
	let editIconActive = false;
	let editable = false;
	let title: string;
	let isSaving = false;
	let posting = false;
	let saved = true;
	let sectionsReady = false;
	let nodeReady = false;
	let savingTimeout: any;
	let escBtn = false;

	let nodeActionUnsubscribe: any;
	let editBtnActive = true;
	let currentUser = null;
	let strategyChannel: any = undefined;

	let sessionTimeout: any;

	let userColor: string;
	let username = data.props?.profile?.username;
	if (treeData.owners.includes(username)) {
		userColor = 'owner';
	}

	let currentQuill: any;
	let currentEditor: any;
	let base: any;
	let currentSection: string = 'TL;DR';

	const quillOptions: any = {
		theme: 'bubble',
		modules: {
			toolbar: false
		},
		placeholder: 'Write here...'
	};
	const TldrQuillOptions: any = {
		theme: 'bubble',
		modules: {
			toolbar: false
		},
		placeholder: 'Write here...'
	};

	function quillEvent(
		title: string,
		quill: any,
		editor: any,
		eventName: any,
		range: any,
		oldQuill: any,
		source: any
	) {
		if (quill.hasFocus() && source === 'user') {
			const sect = sections.find((s: any) => s.title === title);
			if (currentQuill !== quill) {
				switchCurrent(sect);
			}
			if (eventName === 'selection-change') {
				if (source === 'user') {
					const format = quill.getFormat();
					if (format?.bold) bolded.set(true);
					else bolded.set(false);
					if (format?.italic) italicized.set(true);
					else italicized.set(false);

					const pos =
						currentEditor.getBoundingClientRect().top +
						quill.getBounds(range.index + range.length).bottom;
					if (pos > viewPort.height) {
						canvasAction.set('move-page-up');
					}
				}
			} else if (eventName === 'text-change') {
				if (title === 'TL;DR' && quill.getText().split('\n').length > 14) {
					quill.setContents(oldQuill);
					failurePopUp.set('The TL;DR section is limited to 12 lines');
					setTimeout(() => quill.blur(), 10);
				} else {
					saved = false;
					sect.base.ops = quill.getContents().ops;
				}
				treeAction.set('calibrate-node-height');
			}
		}
	}

	onMount(async () => {
		const { default: QuillImport } = await import('quill');
		Quill = QuillImport;
		Delta = Quill.import('delta');
		const Parchment = Quill.import('parchment');

		const Block = Quill.import('blots/block');
		const Break = Quill.import('blots/break');
		const Container = Quill.import('blots/container');
		const Cursor = Quill.import('blots/cursor');
		const Inline = Quill.import('blots/inline');
		const Scroll = Quill.import('blots/scroll');
		const Text = Quill.import('blots/text');

		const Bold = Quill.import('formats/bold');
		const Color = Quill.import('formats/color');
		const Code = Quill.import('formats/code');
		const Italic = Quill.import('formats/italic');
		const Link = Quill.import('formats/link');
		const Strike = Quill.import('formats/strike');
		const Script = Quill.import('formats/script');
		const Underline = Quill.import('formats/underline');

		const List = Quill.import('formats/list');

		const Qregistry = new Parchment.Registry();
		const registry = new Parchment.Registry();
		registry.register(
			Scroll,
			Block,
			Break,
			Container,
			Cursor,
			Inline,
			Text,
			Bold,
			Italic,
			Color,
			Script,
			Strike,
			Underline,
			Code,
			Link,
			List
		);
		Qregistry.register(
			Scroll,
			Block,
			Break,
			Container,
			Cursor,
			Inline,
			Text,
			Bold,
			Italic,
			Color,
			Script,
			Strike,
			Underline,
			Code,
			Link,
			List
		);
		TldrQuillOptions.registry = Qregistry;
		quillOptions.registry = registry;

		sections[0].quill = new Quill(sections[0].editor, TldrQuillOptions);

		title = treeData.data.title;
		base = new Delta(treeData.data.tldr);
		currentQuill = sections[0].quill;
		currentQuill.setContents(base);

		enableQuills(false);

		if (treeData.id === 'r') {
			setTimeout(() => {
				quillsReady.set(true);
			}, 100);
		}
	});
	onDestroy(() => {
		window.removeEventListener('keydown', handleKeyDown);
		if (strategyChannel) data.supabase.removeChannel(strategyChannel);
		strategyChannel = undefined;

		for (let section of sections) {
			section.quill.off('editor-change', section.eventFunction);
		}

		if (nodeActionUnsubscribe) nodeActionUnsubscribe();
	});

	function enableQuills(enabled: boolean) {
		for (let section of sections) {
			section.quill.enable(enabled);
		}
	}
	function escapeNode() {
		escBtn = false;
		editBtnActive = true;
		clearTimeout(sessionTimeout);
		if (strategyChannel) data.supabase.removeChannel(strategyChannel);
		strategyChannel = undefined;
		window.removeEventListener('keydown', handleKeyDown);
		out = false;
		save(true);
		isSaving = false;
		sectionsReady = false;
		nodeReady = false;
		enableQuills(false);
		if (editable) unactivateUser();
		toolBarShown.set(false);
		toolBarDotsShown.set(false);
		editable = false;
		editIconActive = false;
		canvasAction.set('zoom-out-from-node');
	}
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			escapeNode();
		} else if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			save();
		}
		if (out) {
			if (e.key.length === 1 && /[0-9a-zA-Z!@#$%^&*() ]/.test(e.key)) {
				outChar = e.shiftKey ? e.key.toUpperCase() : e.key;
			} else {
				outChar = '';
			}
			const charTemp = currentEditor.getBoundingClientRect().top + outPos;
			charPos.v = charTemp;
			canvasAction.set('return-to-caret');
		}
	}
	function startListening() {
		nodeActionUnsubscribe = nodeAction.subscribe((action) => {
			if (action) {
				if (action === 'handle-caret-out-of-view') {
					if (editable && currentQuill) {
						if (!out && currentQuill.hasFocus()) {
							pos =
								currentEditor.getBoundingClientRect().top +
								currentQuill.getBounds(
									currentQuill.getSelection().index + currentQuill.getSelection().length
								).top;
						} else {
							pos = currentEditor.getBoundingClientRect().top + outPos;
						}
						if ((pos > viewPort.height || pos < viewPort.top) && !out && currentQuill.hasFocus()) {
							outPos = currentQuill.getBounds(
								currentQuill.getSelection().index + currentQuill.getSelection().length
							).top;
							currentQuill.blur();
							out = true;
						} else if (pos < viewPort.height && pos > viewPort.top && out) {
							currentQuill.focus({ preventScroll: true });
							out = false;
						}
					}
				} else if (action === 'handle-char-back') {
					if (
						editable &&
						currentEditor.getBoundingClientRect().top + outPos < viewPort.height &&
						currentEditor.getBoundingClientRect().top + outPos > viewPort.top &&
						out
					) {
						currentQuill.focus({ preventScroll: true });
						currentQuill.insertText(currentQuill.getSelection().index, outChar, 'user');
						currentQuill.setSelection(currentQuill.getSelection().index + 1);
						out = false;
					}
				} else if (action === 'save-title') {
					title = get(titleModal).title;
					changeTitle(title as string);
				} else if (action === 'expand-node') {
					if (sectionsReady) {
						fillQuills();
					} else nodeReady = true;
				} else if (action === 'clean-up') {
					stopListening();
					$viewingNode = false;
					emptyQuills();
					$shortCutsEnabled = true;
				} else if (action === 'bold') {
					handleBold();
				} else if (action === 'italic') {
					handleItalic();
				} else if (action === 'save-new-section') {
					newSection($sectionModal.title, $sectionModal.after);
				} else if (action === 'start-new-section') {
					const newSects = [];
					for (let sect of sections) {
						newSects.push(sect.title);
					}
					$sectionModal.sections = newSects;
					$sectionModal.suggestions = ['Prerequisites', 'References'];
					$sectionModal.visible = true;
				} else if (action === 'save-section-title') {
					const store = get(sectionTitleModal);
					changeSectionTitle(store.i, store.title);
				} else if (action === 'delete-section') {
					deleteSection(deleteI);
				} else if (action === 'delete') {
					escapeNode();
					if (referenced.uuid) {
						setTimeout(() => {
							nodeToRemove.set({ uuid: referenced.uuid });
							treeAction.set('remove-linked-node');
						}, 300);
					} else {
						setTimeout(() => {
							nodeToRemove.set({ id: treeData.id, uuid: treeData.uuid });
							treeAction.set('remove-node');
						}, 300);
					}
				} else if (action === 'create-new-problem') {
					if ($newProblemTitleModal.title?.uuid) {
						publishLinkedProblem(treeData.id, treeData.uuid, $newProblemTitleModal.title);
					} else {
						publishProblem(treeData.id, treeData.uuid, $newProblemTitleModal.title);
					}
					redoTree.set(true);
					$newProblemTitleModal.title = '';
				}
				nodeAction.set(null);
			}
		});
	}
	function stopListening() {
		if (nodeActionUnsubscribe) nodeActionUnsubscribe();
		for (let section of sections) {
			section.quill.off('editor-change', section.eventFunction);
		}
	}

	async function fillQuills() {
		await tick();
		for (let section of sections) {
			section.quill = new Quill(section.editor, quillOptions);
			section.quill.enable(false);
			section.eventFunction = (eventName: any, range: any, oR: any, source: any) => {
				quillEvent(section.title, section.quill, section.editor, eventName, range, oR, source);
			};
			section.quill.setContents(section.base);
			section.quill.on('editor-change', section.eventFunction);
		}
		switchCurrent(sections[0]);
		window.addEventListener('keydown', handleKeyDown);
		treeAction.set('calibrate-node-height');
	}
	function updateQuillData(bases: any) {
		emptyQuills();
		sections[0].base = new Delta(bases[0]);
		bases.splice(0, 1);
		for (let b of bases) {
			sections.push({ base: new Delta(b.delta), title: b.title, history: [], id: uuidv4() });
		}
	}
	function switchCurrent(section: any) {
		currentQuill = section.quill;
		currentEditor = section?.editor;
		base = section.base;
		currentSection = section.title;
	}
	function loadData() {
		if (userColor === 'owner') {
			strategyChannel = data.supabase
				.channel('schema-db-changes')
				.on(
					'postgres_changes',
					{
						event: 'UPDATE',
						schema: 'public',
						table: 'Strategies',
						filter: `uuid=eq.${treeData.uuid}`
					},
					(payload) => {
						currentUser = payload.new.active_user;
						if (editable) {
							if (currentUser !== username) {
								isSaving = false;
								clearTimeout(savingTimeout);
								editable = false;
								enableQuills(false);
								editIconActive = true;
								toolBarShown.set(false);
								toolBarDotsShown.set(false);
								$titleModal.visible = false;
								$sectionModal.visible = false;
								$sectionTitleModal.visible = false;
								if (currentUser) {
									editBtnActive = false;
									const newE = payload.new.last_edit;
									const now = Date.now();
									clearTimeout(sessionTimeout);
									if (now - newE >= 100000) {
										editBtnActive = true;
									} else {
										sessionTimeout = setTimeout(
											() => {
												editBtnActive = true;
											},
											100000 - (now - newE)
										);
									}
								}
								failurePopUp.set('Session expired');
							}
						} else {
							if (currentUser === username || !currentUser) editBtnActive = true;
							else {
								editBtnActive = false;
								const oldE = payload.old.last_edit;
								const newE = payload.new.last_edit;
								if (oldE !== newE) {
									const now = Date.now();
									clearTimeout(sessionTimeout);
									if (now - newE >= 100000) {
										editBtnActive = true;
									} else {
										sessionTimeout = setTimeout(
											() => {
												editBtnActive = true;
											},
											100000 - (now - newE)
										);
									}
								}
							}
						}
					}
				)
				.subscribe();
		}
		data.supabase
			.from('Strategies')
			.select('*')
			.eq('uuid', treeData.uuid)
			.then(({ data: strategyData }) => {
				if (strategyData) {
					currentUser = strategyData[0].active_user;
					if (currentUser === username || !currentUser) editBtnActive = true;
					else {
						const now = Date.now();
						if (now - strategyData[0].last_edit >= 100000) editBtnActive = true;
						else {
							editBtnActive = false;
							clearTimeout(sessionTimeout);
							sessionTimeout = setTimeout(
								() => {
									editBtnActive = true;
								},
								100000 - (now - strategyData[0].last_edit)
							);
						}
					}
					const bases = JSON.parse(
						JSON.stringify([strategyData[0].tldr, ...strategyData[0].content])
					);
					updateQuillData(bases);
					if (nodeReady) {
						fillQuills();
					} else sectionsReady = true;
				}
			});
	}

	function emptyQuills() {
		sections = [sections[0]];
	}
	function handleBold() {
		if (currentQuill.getFormat()?.bold) {
			currentQuill.format('bold', null, 'user');
			bolded.set(false);
		} else {
			currentQuill.format('bold', true, 'user');
			bolded.set(true);
		}
	}
	function handleItalic() {
		if (currentQuill.getFormat()?.italic) {
			currentQuill.format('italic', null, 'user');
			italicized.set(false);
		} else {
			currentQuill.format('italic', true, 'user');
			italicized.set(true);
		}
	}
	function endNote() {
		const i = currentQuill.getSelection().index;
		if (i) {
			currentQuill.updateContents(
				{
					ops: [
						{ retain: i },
						{
							insert: '[3]',
							attributes: {
								script: 'super'
							}
						}
					]
				},
				'user'
			);
		} else {
			currentQuill.updateContents(
				{
					ops: [
						{
							insert: '[3]',
							attributes: {
								script: 'super'
							}
						}
					]
				},
				'user'
			);
		}
	}

	function saving(start: boolean = false) {
		if (start) isSaving = true;
		if (isSaving) {
			save();
			savingTimeout = setTimeout(saving, 1600);
		}
	}
	function save(closing = false) {
		if (!saved && !posting && userColor === 'owner') {
			pushToStrategyEdit({
				id: treeData.id,
				uuid: treeData.uuid,
				base,
				section: currentSection,
				userId: data.session?.user.id,
				location: 'Strategies'
			});
			saved = true;
		}

		if (closing) {
			const treeDataTemp = tree.getObjFromId(treeData.id, treeData.uuid).data;
			treeDataTemp.title = title;
			treeDataTemp.tldr = sections[0].quill.getContents();
		}
	}
	async function pushToStrategyEdit(d: any): Promise<void> {
		if (posting) await waitForServer();
		posting = true;
		try {
			const response = await fetch('/home/tree/actions/push_edit', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(d)
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
		} catch (error: any) {
			failurePopUp.set('Error: ' + error.message);
		}
		posting = false;
	}
	async function changeTitle(newTitle: string): Promise<void> {
		if (posting) await waitForServer();
		posting = true;
		try {
			const response = await fetch('/home/tree/actions/change_strategy_title', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id: treeData.id,
					uuid: treeData.uuid,
					newTitle,
					userId: data.session?.user.id
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
		} catch (error: any) {
			failurePopUp.set('Error: ' + error.message);
		}
		posting = false;
	}
	async function newSection(sectionTitle: string, after: number): Promise<void> {
		if (sections.find((s: any) => s.title === sectionTitle)) {
			failurePopUp.set('Error: Sections must be unique!');
			return;
		}
		if (posting) await waitForServer();
		posting = true;
		sections.splice(after + 1, 0, {
			title: sectionTitle,
			id: uuidv4(),
			editor: undefined,
			base: new Delta(),
			quill: undefined,
			eventFunction: undefined
		});
		sections = sections;
		tick().then(() => {
			const section = sections[after + 1];
			section.quill = new Quill(section.editor, quillOptions);
			section.eventFunction = (eventName: any, range: any, oR: any, source: any) => {
				quillEvent(section.title, section.quill, section.editor, eventName, range, oR, source);
			};
			section.quill.setContents(section.base);
			section.quill.on('editor-change', section.eventFunction);
			sections = sections;
		});
		try {
			const response = await fetch('/home/tree/actions/new_section_strategy', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id: treeData.id,
					uuid: treeData.uuid,
					sectionTitle,
					after,
					userId: data.session?.user.id
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
		} catch (error: any) {
			sections = [...sections.slice(0, after + 1), ...sections.slice(after + 2)];
			failurePopUp.set('Error: ' + error.message);
		}
		posting = false;
	}
	async function changeSectionTitle(i: number, sectionTitle: string) {
		if (sections[i].title === sectionTitle) return;
		if (sections.find((s: any) => s.title === sectionTitle)) {
			failurePopUp.set('Error: Sections must be unique!');
			return;
		}
		if (posting) await waitForServer();
		posting = true;
		const prevTitle = sections[i].title;
		sections[i].title = sectionTitle;
		try {
			const response = await fetch('/home/tree/actions/change_section_title_strategy', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id: treeData.id,
					uuid: treeData.uuid,
					i,
					sectionTitle,
					userId: data.session?.user.id
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
		} catch (error: any) {
			sections[i].title = prevTitle;
			failurePopUp.set('Error: ' + error.message);
		}
		posting = false;
	}
	async function deleteSection(i: number) {
		if (posting) await waitForServer();
		posting = true;
		const prevSect = sections[i];
		sections = [...sections.slice(0, i), ...sections.slice(i + 1)];
		try {
			const response = await fetch('/home/tree/actions/delete_section_strategy', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id: treeData.id,
					uuid: treeData.uuid,
					i,
					userId: data.session?.user.id
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
		} catch (error: any) {
			sections.splice(i, 0, prevSect);
			sections = [...sections];
			failurePopUp.set('Error: ' + error.message);
		}
		posting = false;
	}
	async function publishProblem(stratId: string, stratUUID: string, title: string): Promise<void> {
		$processing = true;
		try {
			const response = await fetch('/home/tree/actions/publish_problem', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ stratId, stratUUID, title, userId: data.session?.user.id })
			});

			const result: any = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
			tree.setClientTree(result.data.tree, tree.getSelections());
			treeData = tree.getObjFromId(treeData.id, treeData.uuid);
			children = treeData.problems;
			$processing = false;
		} catch (error: any) {
			$processing = false;
			failurePopUp.set('Error: ' + error.message);
		}
	}
	async function publishLinkedProblem(stratId: string, stratUUID: string, p: any): Promise<void> {
		$processing = true;
		try {
			const response = await fetch('/home/tree/actions/publish_linked_problem', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ stratId, stratUUID, p, userId: data.session?.user.id })
			});

			const result: any = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
			tree.setClientTree(result.data.tree, tree.getSelections());
			treeData = tree.getObjFromId(undefined, treeData.uuid);
			children = treeData.problems;
			$processing = false;
		} catch (error: any) {
			$processing = false;
			failurePopUp.set('Error: ' + error.message);
		}
	}
	async function activateUser() {
		if (posting) await waitForServer();
		posting = true;
		try {
			const response = await fetch('/home/tree/actions/activate_user', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id: treeData.id,
					userId: data.session?.user.id,
					uuid: treeData.uuid,
					nodeType: false
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
		} catch (error: any) {
			failurePopUp.set('Error: ' + error.message);
			throw error;
		} finally {
			posting = false;
		}
	}
	async function unactivateUser() {
		if (posting) await waitForServer();
		posting = true;
		try {
			const response = await fetch('/home/tree/actions/unactivate_user', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id: treeData.id,
					userId: data.session?.user.id,
					uuid: treeData.uuid,
					nodeType: false
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
		} catch (error: any) {
			failurePopUp.set('Error: ' + error.message);
		} finally {
			posting = false;
		}
	}
	function waitForServer() {
		return new Promise<void>((resolve, reject) => {
			const intervalId = setInterval(() => {
				if (!posting) {
					clearInterval(intervalId);
					resolve();
				}
			}, 50);
			setTimeout(() => {
				clearInterval(intervalId);
				reject(new Error('Condition not met within time limit'));
			}, 4000);
		});
	}

	function changeEditable() {
		if (!$viewingNode) {
			editBtnActive = false;
			loadData();
			$shortCutsEnabled = false;
			if (userColor === 'owner') editIconActive = true;
			if (referenced.uuid) $viewingNode = referenced.id;
			else $viewingNode = treeData.id;
			children = treeData.problems;
			startListening();
			treeAction.set('find-node-position');
			escBtn = true;
		} else if (userColor === 'owner') {
			if (editable) {
				editBtnActive = false;
				isSaving = false;
				clearTimeout(savingTimeout);
				editable = false;
				enableQuills(false);
				editIconActive = true;
				toolBarShown.set(false);
				toolBarDotsShown.set(false);
				unactivateUser().then(() => {
					editBtnActive = true;
				});
			} else {
				$processing = true;
				editIconActive = false;
				editBtnActive = false;
				data.supabase
					.from('Strategies')
					.select('*')
					.eq('uuid', treeData.uuid)
					.then(({ data: strategyData }) => {
						if (strategyData) {
							const bases = JSON.parse(
								JSON.stringify([strategyData[0].tldr, ...strategyData[0].content])
							);
							updateQuillData(bases);
							fillQuills().then(() => {
								activateUser().then(
									() => {
										saving(true);
										enableQuills(true);
										editable = true;
										toolBarShown.set(true);
										if (userColor === 'owner') {
											toolBarDotsShown.set(true);
										}
										editBtnActive = true;
										$processing = false;
									},
									() => {
										editIconActive = true;
										$processing = false;
									}
								);
							});
						}
					});
			}
		} else {
			if (!$loginNotif) $loginNotif = true;
		}
	}
	function editTitle() {
		if (editable && userColor === 'owner') {
			$titleModal.title = title;
			$titleModal.visible = true;
		}
	}
	function editSectionTitle(i: number, currentTitle: string) {
		if (i && editable && userColor === 'owner') {
			$sectionTitleModal.title = currentTitle;
			$sectionTitleModal.i = i;
			$sectionTitleModal.visible = true;
		}
	}
	function handleSectionTitleContext(e: any, i: any) {
		if (i && editable && userColor === 'owner') {
			e.preventDefault();
			deleteI = i;
			sectionContextE.set(e);
			canvasAction.set('handle-section-context');
		}
	}
</script>

<div
	class="grid bg-[#1f1f1f] rounded-[20px] w-[800px] p-[60px] relative selection:bg-[#6a87b389]"
	style="box-shadow: -2px 2px #3b753c;"
>
	{#if escBtn}
		<button
			on:click={escapeNode}
			class="absolute top-[14px] left-[15px] h-[17px] w-[40px] rounded-full border-[#595959] border-[1px] hover:bg-[#292929]"
		>
			<code class="absolute top-[-5px] left-[10px] text-[10px] text-[#595959]">esc</code>
		</button>
	{/if}
	<button
		on:click={changeEditable}
		disabled={!editBtnActive}
		class="absolute top-[55px] right-[65px] rounded-md w-[36px] h-[36px] items-center justify-center {editBtnActive
			? 'hover:bg-[#4949495a]'
			: ''}"
	>
		{#if editIconActive}
			<Edit color={editBtnActive ? '#9c9c9c' : '#595959'} size="36px" />
		{:else}
			<View color={editBtnActive ? '#9c9c9c' : '#595959'} size="36px" />
		{/if}
	</button>
	<p class="ml-[14px] mr-[50px] title mb-[25px] relative" on:dblclick={editTitle}>
		{title || 'untitled'}
		{#if referenced.uuid}
			<div class="absolute left-[-9px] top-[-11px]" title="This is a linked strategy">
				<Linked color="#9c9c9c" size="12px" />
			</div>
		{/if}
	</p>
	{#each sections as section, i (section.id)}
		<div class="relative">
			<p
				class="ml-[14px] mt-[10px] sub-header-text"
				on:dblclick={() => {
					editSectionTitle(i, section.title);
				}}
				on:contextmenu={(e) => {
					handleSectionTitleContext(e, i);
				}}
			>
				{section.title}:
			</p>
			<div class="mt-[5px] mb-[5px] overflow-hidden w-[670px]">
				<div bind:this={section.editor} />
			</div>
		</div>
	{/each}
	{#if editable && userColor === 'owner'}
		<div class="absolute bottom-[-30px] left-0 right-0 flex">
			<div class="mr-auto" />
			{#each children as problem}
				<p class="text-[12px] underline text-[#c5c5c5] mx-auto">
					{problem?.referenced
						? tree.getObjFromId(undefined, problem.referenced).data.title
						: problem.data.title}
				</p>
			{/each}
			<div class="ml-auto" />
		</div>
		<button
			on:click={() => {
				if (children.length < 8) {
					$newProblemTitleModal.s = { id: treeData.id, uuid: treeData.uuid };
					$newProblemTitleModal.visible = true;
				} else failurePopUp.set('Strategies have a maximum of 8 subproblems');
			}}
			class="absolute bottom-[-26px] right-[20px]"><Plus color="#c5c5c5" size="15px"></Plus></button
		>
	{/if}
</div>

<style>
	@import 'https://cdn.quilljs.com/1.3.6/quill.bubble.css';
	.title {
		font-weight: 500;
		font-size: 35px;
	}
	.sub-header-text {
		font-weight: 400;
		font-size: 22px;
	}
</style>
