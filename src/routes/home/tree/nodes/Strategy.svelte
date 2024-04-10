<script lang="ts">
	import { getContext } from 'svelte';
	import { onMount, onDestroy } from 'svelte';
	import Edit from '$lib/icons/Edit.svelte';
	import View from '$lib/icons/View.svelte';
	import type { TreeInterface, Strategy } from '$lib/types/nodes';
	import { get, type Writable } from 'svelte/store';
	import type { PageData } from '../$types';

	const charPos: { v: number } = getContext('charPos');
	const titleModal: Writable<{
		visible: boolean;
		title: string | undefined;
	}> = getContext('titleModalStore');
	const viewingNode: Writable<any> = getContext('viewingNodeStore');
	const nodeAction: Writable<string | null> = getContext('nodeActionStore');
	const canvasAction: Writable<string | null> = getContext('canvasActionStore');
	const shortCutsEnabled: any = getContext('shortCutsEnabledStore');
	const treeAction: Writable<string | null> = getContext('treeActionStore');
	const viewPort: { height: number; top: number } = getContext('viewPort');
	const data: PageData = getContext('data');
	const tree: TreeInterface = getContext('tree');

	export let id: string;
	export let treeData: Partial<Strategy>;

	let strategyDiv: HTMLDivElement;
	let sData: any = {};

	interface QuillType {
		editor: any;
		quill: any;
		eventFunction: any;
	}

	let quills: {
		tldr: QuillType;
		prerequisites: QuillType;
		content: QuillType;
		references: QuillType;
	} = {
		tldr: { editor: null, quill: null, eventFunction: null },
		prerequisites: { editor: null, quill: null, eventFunction: null },
		content: { editor: null, quill: null, eventFunction: null },
		references: { editor: null, quill: null, eventFunction: null }
	};

	type QuillKeys = keyof typeof quills;

	let quillKeys: QuillKeys[] = ['tldr', 'prerequisites', 'content', 'references'];

	let currentQuill: any;
	let currentEditor: any;

	let out = false;
	let pos = 0;
	let outPos = 0;
	let outChar = '';
	let editIconActive = false;
	let editable = false;
	let title: string | undefined;
	let userIndex: any;
	let prevLength: any = 0;
	let spacerActive = true;
	let sectionsChanged: string[] = [];
	let isSaving = false;

	let nodeActionUnsubscribe: any;

	let Quill: any;
	let Delta: any;

	const quillOptions = {
		theme: 'bubble',
		modules: {
			toolbar: ''
		},
		placeholder: 'Write here...'
	};

	function quillEvent(
		name: string,
		quill: any,
		editor: any,
		eventName: any,
		range: any,
		oldQuill: any,
		source: any
	) {
		if (quill.hasFocus()) {
			if (currentQuill !== quill) {
				currentQuill = quill;
				currentEditor = editor;
				prevLength = quill.getLength();
			}
			if (!sectionsChanged.includes(name)) sectionsChanged.push(name);
			if (eventName === 'selection-change' && range && source !== 'api') {
				userIndex = range.index;
				if (source === 'user') {
					const pos =
						editor.getBoundingClientRect().top + quill.getBounds(range.index + range.length).bottom;
					if (pos > viewPort.height) {
						canvasAction.set('move-page-up');
					}
				}
			} else if (eventName === 'text-change' && source !== 'api') {
				const deltaLength = quill.getLength() - prevLength;
				if (deltaLength > 0) {
					const pos =
						editor.getBoundingClientRect().top + quill.getBounds(userIndex + deltaLength).bottom;
					if (pos > viewPort.height + 24) {
						quill.enable(false);
						quill.deleteText(0, quill.getLength());
						const quillData = oldQuill.compose(range);
						setTimeout(() => {
							quill.setContents(quillData);
							quill.enable(true);
							treeAction.set('calibrate-node-height');
							prevLength = quill.getLength();
						}, 30);
					} else if (pos > viewPort.height - 4) {
						canvasAction.set('move-page-up');
					}
				}
				if (name === 'tldr' && quill.getText().split('\n').length > 13) {
					let text = quill.getText();
					const newline = '\n';
					let count = 0;
					let index = -1;

					for (let i = 0; i < text.length; i++) {
						if (text[i] === newline) {
							count++;
							if (count === 12) {
								index = i;
								break;
							}
						}
					}
					text = text.substring(0, index + 1);
					quill.setText(text);
				}
				prevLength = quill.getLength();
				treeAction.set('calibrate-node-height');
			}
		}
	}

	onMount(async () => {
		const { default: QuillImport } = await import('quill');
		Quill = QuillImport;
		Delta = Quill.import('delta');

		quillKeys.forEach((key) => {
			quills[key].quill = new Quill(quills[key].editor, quillOptions);
			quills[key].eventFunction = (eventName: any, range: any, oR: any, source: any) => {
				quillEvent(key, quills[key].quill, quills[key].editor, eventName, range, oR, source);
			};
		});

		title = treeData.title;

		let change = tree.getChanges().nodes.find((n) => n.id === id)?.quills;

		if (
			treeData?.tldr &&
			change?.tldr &&
			JSON.stringify(treeData.tldr) !== JSON.stringify(change.tldr)
		) {
			quills.tldr.quill.setContents(new Delta(treeData.tldr).compose(change.tldr));
		} else if (treeData?.tldr) quills.tldr.quill.setContents(treeData.tldr);
		else if (change?.tldr) quills.tldr.quill.setContents(change.tldr);

		enableQuills(false);

		strategyDiv.style.height = `${quills.tldr.editor.clientHeight + 190}px`;
	});
	onDestroy(() => {
		window.removeEventListener('keydown', handleKeyDown);

		quillKeys.forEach((key) => {
			const quill = quills[key];
			quill.quill.off('editor-change', quill.eventFunction);
		});

		if (nodeActionUnsubscribe) nodeActionUnsubscribe();
	});

	function enableQuills(enabled: boolean) {
		quillKeys.forEach((key) => {
			quills[key].quill.enable(enabled);
		});
	}
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			window.removeEventListener('keydown', handleKeyDown);
			out = false;
			save(true);
			isSaving = false;
			enableQuills(false);
			editable = false;
			editIconActive = false;
			canvasAction.set('zoom-out-from-node');
		}
		if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
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
	function save(closing = false) {
		let strategyData: Partial<Strategy> = {};
		if (sectionsChanged.includes('title')) {
			strategyData.title = title;
			sectionsChanged = sectionsChanged.filter((p) => p !== 'title');
		}
		sectionsChanged.forEach((section) => {
			if (section in sData) {
				strategyData[section as keyof Strategy] = sData[section].diff(
					quills[section as keyof typeof quills].quill.getContents()
				);
			} else {
				strategyData[section as keyof Strategy] =
					quills[section as keyof typeof quills].quill.getContents();
			}
		});

		let change = tree.getChanges().nodes.find((v) => v.id === id);
		if (change) change.quills = { ...change?.quills, ...strategyData };
		else tree.getChanges().nodes.push({ id, quills: { ...strategyData } });

		data.supabase
			.from('Profiles')
			.update({ changes: tree.getChanges() })
			.eq('user_id', data.session?.user.id)
			.then(({ error }) => {
				if (error) {
					console.log(error);
				}
			});

		sectionsChanged = [];
		if (closing) {
			const treeDataTemp = tree.getObjFromId(id).data;
			treeDataTemp.title = title;
			treeDataTemp.tldr = quills.tldr.quill.getContents();
		}
	}

	function startListening() {
		quillKeys.forEach((key) => {
			quills[key].quill.on('editor-change', quills[key].eventFunction);
		});
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
						currentQuill.insertText(
							currentQuill.getSelection().index + currentQuill.getSelection().length,
							outChar
						);
						out = false;
					}
				} else if (action === 'save-title') {
					title = get(titleModal).title;
					sectionsChanged.push('title');
				} else if (action === 'expand-node') {
					spacerActive = false;
					strategyDiv.style.height = 'auto';
					window.addEventListener('keydown', handleKeyDown);
					treeAction.set('calibrate-node-height');
				} else if (action === 'clean-up') {
					spacerActive = true;
					strategyDiv.style.height = `${quills.tldr.editor.clientHeight + 190}px`;
					$viewingNode = false;
					emptyQuills();
					$shortCutsEnabled = true;
					stopListening();
				}
				nodeAction.set(null);
			}
		});
	}
	function stopListening() {
		if (nodeActionUnsubscribe) nodeActionUnsubscribe();
		quillKeys.forEach((key) => {
			quills[key].quill.off('editor-change', quills[key].eventFunction);
		});
	}

	function fillQuills() {
		const strategiesPromise = data.supabase.from('Strategies').select('*').eq('id', id);
		const profilePromise = data.supabase
			.from('Profiles')
			.select('changes')
			.eq('user_id', data.session?.user.id);
		Promise.all([strategiesPromise, profilePromise]).then(
			([{ data: strategyData }, { data: changesData }]) => {
				if (strategyData && changesData) {
					if (strategyData[0]) sData = JSON.parse(JSON.stringify(strategyData[0]));
					let cData: any = changesData[0].changes.nodes?.find((v: any) => v.id === id)?.quills;

					quillKeys.forEach((key) => {
						if (key in sData) {
							sData[key] = new Delta(sData[key]);
							if (cData && key in cData)
								quills[key].quill.setContents(sData[key].compose(cData[key]));
							else quills[key].quill.setContents(sData[key]);
						} else if (cData && key in cData) quills[key].quill.setContents(cData[key]);
					});

					treeAction.set('calibrate-node-height');
				}
			}
		);
	}

	function emptyQuills() {
		quillKeys.forEach((key) => {
			if (key !== 'tldr') {
				quills[key].quill.setText('');
			}
		});
	}

	function saving(start: boolean = false) {
		if (start) {
			isSaving = true;
		}
		if (isSaving) {
			setTimeout(() => {
				saving();
			}, 4000);
			if (sectionsChanged.length) {
				save();
			}
		}
	}

	function changeEditable() {
		if (!$viewingNode) {
			fillQuills();
			$shortCutsEnabled = false;
			editIconActive = true;
			$viewingNode = id;
			startListening();
			saving(true);
			treeAction.set('find-node-position');
		} else if (!editable) {
			editable = true;
			enableQuills(true);
			editIconActive = false;
		} else if (editable) {
			editable = false;
			enableQuills(false);
			editIconActive = true;
		}
	}
	function editTitle() {
		if (editable) {
			$titleModal.title = title;
			$titleModal.visible = true;
		}
	}
