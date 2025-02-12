<script lang="ts">
	import { onMount, onDestroy, tick, getContext } from 'svelte';
	import type { TreeInterface, TreeNode, EditPermissionsStore } from '$lib/types';
	import { get, type Writable } from 'svelte/store';
	import type { PageData } from '../$types';
	import { v4 as uuidv4 } from 'uuid';

	import Edit from '$lib/icons/Edit.svelte';
	import View from '$lib/icons/View.svelte';
	import Info from '$lib/icons/Info.svelte';
	import FadeElement from '$lib/components/FadeElement.svelte';

	const tree: TreeInterface = getContext('tree');
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
	const toolBarDefault: Writable<boolean> = getContext('toolBarDefaultStore');
	const toolBarForOwner: Writable<boolean> = getContext('toolBarForOwnerStore');
	const successPopUp: Writable<any> = getContext('successPopUpStore');
	const failurePopUp: Writable<any> = getContext('failurePopUpStore');
	const sectionContextE: Writable<any> = getContext('sectionContextEStore');
	const nodeToRemove: Writable<any> = getContext('nodeToRemoveStore');
	const processing: Writable<boolean> = getContext('processingStore');
	const loginNotif: Writable<any> = getContext('loginNotifStore');
	const bolded: Writable<boolean | null | undefined> = getContext('boldedStore');
	const italicized: Writable<boolean | null | undefined> = getContext('italicizedStore');
	const underlined: Writable<boolean | null | undefined> = getContext('underlinedStore');
	const striked: Writable<boolean | null | undefined> = getContext('strikedStore');
	const scripted: Writable<string | boolean | null | undefined> = getContext('scriptedStore');
	const quoted: Writable<boolean | null | undefined> = getContext('quotedStore');
	const aligned: Writable<string | boolean | null | undefined> = getContext('alignedStore');
	const linkInput: Writable<any> = getContext('linkInputStore');
	const editPermissions: EditPermissionsStore = getContext('editPermissionsStore');
	const learnMore: Writable<boolean> = getContext('learnMoreStore');
	const pageOffset: Writable<number | undefined> = getContext('pageOffsetStore');

	export let treeData: TreeNode;
	export let shadowColor: string;

	let sections: any = [
		{
			title: 'Inferential Step',
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

	let editIconActive = false;
	let editable = false;
	let title: string | undefined;
	let isSaving = false;
	let posting = false;
	let saved = true;
	let sectionsReady = false;
	let nodeReady = false;
	let savingTimeout: any;

	let nodeActionUnsubscribe: any;
	let editBtnActive = true;
	let currentUser: any = null;
	let nodeChannel: any = undefined;
	let linkRange: any;
	let moved = false;
	let unactivatingUser = false;

	let sessionTimeout: any;
	let escBtn = false;

	let canEdit = false;
	let isOwner = false;
	let username = data.props?.profile?.username;
	if (treeData?.owners?.includes(username)) {
		canEdit = true;
		isOwner = true;
	} else if (treeData?.members?.includes(username) && treeData.memberPermissions === 'Can edit') {
		canEdit = true;
	}

	let currentQuill: any;
	let currentEditor: any;
	let base: any;
	let currentSection: string = 'Inferential Step';

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
		if (editable) {
			const sect = sections.find((s: any) => s.title === title);
			if (currentQuill !== quill) {
				switchCurrent(sect);
			}
			if (eventName === 'selection-change') {
				if (quill.hasFocus()) updateTools(quill?.getFormat());
				else updateTools(undefined);
			} else if (eventName === 'text-change') {
				if (source !== 'api' && !(range.ops[1]?.delete || range.ops[0]?.delete)) {
					const delta = range;
					let length = 0;
					if (delta.ops[0]?.retain) {
						const test = new Delta(delta.ops.slice(1));
						length = test.length();
					} else {
						length = delta.length();
					}
					const pos =
						currentEditor.getBoundingClientRect().top +
						quill.getBounds((delta.ops[0]?.retain ?? 0) + length).bottom;

					$pageOffset = pos - viewPort.height - 64;
					if ($pageOffset > 0) {
						canvasAction.set('move-page-up');
					} else if ($pageOffset + viewPort.height < 0) {
						$pageOffset += viewPort.height;
						canvasAction.set('move-page-down');
					}
				}
				saved = false;
				sect.base.ops = oldQuill.compose(range).ops;
				treeAction.set('calibrate-node-height');
			}
		}
	}
	function updateTools(f: any) {
		$bolded = f?.bold;
		$italicized = f?.italic;
		$underlined = f?.underline;
		$striked = f?.strike;
		$scripted = f?.script;
		$quoted = f?.blockquote;
		$aligned = f?.align;
	}

	onMount(async () => {
		const { default: QuillImport } = await import('quill');
		Quill = QuillImport;
		Delta = Quill.import('delta');
		const Parchment = Quill.import('parchment');

		const Block = Quill.import('blots/block');
		const Break = Quill.import('blots/break');
		const Container: any = Quill.import('blots/container');
		const Cursor = Quill.import('blots/cursor');
		const Inline = Quill.import('blots/inline');
		const Scroll = Quill.import('blots/scroll');
		const Text = Quill.import('blots/text');

		const Bold = Quill.import('formats/bold');
		const Color = Quill.import('formats/color');
		const Font = Quill.import('formats/font');
		const Code = Quill.import('formats/code');
		const Italic = Quill.import('formats/italic');
		const Link = Quill.import('formats/link');
		const Strike = Quill.import('formats/strike');
		const Script = Quill.import('formats/script');
		const Underline = Quill.import('formats/underline');

		const Blockquote = Quill.import('formats/blockquote');
		const Indent = Quill.import('formats/indent');
		const List: any = Quill.import('formats/list');
		const Align = Quill.import('formats/align');

		const Image = Quill.import('formats/image');
		const Video = Quill.import('formats/video');
		const Formula = Quill.import('formats/formula');

		class ListItem extends List {}
		ListItem.blotName = 'list';
		ListItem.tagName = 'LI';

		class ListContainer extends Container {}
		ListContainer.tagName = 'OL';
		ListContainer.blotName = 'list-container';
		ListContainer.allowedChildren = [ListItem];

		ListItem.requiredContainer = ListContainer;

		const Qregistry = new Parchment.Registry();
		const registry = new Parchment.Registry();
		registry.register(
			Block,
			Break,
			Container,
			Cursor,
			Inline,
			Scroll,
			Text,
			Bold,
			Italic,
			Color,
			Script,
			Strike,
			Underline,
			Code,
			Link,
			ListContainer,
			ListItem,
			Font,
			Blockquote,
			Indent,
			Align,
			Image,
			Video,
			Formula
		);
		Qregistry.register(
			Block,
			Break,
			Container,
			Cursor,
			Inline,
			Scroll,
			Text,
			Bold,
			Italic,
			Color,
			Script,
			Strike,
			Underline,
			Code,
			Link,
			ListContainer,
			ListItem,
			Font,
			Blockquote,
			Indent,
			Formula
		);
		TldrQuillOptions.registry = Qregistry;
		quillOptions.registry = registry;

		sections[0].title = treeData.data.tldr_title;
		sections[0].quill = new Quill(sections[0].editor, TldrQuillOptions);
		sections[0].base = new Delta(treeData?.data.tldr);

		title = treeData?.data.title;
		base = sections[0].base;
		currentQuill = sections[0].quill;
		currentQuill.setContents(base);

		enableQuills(false);

		if (tree.getTree()?.node.uuid === treeData?.uuid) {
			setTimeout(() => {
				quillsReady.set(true);
			}, 100);
		}
		if (treeData?.uuid === '804b7c8a-fb57-434e-bb82-36a8e71c63a2') {
			learnMore.subscribe((v) => {
				if (v) {
					openNode();
					learnMore.set(false);
				}
			});
		}
	});
	onDestroy(() => {
		window.removeEventListener('keydown', handleKeyDown);
		if (nodeChannel) data.supabase.removeChannel(nodeChannel);
		nodeChannel = undefined;

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
		if (nodeChannel) data.supabase.removeChannel(nodeChannel);
		nodeChannel = undefined;
		window.removeEventListener('keydown', handleKeyDown);
		save(true);
		isSaving = false;
		sectionsReady = false;
		nodeReady = false;
		enableQuills(false);
		if (editable) unactivateUser();
		toolBarDefault.set(false);
		toolBarForOwner.set(false);
		editable = false;
		editIconActive = false;
		canvasAction.set('zoom-out-from-node');
	}
	function handleKeyDown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && currentQuill.hasFocus()) updateTools(currentQuill.getFormat());
		if (e.key === 'Escape') {
			e.preventDefault();
			escapeNode();
		} else if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			save();
		}
	}
	function startListening() {
		nodeActionUnsubscribe = nodeAction.subscribe((action) => {
			if (action) {
				if (action === 'save-title') {
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
				} else if (action === 'save-new-section') {
					newSection($sectionModal.title, $sectionModal.after);
				} else if (action === 'start-new-section') {
					const newSects = [];
					for (let sect of sections) newSects.push(sect.title);
					$sectionModal.sections = newSects;
					$sectionModal.visible = true;
				} else if (action === 'save-section-title') {
					const store = get(sectionTitleModal);
					changeSectionTitle(store.i, store.title);
				} else if (action === 'delete-section') {
					deleteSection(deleteI);
				} else if (action === 'delete') {
					escapeNode();
					setTimeout(() => {
						nodeToRemove.set(treeData?.uuid);
						treeAction.set('remove-node');
					}, 300);
				} else if (action === 'get-selection') {
					moved = false;
					linkRange = currentQuill.getSelection();
				} else if (action === 'bold') bold();
				else if (action === 'italic') italic();
				else if (action === 'underline') underline();
				else if (action === 'strike') strike();
				else if (action === 'subscript') subscript();
				else if (action === 'superscript') superscript();
				else if (action === 'quote') quote();
				else if (action === 'link') link($linkInput);
				else if (action === 'fx') fx();
				else if (action === 'al') al();
				else if (action === 'ar') ar();
				else if (action === 'ac') ac();
				else if (action === 'aj') aj();
				else if (action === 'indent') indent();
				else if (action === 'dedent') dedent();
				else if (action === 'color') color();
				else if (action === 'edit-permissions') {
					$editPermissions.owners = treeData?.owners || [];
					$editPermissions.members = treeData?.members || [];
					$editPermissions.type = 'Default';
					$editPermissions.anyonePermissions = treeData?.anyonePermissions || 'Can view';
					$editPermissions.memberPermissions = treeData?.memberPermissions || 'Can edit';
					$editPermissions.visible = true;
				} else if (action === 'save-permissions') {
					handlePermissions(
						$editPermissions.type,
						$editPermissions.anyonePermissions,
						$editPermissions.memberPermissions,
						$editPermissions.members,
						$editPermissions.owners
					);
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
		let i = 0;
		for (let section of sections) {
			if (i) {
				section.quill = new Quill(section.editor, quillOptions);
			}
			section.quill.enable(false);
			section.eventFunction = (eventName: any, range: any, oR: any, source: any) => {
				quillEvent(section.title, section.quill, section.editor, eventName, range, oR, source);
			};
			section.quill.setContents(section.base);
			section.quill.on('editor-change', section.eventFunction);
			section.quill.history.clear();
			i = 1;
		}
		switchCurrent(sections[0]);
		window.addEventListener('keydown', handleKeyDown);
		treeAction.set('calibrate-node-height');
	}
	function updateQuillData(bases: any) {
		emptyQuills();
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
		if (canEdit) {
			nodeChannel = data.supabase
				.channel('schema-db-changes')
				.on(
					'postgres_changes',
					{
						event: 'UPDATE',
						schema: 'public',
						table: 'Nodes',
						filter: `uuid=eq.${treeData?.uuid}`
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
								toolBarDefault.set(false);
								toolBarForOwner.set(false);
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
			.from('Nodes')
			.select('*')
			.eq('uuid', treeData?.uuid)
			.then(({ data: nodeData }) => {
				if (nodeData) {
					if (canEdit) {
						currentUser = nodeData[0].active_user;
						if (currentUser === username || !currentUser) editBtnActive = true;
						else {
							const now = Date.now();
							if (now - nodeData[0].last_edit >= 100000) editBtnActive = true;
							else {
								editBtnActive = false;
								clearTimeout(sessionTimeout);
								sessionTimeout = setTimeout(
									() => {
										editBtnActive = true;
									},
									100000 - (now - nodeData[0].last_edit)
								);
							}
						}
					}
					const bases = JSON.parse(JSON.stringify(nodeData[0].content));
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

	function bold() {
		if (currentQuill.getFormat()?.bold) {
			currentQuill.format('bold', null, 'user');
			bolded.set(false);
		} else {
			currentQuill.format('bold', true, 'user');
			bolded.set(true);
		}
	}
	function italic() {
		if (currentQuill.getFormat()?.italic) {
			currentQuill.format('italic', null);
			italicized.set(false);
		} else {
			currentQuill.format('italic', true);
			italicized.set(true);
		}
	}
	function underline() {
		if (currentQuill.getFormat()?.underline) {
			currentQuill.format('underline', null);
			$underlined = false;
		} else {
			currentQuill.format('underline', true);
			$underlined = true;
		}
	}
	function strike() {
		if (currentQuill.getFormat()?.strike) {
			currentQuill.format('strike', null);
			$striked = false;
		} else {
			currentQuill.format('strike', true);
			$striked = true;
		}
	}
	function subscript() {
		if (currentQuill.getFormat()?.script === 'sub') {
			currentQuill.format('script', null);
			$scripted = false;
		} else {
			currentQuill.format('script', 'sub');
			$scripted = 'sub';
		}
	}
	function superscript() {
		if (currentQuill.getFormat()?.script === 'super') {
			currentQuill.format('script', null);
			$scripted = false;
		} else {
			currentQuill.format('script', 'super');
			$scripted = 'super';
		}
	}
	function quote() {
		if (currentQuill.getFormat()?.blockquote) {
			currentQuill.format('blockquote', null);
			$quoted = false;
		} else {
			currentQuill.format('blockquote', true);
			$quoted = true;
		}
	}
	function link(link: string) {
		const i = linkRange?.index;
		const l = linkRange?.length;
		if (l) {
			if (i) {
				currentQuill.updateContents({
					ops: [
						{ retain: i },
						{
							retain: l,
							attributes: {
								link,
								color: '#48abe8'
							}
						}
					]
				});
			} else {
				currentQuill.updateContents({
					ops: [
						{
							retain: l,
							attributes: {
								link,
								color: '#48abe8'
							}
						}
					]
				});
			}
			if (!moved) currentQuill.setSelection(l + i);
		}
	}
	function fx() {
		const i = currentQuill.getSelection().index;
		if (i) {
			currentQuill.updateContents({
				ops: [
					{ retain: i },
					{
						insert: {
							formula: 'e=mc^2'
						}
					},
					{ insert: ' ' }
				]
			});
		} else {
			currentQuill.updateContents({
				ops: [
					{
						insert: {
							formula: 'e=mc^2'
						}
					},
					{ insert: ' ' }
				]
			});
		}
		currentQuill.setSelection(i + 2);
	}
	function al() {
		if (currentQuill.getFormat()?.align) {
			currentQuill.format('align', null);
			$aligned = false;
		}
	}
	function ar() {
		currentQuill.format('align', 'right');
		$aligned = 'right';
	}
	function ac() {
		currentQuill.format('align', 'center');
		$aligned = 'center';
	}
	function aj() {
		currentQuill.format('align', 'justify');
		$aligned = 'justify';
	}
	function indent() {
		const i = currentQuill.getFormat()?.indent;
		if (i >= 1) {
			currentQuill.format('indent', i + 1);
		} else {
			currentQuill.format('indent', 1);
		}
	}
	function dedent() {
		const i = currentQuill.getFormat()?.indent;
		if (i > 1) {
			currentQuill.format('indent', i - 1);
		} else {
			currentQuill.format('indent', null);
		}
	}
	function color() {
		currentQuill.format('color', null);
	}

	function saving(start: boolean = false) {
		if (start) isSaving = true;
		if (isSaving) {
			save();
			savingTimeout = setTimeout(saving, 1600);
		}
	}
	function save(closing = false) {
		if (!saved && !posting && canEdit) {
			pushEdit({
				uuid: treeData?.uuid,
				base,
				section: currentSection,
				userId: data.session?.user.id
			});
			saved = true;
		}

		if (closing) {
			const treeDataTemp = tree.getObjFromId(treeData?.uuid)?.data;
			if (treeDataTemp) {
				treeDataTemp.title = title || '';
				treeDataTemp.tldr = sections[0].quill.getContents();
			}
		}
	}
	async function pushEdit(d: any): Promise<void> {
		if (posting) await waitForServer();
		posting = true;
		try {
			const response = await fetch('/actions/push_edit', {
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
			if (error.message !== 'TypeError: fetch failed') failurePopUp.set('Error: ' + error.message);
		}
		posting = false;
	}
	async function changeTitle(newTitle: string): Promise<void> {
		if (posting) await waitForServer();
		posting = true;
		try {
			const response = await fetch('/actions/change_node_title', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					uuid: treeData?.uuid,
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
			const response = await fetch('/actions/new_section', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					uuid: treeData?.uuid,
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
			const response = await fetch('/actions/change_section_title', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					uuid: treeData?.uuid,
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
			const response = await fetch('/actions/delete_section', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					uuid: treeData?.uuid,
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
	async function activateUser() {
		if (posting) await waitForServer();
		posting = true;
		try {
			const response = await fetch('/actions/activate_user', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					userId: data.session?.user.id,
					uuid: treeData?.uuid
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
			const response = await fetch('/actions/unactivate_user', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					userId: data.session?.user.id,
					uuid: treeData?.uuid
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
	async function handlePermissions(
		type: string,
		anyonePermissions: string,
		memberPermissions: string,
		members: string[],
		owners: string[]
	) {
		if (posting) await waitForServer();
		posting = true;
		$processing = true;
		try {
			const response = await fetch('/actions/edit_permissions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					userId: data.session?.user.id,
					uuid: treeData?.uuid,
					type,
					anyonePermissions,
					memberPermissions,
					members,
					owners
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit data');
			}
			if (treeData) {
				treeData.anyonePermissions = result.data.anyonePermissions;
				treeData.memberPermissions = result.data.memberPermissions;
				treeData.members = result.data.members;
				treeData.owners = result.data.owners;
			}
			$editPermissions.visible = false;
			successPopUp.set('Permissions Saved!');
		} catch (error: any) {
			failurePopUp.set('Error: ' + error.message);
		} finally {
			posting = false;
			$processing = false;
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
	function openNode() {
		editBtnActive = false;
		loadData();
		$shortCutsEnabled = false;
		if (canEdit) editIconActive = true;
		$viewingNode = treeData?.uuid;
		startListening();
		escBtn = true;
		treeAction.set('find-node-position');
	}

	function changeEditable() {
		if (!$viewingNode) {
			openNode();
		} else if (canEdit) {
			if (editable) {
				editBtnActive = false;
				isSaving = false;
				clearTimeout(savingTimeout);
				editable = false;
				enableQuills(false);
				editIconActive = true;
				toolBarDefault.set(false);
				toolBarForOwner.set(false);
				unactivateUser().then(() => {
					editBtnActive = true;
				});
			} else {
				editIconActive = false;
				editBtnActive = false;
				$processing = true;
				data.supabase
					.from('Nodes')
					.select('*')
					.eq('uuid', treeData?.uuid)
					.then(({ data: nodeData }) => {
						if (nodeData) {
							const bases = JSON.parse(JSON.stringify(nodeData[0].content));
							updateQuillData(bases);
							fillQuills().then(() => {
								activateUser().then(
									() => {
										saving(true);
										enableQuills(true);
										editable = true;
										toolBarDefault.set(true);
										if (isOwner) {
											toolBarForOwner.set(true);
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
		if (editable && isOwner) {
			$titleModal.title = title || '';
			$titleModal.visible = true;
		}
	}
	function editSectionTitle(i: number, currentTitle: string) {
		if (editable && canEdit) {
			$sectionTitleModal.title = currentTitle;
			$sectionTitleModal.i = i;
			$sectionTitleModal.visible = true;
		}
	}
	function handleSectionTitleContext(e: any, i: any) {
		if (i && editable && canEdit) {
			e.preventDefault();
			deleteI = i;
			sectionContextE.set(e);
			canvasAction.set('handle-section-context');
		}
	}
</script>

<div
	class="grid bg-[#1f1f1f] rounded-[20px] w-[800px] overflow-clip px-[50px] py-[42px] relative selection:bg-[#6a87b389] {$viewingNode
		? ''
		: 'max-h-[405px]'}"
	style={`box-shadow: -2px 2px ${shadowColor}`}
>
	<div class="bg-[#1f1f1f] absolute bottom-0 left-[30px] right-[30px] h-[42px] z-[1]" />
	{#if escBtn}
		<button
			on:click={escapeNode}
			class="absolute flex items-center justify-center top-[14px] left-[15px] h-[17px] w-[40px] rounded-full border-[#595959] border-[1px] hover:bg-[#292929]"
		>
			<code class="text-[10px] text-[#595959]">esc</code>
		</button>
	{/if}
	<button
		on:click={changeEditable}
		disabled={!editBtnActive}
		class="absolute group top-[53px] right-[65px] rounded-md w-[36px] h-[36px] items-center transition-colors justify-center {editBtnActive
			? 'hover:bg-[#4949495a]'
			: ''}"
	>
		{#if editIconActive}
			<Edit color={editBtnActive ? '#9c9c9c' : '#595959'} size="36px" />
			{#if currentUser !== username && currentUser && isOwner && !editBtnActive}
				<FadeElement side="left">
					<div
						on:click={(e) => e.stopPropagation()}
						role="presentation"
						class="cursor-default rounded-md bg-[#323232e7] w-[130px] p-[8px]"
					>
						<p class="text-[11px]">{currentUser} is currently editing this node</p>
						<button
							disabled={unactivatingUser}
							on:click={async () => {
								$processing = true;
								unactivatingUser = true;
								await unactivateUser();
								unactivatingUser = false;
								$processing = false;
							}}
							class="border-[1px] font-bold mt-[8px] text-[11px] rounded-md w-full py-[2px] transition-colors border-[#751f1f] {unactivatingUser ||
								'hover:bg-[#751f1f]'}"
						>
							Stop {currentUser}'s session
						</button>
					</div>
				</FadeElement>
			{/if}
		{:else}
			<View color={editBtnActive ? '#9c9c9c' : '#595959'} size="36px" />
		{/if}
	</button>
	<div
		class="ml-[14px] mr-[50px] relative title mb-[5px] w-min text-nowrap"
		role="presentation"
		on:dblclick={editTitle}
	>
		{title}
		<div class="absolute top-[11px] left-[calc(100%+4px)] group">
			<Info color="#808080" size="11px" />
			<FadeElement className="top-[80%] left-[-3px]" side="custom">
				<div
					class="bg-[#3c3c3c] flex flex-col space-y-[3px] px-[10px] py-[7px] rounded-md text-[11px]"
				>
					<div class="flex">
						<p class="font-bold mr-[3px]">Owner{treeData.owners.length === 1 ? '' : 's'}:</p>
						<p>
							{#each treeData.owners as owner, i}
								{owner}{i === treeData.owners.length - 1 ? '' : ', '}
							{/each}
						</p>
					</div>
					<div class="flex">
						<p class="font-bold mr-[3px]">Published:</p>
						<p>{new Date(treeData.created_at).toLocaleDateString()}</p>
					</div>
				</div>
			</FadeElement>
		</div>
	</div>
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
				{section.title}
			</p>
			<div class="mt-[2px] mb-[5px] overflow-hidden w-[670px]">
				<div bind:this={section.editor} />
			</div>
		</div>
	{/each}
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