</script>

<div
	bind:this={strategyDiv}
	class="grid bg-[#1f1f1f] rounded-[20px] w-[800px] h-[0] p-[60px] relative overflow-hidden selection:bg-[#6a87b389]"
	style="box-shadow: -2px 2px #3b753c;"
>
	<button
		on:click={changeEditable}
		class="absolute top-[55px] right-[65px] hover:bg-[#4949495a] rounded-md w-[36px] h-[36px] items-center justify-center"
	>
		{#if editIconActive}
			<Edit color="#9c9c9c" size="36px" />
		{:else}
			<View color="#9c9c9c" size="36px" />
		{/if}
	</button>
	<p class="ml-[14px] mr-[50px] title" on:dblclick={editTitle}>
		{title ? title : 'untitled'}
	</p>
	<p class="ml-[14px] pt-[35px] sub-header-text">TL;DR:</p>
	<div class="pt-[5px] editor-wrapper">
		<div bind:this={quills.tldr.editor} />
	</div>
	{#if spacerActive}<div class="h-[30px]" />{/if}
	<p class="ml-[14px] pt-[10px] sub-header-text">Prerequisites:</p>
	<div class="pt-[5px] editor-wrapper">
		<div bind:this={quills.prerequisites.editor} />
	</div>
	<p class="ml-[14px] pt-[10px] sub-header-text">Content:</p>
	<div class="pt-[5px] editor-wrapper">
		<div bind:this={quills.content.editor} />
	</div>
	<p class="ml-[14px] pt-[10px] sub-header-text">References:</p>
	<div class="pt-[5px] editor-wrapper">
		<div bind:this={quills.references.editor} />
	</div>
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
