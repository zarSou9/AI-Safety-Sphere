<script lang="ts">
	import { onMount, onDestroy, tick, getContext } from 'svelte';
	import Edit from '$lib/icons/Edit.svelte';
	import View from '$lib/icons/View.svelte';
	import type { TreeInterface } from '$lib/types/nodes';
	import { get, type Writable } from 'svelte/store';
	import type { PageData } from '../$types';
	import Check from '$lib/icons/Check.svelte';
	import Cross from '$lib/icons/Cross.svelte';
	import Paragraph from '$lib/icons/Paragraph.svelte';
	import Linked from '$lib/icons/Linked.svelte';

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
	const processing: Writable<boolean> = getContext('processingStore');
	const loginNotif: Writable<any> = getContext('loginNotifStore');

	export let treeData: any;
	export let referenced: any;

	let sections: any = [
		{
			title: 'TL;DR',
			editor: undefined,
			base: undefined,
			suggestions: undefined,
			history: [],
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

	let nodeActionUnsubscribe: any;
	let colors = ['#3dfc53', '#0040ff', '#9500ff', '#25faf6', '#f7b757', '#ff78d7', '#b6ed34'];
	let userColors: any = [];
	let editBtnActive = true;
	let currentUser = null;
	let problemChannel: any = undefined;

	let currentHistory: any = false;
	let fromShiftZ = false;
	let editCounter = 3;
	let pasting = false;
	let sessionTimeout: any;
	let escBtn = false;

	let userColor: string = colors[0];
	let username = data.props?.profile?.username;
	if (treeData.owners.includes(username)) {
		userColor = 'owner';
	}

	let historyStack: any = [];
	let currentQuill: any;
	let currentEditor: any;
	let base: any;
	let changes: any = [];
	let currentSection: string = 'TL;DR';

	const quillOptions: any = {
		theme: 'bubble',
		modules: {
			toolbar: false,
			history: { userOnly: true, maxStack: 0 }
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
			if (currentQuill !== quill) {
				switchCurrent(sections.find((s: any) => s.title === title));
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
					let delta = range;
					let oldDelta = oldQuill;
					saved = false;
					if (pasting) {
						pasting = false;
						if (!delta.ops[0]?.retain) {
							delta.ops.splice(0, 0, { retain: 0 });
						}
						let restOps: any = delta.ops.slice(1);
						let l = 0;
						let newInsert: any = { insert: '' };
						let f = true;
						for (let op of restOps) {
							if (!op?.insert || l > 2000) {
								quill.setContents(oldDelta);
								quill.blur();
								return;
							}
							if (f && op?.attributes) {
								newInsert.attributes = op.attributes;
							}
							newInsert.insert += op.insert;
							l += op.insert.length;
							f = false;
						}
						if (l > 2000) {
							quill.setContents(oldDelta);
							quill.blur();
							return;
						}
						delta.ops = [delta.ops[0], newInsert];
					}
					let { index } = quill.getSelection();
					if (
						(quill.getText(index - 1, 1) === '\n' && !delta.ops[1]?.delete) ||
						(index === 0 && oldDelta.ops[0].insert.slice(0, 1) === '\n')
					) {
						index += 1;
					}
					if (delta.ops.length === 1) {
						delta.ops.splice(0, 0, { retain: 0 });
					}
					if (delta.ops.length > 2) {
						let retainer = true;
						let rl = -delta.ops[0].retain;
						for (let op of delta.ops) {
							if (!op?.retain) {
								retainer = false;
								break;
							}
							rl += op.retain;
						}
						if (retainer) {
							delta.ops = [delta.ops[0], { retain: rl, attributes: delta.ops[1].attributes }];
						}
					}

					if (delta.ops[1]?.retain && delta.ops.length === 3) {
						delta.ops[2].attributes = { ...delta.ops[2]?.attributes, ...delta.ops[1].attributes };
						delta.ops = [delta.ops[0], delta.ops[2]];
					}

					if (delta.ops[1]?.insert) {
						const pos =
							currentEditor.getBoundingClientRect().top +
							quill.getBounds(delta.ops[0].retain + delta.ops[1]?.insert.length).bottom;
						if (pos > viewPort.height) {
							canvasAction.set('move-page-up');
						}
					}
					let ud = new Delta(JSON.parse(JSON.stringify(delta)));
					ud.forEach((op: any) => {
						if (op?.insert) {
							if (op?.attributes) delete op.attributes;
						}
					});
					const currentPos = ud.ops[0].retain;
					let retainOverflow = false;
					let changePos = 0;
					let l = 0;
					let found = false;
					let inDelete = false;
					if (userColor === 'owner') {
						let attP: any;
						if (ud.ops[1]?.retain)
							attP = { s: ud.ops[0]?.retain, f: ud.ops[0]?.retain + ud.ops[1]?.retain };
						delta.forEach((op: any) => {
							if (op?.insert) {
								if (op?.attributes?.color) delete op.attributes.color;
								if (op?.attributes?.underline) delete op.attributes.underline;
								if (op?.attributes?.strike) delete op.attributes.strike;
							}
						});
						for (let change of changes) {
							changePos = l + change.pos.i;
							if (currentPos < changePos && change.pos.l) {
								if (ud.ops[1]?.insert) {
									base = base.compose({ ops: [{ retain: ud.ops[0].retain - l }, ud.ops[1]] });
									for (let existingChange of changes) {
										if (!existingChange.pos.l) {
											if (existingChange.pos.i >= ud.ops[0].retain) {
												existingChange.d.ops[0].retain += ud.ops[1].insert.length;
												existingChange.pos.i = existingChange.d.ops[0].retain;
											}
										}
									}
									found = true;
									break;
								} else if (ud.ops[1]?.delete) {
									let l = 0;
									let allL = 0;
									let dl = ud.ops[1].delete;
									const cp = { s: ud.ops[0].retain, f: ud.ops[0].retain + ud.ops[1].delete };
									const toDel: any = [];
									const delsToDel: any = [];
									for (let existingChange of changes) {
										if (existingChange.pos.l) {
											const cl = existingChange.pos.l;
											const ep = {
												s: existingChange.pos.i + allL,
												f: existingChange.pos.i + existingChange.pos.l + allL
											};
											if (ep.f <= cp.s) {
												l += existingChange.pos.l;
											} else if (cp.s <= ep.s && cp.f >= ep.f) {
												dl -= existingChange.pos.l;
												toDel.push(changes.indexOf(existingChange));
											} else if (ep.s < cp.s && ep.f > cp.s) {
												l += cp.s - ep.s;
												dl -= ep.f - cp.s;
												existingChange.cd.ops[0].insert = existingChange.cd.ops[0].insert.slice(
													0,
													cp.s - ep.s
												);
												existingChange.d.ops[1] = existingChange.cd.ops[0];
												existingChange.pos.l = existingChange.cd.ops[0].insert.length;

												const rp = { s: cp.s - ep.s, f: ep.f - ep.s };
												let deleteFound = false;
												let deleteAtts: any = [];
												for (let att of existingChange.attributes) {
													const ap = { s: att.i, f: att.i + att.l };
													if (deleteFound) {
														deleteAtts.push(existingChange.attributes.indexOf(att));
													} else if (ap.s < rp.s && ap.f > rp.s) {
														att.l = ap.f - rp.s;
													} else if (ap.s >= rp.s) {
														deleteAtts.push(existingChange.attributes.indexOf(att));
														deleteFound = true;
													}
												}
												let iaOff = 0;
												for (let dai of deleteAtts) {
													existingChange.attributes.splice(dai - iaOff, 1);
													iaOff++;
												}
												if (existingChange?.deleteChildren) {
													let deleteDFound = false;
													let deleteDCs: any = [];
													for (let dChild of existingChange.deleteChildren) {
														const ap = { s: dChild.i, f: dChild.i + dChild.l };
														if (deleteDFound) {
															deleteDCs.push(existingChange.deleteChildren.indexOf(dChild));
														} else if (ap.s < rp.s && ap.f > rp.s) {
															dChild.l = ap.f - rp.s;
														} else if (ap.s >= rp.s) {
															deleteDCs.push(existingChange.deleteChildren.indexOf(dChild));
															deleteDFound = true;
														}
													}
													let iDOff = 0;
													for (let dai of deleteDCs) {
														existingChange.deleteChildren.splice(dai - iDOff, 1);
														iDOff++;
													}
												}
												if (existingChange?.children) {
													let deleteCFound = false;
													let deleteCs: any = [];
													for (let child of existingChange.children) {
														const ap = { s: child.i, f: child.i + child.l };
														if (deleteCFound) {
															deleteCs.push(existingChange.children.indexOf(child));
														} else if (ap.s < rp.s && ap.f > rp.s) {
															child.l = ap.f - rp.s;
														} else if (ap.s >= rp.s) {
															deleteCs.push(existingChange.children.indexOf(child));
															deleteCFound = true;
														}
													}
													let iCOff = 0;
													for (let dai of deleteCs) {
														existingChange.children.splice(dai - iCOff, 1);
														iCOff++;
													}
												}
											} else if (ep.f > cp.f && ep.s < cp.f) {
												dl -= cp.f - ep.s;
												existingChange.cd.ops[0].insert = existingChange.cd.ops[0].insert.slice(
													cp.f - ep.s
												);
												existingChange.d.ops[1] = existingChange.cd.ops[0];
												existingChange.d.ops[0].retain = cp.s - l;
												existingChange.pos.l = existingChange.cd.ops[0].insert.length;
												existingChange.pos.i = existingChange.d.ops[0].retain;

												const rp = { s: 0, f: cp.f - ep.s };
												let deleteFound = false;
												let deleteAtts: any = [];
												for (let att of existingChange.attributes) {
													const ap = { s: att.i, f: att.i + att.l };
													if (deleteFound) {
														att.i -= rp.f;
													} else if (ap.f <= rp.f) {
														deleteAtts.push(existingChange.attributes.indexOf(att));
													} else if (ap.s < rp.f) {
														att.l = ap.f - rp.f;
														att.i = 0;
													} else if (ap.s >= rp.f) {
														deleteFound = true;
														att.i -= rp.f;
													}
												}
												let iaOff = 0;
												for (let dai of deleteAtts) {
													existingChange.attributes.splice(dai - iaOff, 1);
													iaOff++;
												}
												if (existingChange?.deleteChildren) {
													let deleteDFound = false;
													let deleteDs: any = [];
													for (let dChild of existingChange.deleteChildren) {
														const ap = { s: dChild.i, f: dChild.i + dChild.l };
														if (deleteDFound) {
															dChild.i -= rp.f;
														} else if (ap.f <= rp.f) {
															deleteDs.push(existingChange.deleteChildren.indexOf(dChild));
														} else if (ap.s < rp.f) {
															dChild.l = ap.f - rp.f;
															dChild.i = 0;
														} else if (ap.s >= rp.f) {
															deleteDFound = true;
															dChild.i -= rp.f;
														}
													}
													let iDOff = 0;
													for (let dai of deleteDs) {
														existingChange.deleteChildren.splice(dai - iDOff, 1);
														iDOff++;
													}
												}
												if (existingChange?.children) {
													let deleteDFound = false;
													let deleteCs: any = [];
													for (let child of existingChange.children) {
														const ap = { s: child.i, f: child.i + child.l };
														if (deleteDFound) {
															child.i -= rp.f;
														} else if (ap.f <= rp.f) {
															deleteCs.push(existingChange.children.indexOf(child));
														} else if (ap.s < rp.f) {
															child.l = ap.f - rp.f;
															child.i = 0;
														} else if (ap.s >= rp.f) {
															deleteDFound = true;
															child.i -= rp.f;
														}
													}
													let iCOff = 0;
													for (let dai of deleteCs) {
														existingChange.children.splice(dai - iCOff, 1);
														iCOff++;
													}
												}
											} else if (ep.s >= cp.f) {
												existingChange.pos.i -= dl;
												existingChange.d.ops[0].retain = existingChange.pos.i;
											}
											allL += cl;
										} else {
											const dp = {
												s: existingChange.pos.i,
												f: existingChange.pos.i + existingChange.cd.ops[0].delete
											};
											if (cp.s <= dp.s && cp.f >= dp.f) {
												delsToDel.push(existingChange);
											} else if (dp.s < cp.s && dp.f > cp.s) {
												existingChange.cd.ops[0].delete = cp.s - dp.s;
												existingChange.d.ops[1] = existingChange.cd.ops[0];
											} else if (dp.f > cp.f && dp.s < cp.f) {
												existingChange.cd.ops[0].delete = dp.f - cp.f;
												existingChange.d.ops[1] = existingChange.cd.ops[0];
												existingChange.d.ops[0].retain = cp.s;
												existingChange.pos.i = existingChange.d.ops[0].retain;
											} else if (dp.s >= cp.f) {
												existingChange.pos.i -= dl;
												existingChange.d.ops[0].retain = existingChange.pos.i;
											}
										}
									}
									let diOff = 0;
									for (let del of toDel) {
										changes.splice(del - diOff, 1);
										diOff++;
									}
									for (let del of delsToDel) {
										changes.splice(changes.indexOf(del), 1);
									}
									if (ud.ops[0].retain - l > 0) {
										base = base.compose({
											ops: [{ retain: ud.ops[0].retain - l }, { delete: dl }]
										});
									} else {
										base = base.compose({ ops: [{ delete: dl }] });
									}
									found = true;
									break;
								}
							} else {
								if (change.pos.l) {
									const p = currentPos - changePos;
									for (let existingChange of changes) {
										if (!existingChange.pos.l) {
											if (ud.ops[1]?.delete) {
												if (
													existingChange.pos.i <= currentPos + ud.ops[1]?.delete &&
													currentPos <= existingChange.pos.i + existingChange.cd.ops[0].delete
												) {
													inDelete = true;
												}
											} else if (ud.ops[1]?.insert) {
												if (
													existingChange.pos.i < currentPos &&
													currentPos < existingChange.pos.i + existingChange.cd.ops[0].delete
												) {
													inDelete = true;
												}
											}
										}
									}
									if (!inDelete) {
										if (ud.ops[1]?.delete) {
											if (
												changePos <= currentPos &&
												currentPos + ud.ops[1].delete <= changePos + change.pos.l
											) {
												let childFound = false;
												let deleteChildFound = false;
												let delC = [];
												const rp = { s: p, f: p + ud.ops[1].delete };
												if (change?.children) {
													for (let child of change.children) {
														let cp = { s: child.i, f: child.i + child.l };
														if (childFound) {
															child.i -= ud.ops[1].delete;
														} else {
															if (rp.s >= cp.s && rp.f <= cp.f) {
																child.l -= ud.ops[1].delete;
																if (child.l <= 0) delC.push(change.children.indexOf(child));
															} else if (rp.s < cp.s && rp.f > cp.f) {
																delC.push(change.children.indexOf(child));
															} else if (rp.s < cp.s && rp.f > cp.s) {
																child.i = rp.s;
																child.l = cp.f - rp.f;
															} else if (rp.s < cp.f && rp.f > cp.f) {
																child.l -= cp.f - rp.s;
															} else if (cp.s >= rp.f) {
																child.i -= ud.ops[1].delete;
																childFound = true;
															}
														}
													}
												}
												let iOff = 0;
												for (let di of delC) {
													change.children.splice(di - iOff, 1);
													iOff++;
												}

												let delDC = [];
												const rdp = { s: p, f: p + ud.ops[1].delete };
												if (change?.deleteChildren) {
													for (let deleteChild of change.deleteChildren) {
														let dcp = { s: deleteChild.i, f: deleteChild.i + deleteChild.l };
														if (deleteChildFound) {
															deleteChild.i -= ud.ops[1].delete;
														} else {
															if (rdp.s >= dcp.s && rdp.f <= dcp.f) {
																deleteChild.l -= ud.ops[1].delete;
																if (deleteChild.l <= 0)
																	delDC.push(change.deleteChildren.indexOf(deleteChild));
															} else if (rdp.s < dcp.s && rdp.f > dcp.f) {
																delDC.push(change.deleteChildren.indexOf(deleteChild));
															} else if (rdp.s < dcp.s && rdp.f > dcp.s) {
																deleteChild.i = rdp.s;
																deleteChild.l = dcp.f - rdp.f;
															} else if (rdp.s < dcp.f && rdp.f > dcp.f) {
																deleteChild.l -= dcp.f - rdp.s;
															} else if (dcp.s >= rdp.f) {
																deleteChild.i -= ud.ops[1].delete;
																deleteChildFound = true;
															}
														}
													}
												}
												let iDOff = 0;
												for (let di of delDC) {
													change.deleteChildren.splice(di - iDOff, 1);
													iDOff++;
												}

												const dl = ud.ops[1].delete;
												delta = JSON.parse(JSON.stringify(ud));
												if (p) {
													ud = { ops: [{ retain: p }, ud.ops[1]] };
												} else {
													ud = { ops: [ud.ops[1]] };
												}
												change.cd = change.cd.compose(ud);
												change.d.ops[1] = change.cd.ops[0];

												let aFound = false;
												let delI: any = [];
												const dp = { s: p, f: p + dl };

												for (let att of change.attributes) {
													let ap = { s: att.i, f: att.i + att.l };
													if (aFound) {
														att.i -= dl;
													} else {
														if (dp.s >= ap.s && dp.f <= ap.f) {
															att.l -= dl;
															if (att.l <= 0) delI.push(change.attributes.indexOf(att));
														} else if (dp.s < ap.s && dp.f > ap.f) {
															delI.push(change.attributes.indexOf(att));
														} else if (dp.s < ap.s && dp.f > ap.s) {
															att.i = dp.s;
															att.l = ap.f - dp.f;
														} else if (dp.s < ap.f && dp.f > ap.f) {
															att.l -= ap.f - dp.s;
														} else if (ap.s >= dp.f) {
															att.i -= dl;
															aFound = true;
														}
													}
												}
												let iAOff = 0;
												for (let di of delI) {
													change.attributes.splice(di - iAOff, 1);
													iAOff++;
												}

												if (change.d.ops[1]?.insert) {
													change.pos.l = change.d.ops[1].insert.length;
													found = true;
													break;
												} else {
													changes.splice(changes.indexOf(change), 1);
													found = true;
													break;
												}
											}
										} else if (ud.ops[1]?.insert) {
											if (changePos <= currentPos && currentPos <= changePos + change.pos.l) {
												if (delta.ops[1]?.attributes?.strike) delete delta.ops[1].attributes.strike;
												delta.ops[1].attributes.color = userColor;
												let childFound = false;
												if (change?.children) {
													for (let child of change.children) {
														if (childFound) {
															child.i += ud.ops[1].insert.length;
														} else {
															if (child.i < p && p < child.i + child.l) {
																child.l += ud.ops[1].insert.length;
																delta.ops[1].attributes.color = child.owner;
																childFound = true;
															}
															if (child.i >= p) {
																child.i += ud.ops[1].insert.length;
																childFound = true;
															}
														}
													}
												}

												if (change?.deleteChildren) {
													for (let deleteChild of change.deleteChildren) {
														if (deleteChild.i < p && p < deleteChild.i + deleteChild.l) {
															index -= ud.ops[1].insert.length;
															delta.ops = [];
															found = true;
														} else if (deleteChild.i >= p) {
															deleteChild.i += ud.ops[1].insert.length;
														}
													}
												}
												if (found) break;

												const cl = ud.ops[1].insert.length;
												if (p) {
													ud = { ops: [{ retain: p }, ud.ops[1]] };
												} else {
													ud = { ops: [ud.ops[1]] };
												}
												change.cd = change.cd.compose(ud);
												change.d.ops[1] = change.cd.ops[0];
												change.pos.l = change.d.ops[1].insert.length;
												const a: any = {};
												let addA = false;
												let ai: any = false;
												let aIns: any = false;
												for (let key in delta.ops[1].attributes) {
													if (key !== 'color' && key !== 'underline') {
														a[key] = delta.ops[1].attributes[key];
														addA = true;
													}
												}
												if (addA) {
													let aFound = false;

													for (let att of change.attributes) {
														if (aFound) {
															att.i += cl;
														} else if (att.i <= p && p <= att.i + att.l) {
															if (JSON.stringify(a) === JSON.stringify(att.a)) {
																att.l += cl;
															} else if (att.i < p && p < att.i + att.l) {
																aIns = change.attributes.indexOf(att);
															} else if (att.i === p) {
																ai = change.attributes.indexOf(att);
															} else {
																ai = change.attributes.indexOf(att) + 1;
															}
															aFound = true;
														} else if (p < att.i) {
															aFound = true;
															att.i += cl;
															ai = change.attributes.indexOf(att);
														}
													}
													if (!aFound) {
														change.attributes.push({ i: p, l: cl, a });
													}

													if (ai !== false) {
														change.attributes.splice(ai, 0, { i: p, l: cl, a });
													} else if (aIns !== false) {
														const prevAL = change.attributes[aIns].l;
														change.attributes[aIns].l = p - change.attributes[aIns].i;
														change.attributes.splice(aIns + 1, 0, { i: p, l: cl, a });
														change.attributes.splice(aIns + 2, 0, {
															i: p + cl,
															l: prevAL - change.attributes[aIns].l,
															a: change.attributes[aIns].a
														});
													}
												} else {
													let aFound = false;
													for (let att of change.attributes) {
														if (aFound) {
															att.i += cl;
														} else if (att.i <= p && p <= att.i + att.l) {
															if (att.i < p && p < att.i + att.l) {
																aIns = change.attributes.indexOf(att);
															} else if (att.i === p) {
																att.i += cl;
															}
															aFound = true;
														} else if (p < att.i) {
															aFound = true;
															att.i += cl;
															ai = change.attributes.indexOf(att) + 1;
														}
													}
													if (aIns !== false) {
														const prevAL = change.attributes[aIns].l;
														change.attributes[aIns].l = p - change.attributes[aIns].i;
														change.attributes.splice(aIns + 1, 0, {
															i: p + cl,
															l: prevAL - change.attributes[aIns].l,
															a: change.attributes[aIns].a
														});
													}
												}

												for (let existingChange of changes) {
													if (!existingChange.pos.l) {
														if (existingChange.pos.i - l >= change.pos.i) {
															existingChange.d.ops[0].retain += cl;
															existingChange.pos.i = existingChange.d.ops[0].retain;
														}
													}
												}
												found = true;
												break;
											}
										} else if (ud.ops[1]?.retain) {
											if (
												changePos <= currentPos &&
												currentPos + ud.ops[1].retain <= changePos + change.pos.l
											) {
												const a: any = {};
												let addA = false;
												let insertAs = [];
												for (let key in ud.ops[1].attributes) {
													if (key !== 'color' && key !== 'underline') {
														a[key] = ud.ops[1].attributes[key];
														addA = true;
													}
												}
												const al = ud.ops[1].retain;
												const ap = { s: p, f: p + al };
												let prevF = ap.s;

												if (addA) {
													let aFound = false;
													for (let att of change.attributes) {
														const eap = { s: att.i, f: att.i + att.l };
														if (ap.s <= eap.s && eap.f <= ap.f) {
															att.a = { ...att.a, ...a };
															if (prevF !== eap.s) {
																insertAs.push({
																	p: 0,
																	ea: att,
																	i: prevF,
																	l: eap.s - prevF,
																	a
																});
															}
															prevF = eap.f;
															aFound = true;
														} else if (ap.s < eap.s && ap.f > eap.s) {
															att.i += ap.f - eap.s;
															att.l -= ap.f - eap.s;
															insertAs.push({
																p: 0,
																ea: att,
																i: eap.s,
																l: ap.f - eap.s,
																a: { ...att.a, ...a }
															});
															if (prevF !== eap.s) {
																insertAs.push({
																	p: 0,
																	ea: att,
																	i: prevF,
																	l: eap.s - prevF,
																	a
																});
															}
															prevF = ap.f;
															aFound = true;
														} else if (ap.s < eap.f && ap.f > eap.f) {
															att.l = ap.s - eap.s;
															insertAs.push({
																p: 1,
																ea: att,
																i: ap.s,
																l: eap.f - ap.s,
																a: { ...att.a, ...a }
															});
															prevF = eap.f;
															aFound = true;
														} else if (ap.s > eap.s && ap.f < eap.f) {
															att.l = ap.s - eap.s;
															insertAs.push({
																p: 1,
																ea: att,
																i: ap.f,
																l: eap.f - ap.f,
																a: att.a
															});
															insertAs.push({
																p: 1,
																ea: att,
																i: ap.s,
																l: al,
																a: { ...att.a, ...a }
															});

															aFound = true;
															break;
														}
													}
													if (!aFound) {
														if (change.attributes.length) {
															for (let att of change.attributes) {
																if (att.i > p) {
																	change.attributes.splice(change.attributes.indexOf(att), 0, {
																		i: p,
																		l: al,
																		a
																	});
																	aFound = true;
																	break;
																}
															}
															if (!aFound) {
																change.attributes.push({
																	i: p,
																	l: al,
																	a
																});
															}
														} else {
															change.attributes.push({
																i: p,
																l: al,
																a
															});
														}
													} else if (prevF !== ap.f) {
														change.attributes.push({
															i: prevF,
															l: ap.f - prevF,
															a
														});
													}
													for (let inA of insertAs) {
														change.attributes.splice(change.attributes.indexOf(inA.ea) + inA.p, 0, {
															i: inA.i,
															l: inA.l,
															a: inA.a
														});
													}
												}

												found = true;
												break;
											}
										}
									}
								} else {
									if (ud.ops[1]?.insert) {
										if (
											change.pos.i < currentPos &&
											currentPos < change.pos.i + change.cd.ops[0].delete
										) {
											index -= ud.ops[1].insert.length;
											delta.ops = [];
											found = true;
											break;
										}
									}
								}
							}
							if (ud.ops[1]?.retain && !retainOverflow) {
								if (change.pos.l) {
									let chP = { s: changePos, f: changePos + change.pos.l };
									if (
										(chP.f >= attP.s && chP.f <= attP.f) ||
										(chP.s >= attP.s && chP.s <= attP.f)
									) {
										retainOverflow = true;
									}
								} else {
									let chP = { s: change.pos.i, f: change.pos.i + change.cd.ops[0].delete };
									if (
										(chP.f >= attP.s && chP.f <= attP.f) ||
										(chP.s >= attP.s && chP.s <= attP.f)
									) {
										retainOverflow = true;
									}
								}
							}
							l += change.pos.l;
						}
						if (!found) {
							if (ud.ops[1]?.insert) {
								const newD = { ops: [{ retain: ud.ops[0].retain - l }, ud.ops[1]] };
								if (newD.ops[0].retain - l <= 0) newD.ops.splice(0, 1);
								base = base.compose(newD);
								for (let existingChange of changes) {
									if (!existingChange.pos.l) {
										if (existingChange.pos.i >= ud.ops[0].retain) {
											existingChange.d.ops[0].retain += ud.ops[1].insert.length;
											existingChange.pos.i = existingChange.d.ops[0].retain;
										}
									}
								}
							} else if (ud.ops[1]?.delete) {
								let l = 0;
								let allL = 0;
								let dl = ud.ops[1].delete;
								const cp = { s: ud.ops[0].retain, f: ud.ops[0].retain + ud.ops[1].delete };
								const toDel: any = [];
								const delsToDel: any = [];
								for (let existingChange of changes) {
									if (existingChange.pos.l) {
										const cl = existingChange.pos.l;
										const ep = {
											s: existingChange.pos.i + allL,
											f: existingChange.pos.i + existingChange.pos.l + allL
										};
										if (ep.f <= cp.s) {
											l += existingChange.pos.l;
										} else if (cp.s <= ep.s && cp.f >= ep.f) {
											dl -= existingChange.pos.l;
											toDel.push(changes.indexOf(existingChange));
										} else if (ep.s < cp.s && ep.f > cp.s) {
											l += cp.s - ep.s;
											dl -= ep.f - cp.s;
											existingChange.cd.ops[0].insert = existingChange.cd.ops[0].insert.slice(
												0,
												cp.s - ep.s
											);
											existingChange.d.ops[1] = existingChange.cd.ops[0];
											existingChange.pos.l = existingChange.cd.ops[0].insert.length;

											const rp = { s: cp.s - ep.s, f: ep.f - ep.s };
											let deleteFound = false;
											let deleteAtts: any = [];
											for (let att of existingChange.attributes) {
												const ap = { s: att.i, f: att.i + att.l };
												if (deleteFound) {
													deleteAtts.push(existingChange.attributes.indexOf(att));
												} else if (ap.s < rp.s && ap.f > rp.s) {
													att.l = ap.f - rp.s;
												} else if (ap.s >= rp.s) {
													deleteAtts.push(existingChange.attributes.indexOf(att));
													deleteFound = true;
												}
											}
											let iaOff = 0;
											for (let dai of deleteAtts) {
												existingChange.attributes.splice(dai - iaOff, 1);
												iaOff++;
											}
											if (existingChange?.deleteChildren) {
												let deleteDFound = false;
												let deleteDCs: any = [];
												for (let dChild of existingChange.deleteChildren) {
													const ap = { s: dChild.i, f: dChild.i + dChild.l };
													if (deleteDFound) {
														deleteDCs.push(existingChange.deleteChildren.indexOf(dChild));
													} else if (ap.s < rp.s && ap.f > rp.s) {
														dChild.l = ap.f - rp.s;
													} else if (ap.s >= rp.s) {
														deleteDCs.push(existingChange.deleteChildren.indexOf(dChild));
														deleteDFound = true;
													}
												}
												let iDOff = 0;
												for (let dai of deleteDCs) {
													existingChange.deleteChildren.splice(dai - iDOff, 1);
													iDOff++;
												}
											}
											if (existingChange?.children) {
												let deleteCFound = false;
												let deleteCs: any = [];
												for (let child of existingChange.children) {
													const ap = { s: child.i, f: child.i + child.l };
													if (deleteCFound) {
														deleteCs.push(existingChange.children.indexOf(child));
													} else if (ap.s < rp.s && ap.f > rp.s) {
														child.l = ap.f - rp.s;
													} else if (ap.s >= rp.s) {
														deleteCs.push(existingChange.children.indexOf(child));
														deleteCFound = true;
													}
												}
												let iCOff = 0;
												for (let dai of deleteCs) {
													existingChange.children.splice(dai - iCOff, 1);
													iCOff++;
												}
											}
										} else if (ep.f > cp.f && ep.s < cp.f) {
											dl -= cp.f - ep.s;
											existingChange.cd.ops[0].insert = existingChange.cd.ops[0].insert.slice(
												cp.f - ep.s
											);
											existingChange.d.ops[1] = existingChange.cd.ops[0];
											existingChange.d.ops[0].retain = cp.s - l;
											existingChange.pos.l = existingChange.cd.ops[0].insert.length;
											existingChange.pos.i = existingChange.d.ops[0].retain;

											const rp = { s: 0, f: cp.f - ep.s };
											let deleteFound = false;
											let deleteAtts: any = [];
											for (let att of existingChange.attributes) {
												const ap = { s: att.i, f: att.i + att.l };
												if (deleteFound) {
													att.i -= rp.f;
												} else if (ap.f <= rp.f) {
													deleteAtts.push(existingChange.attributes.indexOf(att));
												} else if (ap.s < rp.f) {
													att.l = ap.f - rp.f;
													att.i = 0;
												} else if (ap.s >= rp.f) {
													deleteFound = true;
													att.i -= rp.f;
												}
											}
											let iaOff = 0;
											for (let dai of deleteAtts) {
												existingChange.attributes.splice(dai - iaOff, 1);
												iaOff++;
											}
											if (existingChange?.deleteChildren) {
												let deleteDFound = false;
												let deleteDs: any = [];
												for (let dChild of existingChange.deleteChildren) {
													const ap = { s: dChild.i, f: dChild.i + dChild.l };
													if (deleteDFound) {
														dChild.i -= rp.f;
													} else if (ap.f <= rp.f) {
														deleteDs.push(existingChange.deleteChildren.indexOf(dChild));
													} else if (ap.s < rp.f) {
														dChild.l = ap.f - rp.f;
														dChild.i = 0;
													} else if (ap.s >= rp.f) {
														deleteDFound = true;
														dChild.i -= rp.f;
													}
												}
												let iDOff = 0;
												for (let dai of deleteDs) {
													existingChange.deleteChildren.splice(dai - iDOff, 1);
													iDOff++;
												}
											}
											if (existingChange?.children) {
												let deleteDFound = false;
												let deleteCs: any = [];
												for (let child of existingChange.children) {
													const ap = { s: child.i, f: child.i + child.l };
													if (deleteDFound) {
														child.i -= rp.f;
													} else if (ap.f <= rp.f) {
														deleteCs.push(existingChange.children.indexOf(child));
													} else if (ap.s < rp.f) {
														child.l = ap.f - rp.f;
														child.i = 0;
													} else if (ap.s >= rp.f) {
														deleteDFound = true;
														child.i -= rp.f;
													}
												}
												let iCOff = 0;
												for (let dai of deleteCs) {
													existingChange.children.splice(dai - iCOff, 1);
													iCOff++;
												}
											}
										} else if (ep.s >= cp.f) {
											existingChange.pos.i -= dl;
											existingChange.d.ops[0].retain = existingChange.pos.i;
										}
										allL += cl;
									} else {
										const dp = {
											s: existingChange.pos.i,
											f: existingChange.pos.i + existingChange.cd.ops[0].delete
										};
										if (cp.s <= dp.s && cp.f >= dp.f) {
											delsToDel.push(existingChange);
										} else if (dp.s < cp.s && dp.f > cp.s) {
											existingChange.cd.ops[0].delete = cp.s - dp.s;
											existingChange.d.ops[1] = existingChange.cd.ops[0];
										} else if (dp.f > cp.f && dp.s < cp.f) {
											existingChange.cd.ops[0].delete = dp.f - cp.f;
											existingChange.d.ops[1] = existingChange.cd.ops[0];
											existingChange.d.ops[0].retain = cp.s;
											existingChange.pos.i = existingChange.d.ops[0].retain;
										} else if (dp.s >= cp.f) {
											existingChange.pos.i -= dl;
											existingChange.d.ops[0].retain = existingChange.pos.i;
										}
									}
								}
								let diOff = 0;
								for (let del of toDel) {
									changes.splice(del - diOff, 1);
									diOff++;
								}
								for (let del of delsToDel) {
									changes.splice(changes.indexOf(del), 1);
								}
								if (ud.ops[0].retain - l > 0) {
									base = base.compose({
										ops: [{ retain: ud.ops[0].retain - l }, { delete: dl }]
									});
								} else {
									base = base.compose({ ops: [{ delete: dl }] });
								}
							} else if (ud.ops[1]?.retain) {
								if (retainOverflow) {
									delta.ops = [];
								} else {
									base = base.compose({ ops: [{ retain: ud.ops[0].retain - l }, ud.ops[1]] });
								}
							}
						}
					} else {
						if (delta.ops[1]?.delete) {
							delta.ops = [
								{ retain: delta.ops[0].retain },
								{ retain: delta.ops[1].delete, attributes: { color: userColor, strike: true } }
							];
						} else if (delta.ops[1]?.insert) {
							delta.forEach((op: any) => {
								if (op?.insert) {
									if (!op?.attributes) op.attributes = {};
									op.attributes.color = userColor;
									op.attributes.underline = true;
								}
							});
						}
						for (let change of changes) {
							changePos = l + change.pos.i;
							if (currentPos < changePos && change.pos.l) {
								if (ud.ops[1]?.insert) {
									if (delta.ops[1]?.attributes?.strike) delete delta.ops[1].attributes.strike;
									delta.ops[1].attributes.color = userColor;
									const newChange: any = {
										d: new Delta(),
										cd: new Delta(),
										pos: {},
										color: userColor,
										owner: username,
										attributes: []
									};
									newChange.pos.i = currentPos - l;
									newChange.cd = newChange.cd.compose({ ops: [ud.ops[1]] });
									newChange.d = new Delta([{ retain: newChange.pos.i }, newChange.cd.ops[0]]);
									newChange.pos.l = ud.ops[1].insert.length;
									const a: any = {};
									let addA = false;
									for (let key in delta.ops[1].attributes) {
										if (key !== 'color' && key !== 'underline') {
											a[key] = delta.ops[1].attributes[key];
											addA = true;
										}
									}
									if (addA) newChange.attributes.push({ i: 0, l: ud.ops[1].insert.length, a });
									changes.splice(changes.indexOf(change), 0, newChange);
									for (let existingChange of changes) {
										if (!existingChange.pos.l) {
											if (existingChange.pos.i - l >= newChange.pos.i) {
												existingChange.d.ops[0].retain += ud.ops[1].insert.length;
												existingChange.pos.i = existingChange.d.ops[0].retain;
											}
										}
									}
									found = true;
									break;
								} else if (ud.ops[1]?.delete) {
									const newChange: any = {
										d: new Delta(),
										cd: new Delta(),
										pos: { l: 0 },
										color: userColor,
										owner: username
									};
									newChange.pos.i = currentPos;
									newChange.cd = newChange.cd.compose({ ops: [ud.ops[1]] });
									newChange.d = new Delta([{ retain: newChange.pos.i }, newChange.cd.ops[0]]);
									changes.splice(changes.indexOf(change), 0, newChange);
									found = true;
									break;
								}
							} else if (userColor === change.color) {
								if (change.pos.l) {
									const p = currentPos - changePos;
									for (let existingChange of changes) {
										if (!existingChange.pos.l) {
											if (ud.ops[1]?.delete) {
												if (
													existingChange.pos.i <= currentPos + ud.ops[1]?.delete &&
													currentPos <= existingChange.pos.i + existingChange.cd.ops[0].delete
												) {
													inDelete = true;
												}
											} else if (ud.ops[1]?.insert) {
												if (
													existingChange.pos.i < currentPos &&
													currentPos < existingChange.pos.i + existingChange.cd.ops[0].delete
												) {
													inDelete = true;
												}
											}
										}
									}
									if (!inDelete) {
										if (ud.ops[1]?.delete) {
											if (
												changePos <= currentPos &&
												currentPos + ud.ops[1].delete <= changePos + change.pos.l
											) {
												let childFound = false;
												let deleteChildFound = false;
												let delC = [];
												const rp = { s: p, f: p + ud.ops[1].delete };
												if (change?.children) {
													for (let child of change.children) {
														let cp = { s: child.i, f: child.i + child.l };
														if (childFound) {
															child.i -= ud.ops[1].delete;
														} else {
															if (rp.s >= cp.s && rp.f <= cp.f) {
																child.l -= ud.ops[1].delete;
																if (child.l <= 0) delC.push(change.children.indexOf(child));
															} else if (rp.s < cp.s && rp.f > cp.f) {
																delC.push(change.children.indexOf(child));
															} else if (rp.s < cp.s && rp.f > cp.s) {
																child.i = rp.s;
																child.l = cp.f - rp.f;
															} else if (rp.s < cp.f && rp.f > cp.f) {
																child.l -= cp.f - rp.s;
															} else if (cp.s >= rp.f) {
																child.i -= ud.ops[1].delete;
																childFound = true;
															}
														}
													}
												}
												let iOff = 0;
												for (let di of delC) {
													change.children.splice(di - iOff, 1);
													iOff++;
												}

												let delDC = [];
												const rdp = { s: p, f: p + ud.ops[1].delete };
												if (change?.deleteChildren) {
													for (let deleteChild of change.deleteChildren) {
														let dcp = { s: deleteChild.i, f: deleteChild.i + deleteChild.l };
														if (deleteChildFound) {
															deleteChild.i -= ud.ops[1].delete;
														} else {
															if (rdp.s >= dcp.s && rdp.f <= dcp.f) {
																deleteChild.l -= ud.ops[1].delete;
																if (deleteChild.l <= 0)
																	delDC.push(change.deleteChildren.indexOf(deleteChild));
															} else if (rdp.s < dcp.s && rdp.f > dcp.f) {
																delDC.push(change.deleteChildren.indexOf(deleteChild));
															} else if (rdp.s < dcp.s && rdp.f > dcp.s) {
																deleteChild.i = rdp.s;
																deleteChild.l = dcp.f - rdp.f;
															} else if (rdp.s < dcp.f && rdp.f > dcp.f) {
																deleteChild.l -= dcp.f - rdp.s;
															} else if (dcp.s >= rdp.f) {
																deleteChild.i -= ud.ops[1].delete;
																deleteChildFound = true;
															}
														}
													}
												}
												let iDOff = 0;
												for (let di of delDC) {
													change.deleteChildren.splice(di - iDOff, 1);
													iDOff++;
												}

												const dl = ud.ops[1].delete;
												delta = JSON.parse(JSON.stringify(ud));
												if (p) {
													ud = { ops: [{ retain: p }, ud.ops[1]] };
												} else {
													ud = { ops: [ud.ops[1]] };
												}
												change.cd = change.cd.compose(ud);
												change.d.ops[1] = change.cd.ops[0];

												let aFound = false;
												let delI: any = [];
												const dp = { s: p, f: p + dl };

												for (let att of change.attributes) {
													let ap = { s: att.i, f: att.i + att.l };
													if (aFound) {
														att.i -= dl;
													} else {
														if (dp.s >= ap.s && dp.f <= ap.f) {
															att.l -= dl;
															if (att.l <= 0) delI.push(change.attributes.indexOf(att));
														} else if (dp.s < ap.s && dp.f > ap.f) {
															delI.push(change.attributes.indexOf(att));
														} else if (dp.s < ap.s && dp.f > ap.s) {
															att.i = dp.s;
															att.l = ap.f - dp.f;
														} else if (dp.s < ap.f && dp.f > ap.f) {
															att.l -= ap.f - dp.s;
														} else if (ap.s >= dp.f) {
															att.i -= dl;
															aFound = true;
														}
													}
												}
												let iAOff = 0;
												for (let di of delI) {
													change.attributes.splice(di - iAOff, 1);
													iAOff++;
												}

												if (change.d.ops[1]?.insert) {
													change.pos.l = change.d.ops[1].insert.length;
													found = true;
													break;
												} else {
													changes.splice(changes.indexOf(change), 1);
													found = true;
													break;
												}
											}
										} else if (ud.ops[1]?.insert) {
											if (changePos <= currentPos && currentPos <= changePos + change.pos.l) {
												if (delta.ops[1]?.attributes?.strike) delete delta.ops[1].attributes.strike;
												delta.ops[1].attributes.color = userColor;
												let childFound = false;
												if (change?.children) {
													for (let child of change.children) {
														if (childFound) {
															child.i += ud.ops[1].insert.length;
														} else {
															if (child.i < p && p < child.i + child.l) {
																child.l += ud.ops[1].insert.length;
																delta.ops[1].attributes.color = child.owner;
																childFound = true;
															}
															if (child.i >= p) {
																child.i += ud.ops[1].insert.length;
																childFound = true;
															}
														}
													}
												}

												if (change?.deleteChildren) {
													for (let deleteChild of change.deleteChildren) {
														if (deleteChild.i < p && p < deleteChild.i + deleteChild.l) {
															index -= ud.ops[1].insert.length;
															delta.ops = [];
															found = true;
														} else if (deleteChild.i >= p) {
															deleteChild.i += ud.ops[1].insert.length;
														}
													}
												}
												if (found) break;

												const cl = ud.ops[1].insert.length;
												if (p) {
													ud = { ops: [{ retain: p }, ud.ops[1]] };
												} else {
													ud = { ops: [ud.ops[1]] };
												}
												change.cd = change.cd.compose(ud);
												change.d.ops[1] = change.cd.ops[0];
												change.pos.l = change.d.ops[1].insert.length;
												const a: any = {};
												let addA = false;
												let ai: any = false;
												let aIns: any = false;
												for (let key in delta.ops[1].attributes) {
													if (key !== 'color' && key !== 'underline') {
														a[key] = delta.ops[1].attributes[key];
														addA = true;
													}
												}
												if (addA) {
													let aFound = false;

													for (let att of change.attributes) {
														if (aFound) {
															att.i += cl;
														} else if (att.i <= p && p <= att.i + att.l) {
															if (JSON.stringify(a) === JSON.stringify(att.a)) {
																att.l += cl;
															} else if (att.i < p && p < att.i + att.l) {
																aIns = change.attributes.indexOf(att);
															} else if (att.i === p) {
																ai = change.attributes.indexOf(att);
															} else {
																ai = change.attributes.indexOf(att) + 1;
															}
															aFound = true;
														} else if (p < att.i) {
															aFound = true;
															att.i += cl;
															ai = change.attributes.indexOf(att);
														}
													}
													if (!aFound) {
														change.attributes.push({ i: p, l: cl, a });
													}

													if (ai !== false) {
														change.attributes.splice(ai, 0, { i: p, l: cl, a });
													} else if (aIns !== false) {
														const prevAL = change.attributes[aIns].l;
														change.attributes[aIns].l = p - change.attributes[aIns].i;
														change.attributes.splice(aIns + 1, 0, { i: p, l: cl, a });
														change.attributes.splice(aIns + 2, 0, {
															i: p + cl,
															l: prevAL - change.attributes[aIns].l,
															a: change.attributes[aIns].a
														});
													}
												} else {
													let aFound = false;
													for (let att of change.attributes) {
														if (aFound) {
															att.i += cl;
														} else if (att.i <= p && p <= att.i + att.l) {
															if (att.i < p && p < att.i + att.l) {
																aIns = change.attributes.indexOf(att);
															} else if (att.i === p) {
																att.i += cl;
															}
															aFound = true;
														} else if (p < att.i) {
															aFound = true;
															att.i += cl;
															ai = change.attributes.indexOf(att) + 1;
														}
													}
													if (aIns !== false) {
														const prevAL = change.attributes[aIns].l;
														change.attributes[aIns].l = p - change.attributes[aIns].i;
														change.attributes.splice(aIns + 1, 0, {
															i: p + cl,
															l: prevAL - change.attributes[aIns].l,
															a: change.attributes[aIns].a
														});
													}
												}

												for (let existingChange of changes) {
													if (!existingChange.pos.l) {
														if (existingChange.pos.i - l >= change.pos.i) {
															existingChange.d.ops[0].retain += cl;
															existingChange.pos.i = existingChange.d.ops[0].retain;
														}
													}
												}
												found = true;
												break;
											}
										} else if (ud.ops[1]?.retain) {
											if (
												changePos <= currentPos &&
												currentPos + ud.ops[1].retain <= changePos + change.pos.l
											) {
												const a: any = {};
												let addA = false;
												let insertAs = [];
												for (let key in ud.ops[1].attributes) {
													if (key !== 'color' && key !== 'underline') {
														a[key] = ud.ops[1].attributes[key];
														addA = true;
													}
												}
												const al = ud.ops[1].retain;
												const ap = { s: p, f: p + al };
												let prevF = ap.s;

												if (addA) {
													let aFound = false;
													for (let att of change.attributes) {
														const eap = { s: att.i, f: att.i + att.l };
														if (ap.s <= eap.s && eap.f <= ap.f) {
															att.a = { ...att.a, ...a };
															if (prevF !== eap.s) {
																insertAs.push({
																	p: 0,
																	ea: att,
																	i: prevF,
																	l: eap.s - prevF,
																	a
																});
															}
															prevF = eap.f;
															aFound = true;
														} else if (ap.s < eap.s && ap.f > eap.s) {
															att.i += ap.f - eap.s;
															att.l -= ap.f - eap.s;
															insertAs.push({
																p: 0,
																ea: att,
																i: eap.s,
																l: ap.f - eap.s,
																a: { ...att.a, ...a }
															});
															if (prevF !== eap.s) {
																insertAs.push({
																	p: 0,
																	ea: att,
																	i: prevF,
																	l: eap.s - prevF,
																	a
																});
															}
															prevF = ap.f;
															aFound = true;
														} else if (ap.s < eap.f && ap.f > eap.f) {
															att.l = ap.s - eap.s;
															insertAs.push({
																p: 1,
																ea: att,
																i: ap.s,
																l: eap.f - ap.s,
																a: { ...att.a, ...a }
															});
															prevF = eap.f;
															aFound = true;
														} else if (ap.s > eap.s && ap.f < eap.f) {
															att.l = ap.s - eap.s;
															insertAs.push({
																p: 1,
																ea: att,
																i: ap.f,
																l: eap.f - ap.f,
																a: att.a
															});
															insertAs.push({
																p: 1,
																ea: att,
																i: ap.s,
																l: al,
																a: { ...att.a, ...a }
															});

															aFound = true;
															break;
														}
													}
													if (!aFound) {
														if (change.attributes.length) {
															for (let att of change.attributes) {
																if (att.i > p) {
																	change.attributes.splice(change.attributes.indexOf(att), 0, {
																		i: p,
																		l: al,
																		a
																	});
																	aFound = true;
																	break;
																}
															}
															if (!aFound) {
																change.attributes.push({
																	i: p,
																	l: al,
																	a
																});
															}
														} else {
															change.attributes.push({
																i: p,
																l: al,
																a
															});
														}
													} else if (prevF !== ap.f) {
														change.attributes.push({
															i: prevF,
															l: ap.f - prevF,
															a
														});
													}
													for (let inA of insertAs) {
														change.attributes.splice(change.attributes.indexOf(inA.ea) + inA.p, 0, {
															i: inA.i,
															l: inA.l,
															a: inA.a
														});
													}
												}

												found = true;
												break;
											}
										}
									}
								} else {
									if (ud.ops[1]?.delete) {
										if (
											change.pos.i <= currentPos + ud.ops[1].delete &&
											currentPos <= change.pos.i + change.cd.ops[0].delete
										) {
											if (currentPos < change.pos.i) {
												change.cd.ops[0].delete += change.pos.i - currentPos;
												change.pos.i = currentPos;
												change.d.ops[0].retain = currentPos;
												change.d.ops[1] = change.cd.ops[0];
											}
											if (currentPos + ud.ops[1].delete > change.pos.i + change.cd.ops[0].delete) {
												change.cd.ops[0].delete +=
													currentPos + ud.ops[1].delete - (change.pos.i + change.cd.ops[0].delete);
												change.d.ops[1] = change.cd.ops[0];
											}
											found = true;
											break;
										}
									} else if (ud.ops[1]?.insert) {
										if (
											change.pos.i < currentPos &&
											currentPos < change.pos.i + change.cd.ops[0].delete
										) {
											index -= ud.ops[1].insert.length;
											delta.ops = [];
											found = true;
											break;
										}
									}
								}
							} else {
								const p = currentPos - changePos;
								if (change.pos.l) {
									for (let existingChange of changes) {
										if (!existingChange.pos.l) {
											if (ud.ops[1]?.delete) {
												if (
													existingChange.pos.i <= currentPos + ud.ops[1]?.delete &&
													currentPos <= existingChange.pos.i + existingChange.cd.ops[0].delete
												) {
													inDelete = true;
												}
											} else if (ud.ops[1]?.insert) {
												if (
													existingChange.pos.i < currentPos &&
													currentPos < existingChange.pos.i + existingChange.cd.ops[0].delete
												) {
													inDelete = true;
												}
											}
										}
									}
									if (!inDelete) {
										if (ud.ops[1]?.delete) {
											if (
												changePos <= currentPos &&
												currentPos + ud.ops[1].delete <= changePos + change.pos.l
											) {
												let deleteChildFound = false;
												let childFound = false;
												let remove = false;

												if (change?.children) {
													for (let child of change.children) {
														if (childFound) {
															child.i -= ud.ops[1].delete;
														} else if (child.owner === userColor) {
															if (child.i <= p && p + ud.ops[1].delete <= child.i + child.l) {
																delta = JSON.parse(JSON.stringify(ud));
																child.l -= ud.ops[1].delete;
																if (child.l <= 0) remove = change.children.indexOf(child);

																const dl = ud.ops[1].delete;
																if (p) {
																	ud = { ops: [{ retain: p }, ud.ops[1]] };
																} else {
																	ud = { ops: [ud.ops[1]] };
																}
																change.cd = change.cd.compose(ud);
																change.d.ops[1] = change.cd.ops[0];
																change.pos.l = change.d.ops[1].insert.length;
																let aFound = false;
																let delI: any = [];
																const dp = { s: p, f: p + dl };

																let delDC = [];
																const rdp = { s: p, f: p + ud.ops[1].delete };
																if (change?.deleteChildren) {
																	for (let deleteChild of change.deleteChildren) {
																		let dcp = {
																			s: deleteChild.i,
																			f: deleteChild.i + deleteChild.l
																		};
																		if (deleteChildFound) {
																			deleteChild.i -= ud.ops[1].delete;
																		} else {
																			if (rdp.s >= dcp.s && rdp.f <= dcp.f) {
																				deleteChild.l -= ud.ops[1].delete;
																				if (deleteChild.l <= 0)
																					delDC.push(change.deleteChildren.indexOf(deleteChild));
																			} else if (rdp.s < dcp.s && rdp.f > dcp.f) {
																				delDC.push(change.deleteChildren.indexOf(deleteChild));
																			} else if (rdp.s < dcp.s && rdp.f > dcp.s) {
																				deleteChild.i = rdp.s;
																				deleteChild.l = dcp.f - rdp.f;
																			} else if (rdp.s < dcp.f && rdp.f > dcp.f) {
																				deleteChild.l -= dcp.f - rdp.s;
																			} else if (dcp.s >= rdp.f) {
																				deleteChild.i -= ud.ops[1].delete;
																				deleteChildFound = true;
																			}
																		}
																	}
																}
																let iDOff = 0;
																for (let di of delDC) {
																	change.deleteChildren.splice(di - iDOff, 1);
																	iDOff++;
																}

																for (let att of change.attributes) {
																	let ap = { s: att.i, f: att.i + att.l };
																	if (aFound) {
																		att.i -= dl;
																	} else {
																		if (dp.s >= ap.s && dp.f <= ap.f) {
																			att.l -= dl;
																			if (att.l <= 0) delI.push(change.attributes.indexOf(att));
																		} else if (dp.s < ap.s && dp.f > ap.f) {
																			delI.push(change.attributes.indexOf(att));
																		} else if (dp.s < ap.s && dp.f > ap.s) {
																			att.i = dp.s;
																			att.l = ap.f - dp.f;
																		} else if (dp.s < ap.f && dp.f > ap.f) {
																			att.l -= ap.f - dp.s;
																		} else if (ap.s >= dp.f) {
																			att.i -= dl;
																			aFound = true;
																		}
																	}
																}
																let iOff = 0;
																for (let di of delI) {
																	change.attributes.splice(di - iOff, 1);
																	iOff++;
																}

																childFound = true;
															}
														}
													}
												}
												if (childFound) {
													if (remove !== false) change.children.splice(remove, 1);
													if (change?.deleteChildren) {
														for (let deleteChild of change.deleteChildren) {
															if (deleteChild.i > p) {
																deleteChild.i -= ud.ops[1].delete;
															}
														}
													}
												}

												if (!childFound && change?.deleteChildren) {
													for (let deleteChild of change.deleteChildren) {
														if (
															deleteChild.i - ud.ops[1].delete <= p &&
															p <= deleteChild.i + deleteChild.l
														) {
															let newP = p - deleteChild.i;
															if (newP < 0) {
																deleteChild.i += newP;
																deleteChild.l -= newP;
																newP = 0;
															}
															if (newP + ud.ops[1].delete > deleteChild.l) {
																deleteChild.l = newP + ud.ops[1].delete;
															}
															deleteChildFound = true;
															break;
														}
													}
												}

												if (!deleteChildFound && !childFound) {
													if (!change?.deleteChildren) {
														change.deleteChildren = [
															{ i: p, l: ud.ops[1].delete, owner: userColor, ownerName: username }
														];
														deleteChildFound = true;
													} else {
														for (let deleteChild of change.deleteChildren) {
															if (deleteChild.i > p) {
																change.deleteChildren.splice(
																	change.deleteChildren.indexOf(deleteChild),
																	0,
																	{
																		i: p,
																		l: ud.ops[1].delete,
																		owner: userColor,
																		ownerName: username
																	}
																);
																deleteChildFound = true;
																break;
															}
														}
													}
												}
												if (!deleteChildFound && !childFound) {
													change.deleteChildren.push({
														i: p,
														l: ud.ops[1].delete,
														owner: userColor,
														ownerName: username
													});
												}

												found = true;
												break;
											}
										} else if (ud.ops[1]?.insert) {
											if (changePos === currentPos) {
												if (delta.ops[1]?.attributes?.strike) delete delta.ops[1].attributes.strike;
												delta.ops[1].attributes.color = userColor;
												const newChange: any = {
													d: new Delta(),
													cd: new Delta(),
													pos: {},
													color: userColor,
													owner: username,
													attributes: []
												};
												newChange.pos.i = currentPos - l;
												newChange.cd = newChange.cd.compose({ ops: [ud.ops[1]] });
												newChange.d = new Delta([{ retain: newChange.pos.i }, newChange.cd.ops[0]]);
												newChange.pos.l = ud.ops[1].insert.length;
												const a: any = {};
												let addA = false;
												for (let key in delta.ops[1].attributes) {
													if (key !== 'color' && key !== 'underline') {
														a[key] = delta.ops[1].attributes[key];
														addA = true;
													}
												}
												if (addA)
													newChange.attributes.push({ i: 0, l: ud.ops[1].insert.length, a });
												changes.splice(changes.indexOf(change), 0, newChange);
												found = true;
											} else if (
												currentPos === changePos + change.pos.l &&
												changes[changes.indexOf(change) + 1]?.pos.i + l + change.pos.l !==
													currentPos
											) {
												if (delta.ops[1]?.attributes?.strike) delete delta.ops[1].attributes.strike;
												delta.ops[1].attributes.color = userColor;
												const newChange: any = {
													d: new Delta(),
													cd: new Delta(),
													pos: {},
													color: userColor,
													owner: username,
													attributes: []
												};
												newChange.pos.i = currentPos - l - change.pos.l;
												newChange.cd = newChange.cd.compose({ ops: [ud.ops[1]] });
												newChange.d = new Delta([{ retain: newChange.pos.i }, newChange.cd.ops[0]]);
												newChange.pos.l = ud.ops[1].insert.length;
												const a: any = {};
												let addA = false;
												for (let key in delta.ops[1].attributes) {
													if (key !== 'color' && key !== 'underline') {
														a[key] = delta.ops[1].attributes[key];
														addA = true;
													}
												}
												if (addA)
													newChange.attributes.push({ i: 0, l: ud.ops[1].insert.length, a });
												changes.splice(changes.indexOf(change) + 1, 0, newChange);
												found = true;
											} else if (changePos < currentPos && currentPos < changePos + change.pos.l) {
												if (delta.ops[1]?.attributes?.strike) delete delta.ops[1].attributes.strike;
												const p = currentPos - changePos;
												let childFound = false;
												if (change?.children) {
													for (let child of change.children) {
														if (childFound) {
															child.i += ud.ops[1].insert.length;
														} else {
															if (child.i <= p && p <= child.i + child.l) {
																child.l += ud.ops[1].insert.length;
																childFound = true;
															} else if (p < child.i) {
																change.children.splice(change.children.indexOf(child), 0, {
																	i: p,
																	l: ud.ops[1].insert.length,
																	owner: userColor,
																	ownerName: username
																});
																childFound = true;
															}
														}
													}
												} else {
													change.children = [];
													change.children.push({
														i: p,
														l: ud.ops[1].insert.length,
														owner: userColor,
														ownerName: username
													});
													childFound = true;
												}
												if (!childFound) {
													change.children.push({
														i: p,
														l: ud.ops[1].insert.length,
														owner: userColor,
														ownerName: username
													});
												}
												if (change?.deleteChildren) {
													for (let deleteChild of change.deleteChildren) {
														if (deleteChild.i < p && p < deleteChild.i + deleteChild.l) {
															index -= ud.ops[1].insert.length;
															delta.ops = [];
															found = true;
														} else if (deleteChild.i >= p) {
															deleteChild.i += ud.ops[1].insert.length;
														}
													}
												}
												if (found) break;

												const cl = ud.ops[1].insert.length;
												if (p) {
													ud = { ops: [{ retain: p }, ud.ops[1]] };
												} else {
													ud = { ops: [ud.ops[1]] };
												}
												change.cd = change.cd.compose(ud);
												change.d.ops[1] = change.cd.ops[0];
												change.pos.l = change.d.ops[1].insert.length;
												const a: any = {};
												let addA = false;
												let ai: any = false;
												let aIns: any = false;
												for (let key in delta.ops[1].attributes) {
													if (key !== 'color' && key !== 'underline') {
														a[key] = delta.ops[1].attributes[key];
														addA = true;
													}
												}
												if (addA) {
													let aFound = false;

													for (let att of change.attributes) {
														if (aFound) {
															att.i += cl;
														} else if (att.i <= p && p <= att.i + att.l) {
															if (JSON.stringify(a) === JSON.stringify(att.a)) {
																att.l += cl;
															} else if (att.i < p && p < att.i + att.l) {
																aIns = change.attributes.indexOf(att);
															} else if (att.i === p) {
																ai = change.attributes.indexOf(att);
															} else {
																ai = change.attributes.indexOf(att) + 1;
															}
															aFound = true;
														} else if (p < att.i) {
															aFound = true;
															att.i += cl;
															ai = change.attributes.indexOf(att);
														}
													}
													if (!aFound) {
														change.attributes.push({ i: p, l: cl, a });
													}

													if (ai !== false) {
														change.attributes.splice(ai, 0, { i: p, l: cl, a });
													} else if (aIns !== false) {
														const prevAL = change.attributes[aIns].l;
														change.attributes[aIns].l = p - change.attributes[aIns].i;
														change.attributes.splice(aIns + 1, 0, { i: p, l: cl, a });
														change.attributes.splice(aIns + 2, 0, {
															i: p + cl,
															l: prevAL - change.attributes[aIns].l,
															a: change.attributes[aIns].a
														});
													}
												} else {
													let aFound = false;
													for (let att of change.attributes) {
														if (aFound) {
															att.i += cl;
														} else if (att.i <= p && p <= att.i + att.l) {
															if (att.i < p && p < att.i + att.l) {
																aIns = change.attributes.indexOf(att);
															} else if (att.i === p) {
																att.i += cl;
															}
															aFound = true;
														} else if (p < att.i) {
															aFound = true;
															att.i += cl;
															ai = change.attributes.indexOf(att) + 1;
														}
													}
													if (aIns !== false) {
														const prevAL = change.attributes[aIns].l;
														change.attributes[aIns].l = p - change.attributes[aIns].i;
														change.attributes.splice(aIns + 1, 0, {
															i: p + cl,
															l: prevAL - change.attributes[aIns].l,
															a: change.attributes[aIns].a
														});
													}
												}

												found = true;
											}
											if (found) {
												for (let existingChange of changes) {
													if (!existingChange.pos.l) {
														if (existingChange.pos.i - l >= change.pos.i) {
															existingChange.d.ops[0].retain += ud.ops[1].insert.length;
															existingChange.pos.i = existingChange.d.ops[0].retain;
														}
													}
												}
												break;
											}
										}
									}
								} else {
									if (ud.ops[1]?.delete) {
										if (
											change.pos.i - ud.ops[1].delete <= currentPos &&
											currentPos <= change.pos.i + change.cd.ops[0].delete
										) {
											delta.ops[1].attributes.color = change.color;
											let newP = p;
											if (p < 0) {
												change.pos.i += p;
												change.cd.ops[0].delete -= p;
												change.d.ops[0].retain += p;
												newP = 0;
											}
											if (newP + ud.ops[1].delete > change.cd.ops[0].delete) {
												change.cd.ops[0].delete = newP + ud.ops[1].delete;
											}
											change.d.ops[1] = change.cd.ops[0];
											found = true;
											break;
										}
									} else if (ud.ops[1]?.insert) {
										if (
											change.pos.i < currentPos &&
											currentPos < change.pos.i + change.cd.ops[0].delete
										) {
											index -= ud.ops[1].insert.length;
											delta.ops = [];
											found = true;
											break;
										}
									}
								}
							}
							l += change.pos.l;
						}
						if (!found) {
							if (ud.ops[1]?.insert) {
								if (delta.ops[1]?.attributes?.strike) delete delta.ops[1].attributes.strike;
								delta.ops[1].attributes.color = userColor;
								const newChange: any = {
									cd: new Delta(),
									pos: {},
									color: userColor,
									owner: username,
									attributes: []
								};
								newChange.pos.i = currentPos - l;
								newChange.cd = newChange.cd.compose({ ops: [ud.ops[1]] });
								newChange.d = new Delta([{ retain: newChange.pos.i }, newChange.cd.ops[0]]);
								newChange.pos.l = ud.ops[1].insert.length;
								const a: any = {};
								let addA = false;
								for (let key in delta.ops[1].attributes) {
									if (key !== 'color' && key !== 'underline') {
										a[key] = delta.ops[1].attributes[key];
										addA = true;
									}
								}
								if (addA) newChange.attributes.push({ i: 0, l: ud.ops[1].insert.length, a });
								for (let existingChange of changes) {
									if (!existingChange.pos.l) {
										if (existingChange.pos.i - l >= newChange.pos.i) {
											existingChange.d.ops[0].retain += ud.ops[1].insert.length;
											existingChange.pos.i = existingChange.d.ops[0].retain;
										}
									}
								}
								changes.push(newChange);
							} else if (ud.ops[1]?.delete) {
								const newChange: any = {
									d: new Delta(),
									cd: new Delta(),
									pos: { l: 0 },
									color: userColor,
									owner: username
								};
								newChange.pos.i = currentPos;
								newChange.cd = newChange.cd.compose({ ops: [ud.ops[1]] });
								newChange.d = new Delta([{ retain: newChange.pos.i }, newChange.cd.ops[0]]);
								changes.push(newChange);
							} else if (ud.ops[1]?.retain) {
								delta.ops = [];
							}
						}
					}
					if (delta.ops[0]?.retain === 0) {
						delta.ops.splice(0, 1);
					}
					quill.setContents(oldDelta.compose(delta));
					quill.setSelection(index);
					if (currentHistory !== false) {
						historyStack.splice(currentHistory + 1, historyStack.length);
						currentHistory = false;
					}
					fromShiftZ = false;
					editCounter++;
					if (editCounter % 4 === 0) {
						if (historyStack.length > 100) {
							historyStack.splice(0, 1);
						}
						if (userColor === 'owner') {
							const newHis = {
								b: new Delta(JSON.parse(JSON.stringify(base))),
								c: JSON.parse(JSON.stringify(changes))
							};
							for (let chan of newHis.c) {
								chan.cd = new Delta(chan.cd);
							}
							historyStack.push(newHis);
						} else {
							const newHis = {
								c: JSON.parse(JSON.stringify(changes))
							};
							for (let chan of newHis.c) {
								chan.cd = new Delta(chan.cd);
							}
							historyStack.push(newHis);
						}
					}
					sections.find((s: any) => s.title === title).base = base;
					sections = sections.map((section: any) => ({
						...section,
						suggestions: section.suggestions.map((suggestion: any) => ({ ...suggestion }))
					}));
					switchCurrent(sections.find((s: any) => s.title === title));
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
		const Italic = Quill.import('formats/italic');
		const Color = Quill.import('formats/color');
		const Script = Quill.import('formats/script');
		const Strike = Quill.import('formats/strike');
		const Underline = Quill.import('formats/underline');

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
			Underline
		);
		quillOptions.registry = registry;

		sections[0].quill = new Quill(sections[0].editor, quillOptions);

		title = treeData.data.title;
		base = new Delta(treeData.data.tldr);
		currentQuill = sections[0].quill;
		updateQuillWithChanges();

		enableQuills(false);

		if (treeData.id === 'r') {
			setTimeout(() => {
				quillsReady.set(true);
			}, 100);
		}
	});
	onDestroy(() => {
		window.removeEventListener('keydown', handleKeyDown);
		if (problemChannel) data.supabase.removeChannel(problemChannel);
		problemChannel = undefined;

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
		if (problemChannel) data.supabase.removeChannel(problemChannel);
		problemChannel = undefined;
		window.removeEventListener('keydown', handleKeyDown);
		out = false;
		save(true);
		isSaving = false;
		sectionsReady = false;
		nodeReady = false;
		enableQuills(false);
		if (editable) {
			unactivateUser();
			emptyQuillsOfSuggestions();
		}
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
		} else if (e.key === 'v' && (e.metaKey || e.ctrlKey)) {
			pasting = true;
		} else if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
			saved = false;
			if (historyStack.length > 1) {
				if (e.shiftKey) {
					if (currentHistory !== false && currentHistory !== historyStack.length - 1) {
						currentQuill.blur();
						currentHistory++;
						const his = historyStack[currentHistory];
						if (his?.b) {
							const c = JSON.parse(JSON.stringify(his.c));
							for (let chan of c) {
								chan.cd = new Delta(chan.cd);
							}
							base = new Delta(JSON.parse(JSON.stringify(his.b)));
							changes = c;
						} else {
							const c = JSON.parse(JSON.stringify(his.c));
							for (let chan of c) {
								chan.cd = new Delta(chan.cd);
							}
							changes = c;
						}
						updateQuillWithChanges();
						if (currentHistory >= historyStack.length - 1) {
							currentHistory = false;
						}
						fromShiftZ = true;
					}
				} else {
					currentQuill.blur();
					if (currentHistory === false) {
						if (editCounter % 4 !== 0 && !fromShiftZ) {
							if (historyStack.length > 100) {
								historyStack.splice(0, 1);
							}
							if (userColor === 'owner') {
								const newHis = {
									b: new Delta(JSON.parse(JSON.stringify(base))),
									c: JSON.parse(JSON.stringify(changes))
								};
								for (let chan of newHis.c) {
									chan.cd = new Delta(chan.cd);
								}
								historyStack.push(newHis);
							} else {
								const newHis = {
									c: JSON.parse(JSON.stringify(changes))
								};
								for (let chan of newHis.c) {
									chan.cd = new Delta(chan.cd);
								}
								historyStack.push(newHis);
							}
						}
						currentHistory = historyStack.length - 2;
					} else {
						currentHistory = Math.max(0, currentHistory - 1);
					}
					const his = historyStack[currentHistory];
					if (his?.b) {
						const c = JSON.parse(JSON.stringify(his.c));
						for (let chan of c) {
							chan.cd = new Delta(chan.cd);
						}
						base = new Delta(JSON.parse(JSON.stringify(his.b)));
						changes = c;
					} else {
						const c = JSON.parse(JSON.stringify(his.c));
						for (let chan of c) {
							chan.cd = new Delta(chan.cd);
						}
						changes = c;
					}
					updateQuillWithChanges();
				}
			}
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
					$sectionModal.suggestions = [
						'Prerequisites',
						'Measurable Objective',
						'Skills Needed',
						'Existing Work',
						'References'
					];
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
			if (userColor === 'owner') {
				const newHis = {
					b: new Delta(JSON.parse(JSON.stringify(section.base))),
					c: section.suggestions ? JSON.parse(JSON.stringify(section.suggestions)) : []
				};
				for (let chan of newHis.c) {
					chan.cd = new Delta(chan.cd);
				}
				section.history.push(newHis);
			} else {
				const newHis = {
					c: section.suggestions ? JSON.parse(JSON.stringify(section.suggestions)) : []
				};
				for (let chan of newHis.c) {
					chan.cd = new Delta(chan.cd);
				}
				section.history.push(newHis);
			}
		}
		switchCurrent(sections[0]);
		window.addEventListener('keydown', handleKeyDown);
		treeAction.set('calibrate-node-height');
	}
	function updateQuillData(bases: any, suggestions: any) {
		emptyQuills();
		sections[0].base = new Delta(bases[0]);
		bases.splice(0, 1);
		for (let b of bases) {
			sections.push({ base: new Delta(b.delta), title: b.title, history: [] });
		}
		for (let c of suggestions) {
			for (let chan of c.changes) {
				chan.cd = new Delta(chan.cd);
			}
			sections.find((s: any) => s.title === c.title).suggestions = c.changes;
		}
	}
	function fillQuillsWithSuggestions() {
		for (let section of sections) {
			if (section?.suggestions) {
				updateQuillWithChanges(section.suggestions, section.base, section.quill);
			}
		}
	}
	function emptyQuillsOfSuggestions() {
		for (let section of sections) {
			section.quill.setContents(section.base);
			section.history = [];
		}
	}
	function switchCurrent(section: any) {
		historyStack = section.history;
		currentQuill = section.quill;
		currentEditor = section?.editor;
		base = section.base;
		changes = section?.suggestions ?? [];
		currentSection = section.title;
	}
	function loadData() {
		problemChannel = data.supabase
			.channel('schema-db-changes')
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'Problems',
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
							emptyQuillsOfSuggestions();
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
		data.supabase
			.from('Problems')
			.select('*')
			.eq('uuid', treeData.uuid)
			.then(({ data: problemData }) => {
				if (problemData) {
					currentUser = problemData[0].active_user;
					if (currentUser === username || !currentUser) editBtnActive = true;
					else {
						const now = Date.now();
						if (now - problemData[0].last_edit >= 100000) editBtnActive = true;
						else {
							editBtnActive = false;
							clearTimeout(sessionTimeout);
							sessionTimeout = setTimeout(
								() => {
									editBtnActive = true;
								},
								100000 - (now - problemData[0].last_edit)
							);
						}
					}
					const bases = JSON.parse(
						JSON.stringify([problemData[0].tldr, ...problemData[0].content])
					);
					const suggestions = JSON.parse(JSON.stringify(problemData[0].suggestions));
					updateQuillData(bases, suggestions);
					if (nodeReady) {
						fillQuills();
					} else sectionsReady = true;
				}
			});
	}

	function approveChange(change: any, i: number, section: any) {
		saved = false;
		switchCurrent(section);
		changes.splice(i, 1);
		if (change.pos.l) {
			const toAdd = [];
			let changeL = change.pos.l;
			if (change?.children) {
				let si = i;
				const changeStr = change.cd.ops[0].insert;
				let newStr = '';
				let prevI = 0;
				let l = 0;
				for (let child of change.children) {
					const newChange: any = {
						d: new Delta([
							{ retain: change.pos.i + child.i + l },
							{ insert: changeStr.slice(child.i, child.i + child.l) }
						]),
						cd: new Delta([{ insert: changeStr.slice(child.i, child.i + child.l) }]),
						pos: { i: change.pos.i + child.i + l, l: child.l },
						color: child.owner,
						owner: child.ownerName,
						attributes: []
					};
					let deleteAtts: any = [];
					let childFound = false;
					const cp = { s: child.i + l, f: child.l + child.i + l };
					for (let att of change.attributes) {
						const ap = { s: att.i, f: att.i + att.l };
						if (childFound) {
							att.i -= child.l;
						} else if (ap.f > cp.s && ap.s < cp.f) {
							if (ap.s < cp.s && ap.f > cp.f) {
								newChange.attributes.push({ i: 0, l: child.l, a: att.a });
								att.l -= child.l;
							} else if (cp.s <= ap.s && ap.f <= cp.f) {
								newChange.attributes.push({ i: ap.s - cp.s, l: att.l, a: att.a });
								deleteAtts.push(change.attributes.indexOf(att));
							} else if (cp.s > ap.s && ap.f <= cp.f) {
								att.l = cp.s - ap.s;
								newChange.attributes.push({ i: 0, l: child.l, a: att.a });
							} else if (ap.f > cp.f) {
								att.i = cp.s;
								att.l = ap.f - cp.f;
								newChange.attributes.push({ i: ap.s, l: cp.f - ap.s, a: att.a });
							}
						} else if (ap.s >= cp.f) {
							att.i -= child.l;
							childFound;
						}
					}
					let iaOff = 0;
					for (let dai of deleteAtts) {
						change.attributes.splice(dai - iaOff, 1);
						iaOff++;
					}
					toAdd.push({ i: si, d: newChange });
					si++;
					newStr += changeStr.slice(prevI, child.i);
					l -= child.l;
					prevI = child.i + child.l;
					changeL -= child.l;
				}
				if (changeStr.length - 1 > prevI) {
					newStr += changeStr.slice(prevI);
				}
				change.cd.ops[0].insert = newStr;
			}
			if (change?.deleteChildren) {
				for (let deleteChild of change.deleteChildren) {
					let si = i;
					const newChange = {
						d: new Delta([{ retain: change.pos.i + deleteChild.i }, { delete: deleteChild.l }]),
						cd: new Delta([{ delete: deleteChild.l }]),
						pos: { i: change.pos.i + deleteChild.i, l: 0 },
						color: deleteChild.owner,
						owner: deleteChild.ownerName
					};
					toAdd.push({ i: si, d: newChange });
					si++;
				}
			}

			for (let att of change.attributes) {
				if (att.i) {
					change.cd = change.cd.compose({
						ops: [{ retain: att.i }, { retain: att.l, attributes: att.a }]
					});
				} else {
					change.cd = change.cd.compose({
						ops: [{ retain: att.l, attributes: att.a }]
					});
				}
			}
			if (change.d.ops[0]?.retain) {
				base = base.compose({ ops: [change.d.ops[0], ...change.cd.ops] });
			} else {
				base = base.compose(change.cd);
			}
			for (let existingChange of changes) {
				if (existingChange.pos.l) {
					if (existingChange.pos.i > change.pos.i) {
						existingChange.d.ops[0].retain += changeL;
						existingChange.pos.i += changeL;
					} else if (existingChange.pos.i === change.pos.i) {
						if (changes.indexOf(existingChange) >= i) {
							existingChange.d.ops[0].retain += changeL;
							existingChange.pos.i += changeL;
						}
					}
				}
			}
			for (let add of toAdd) {
				changes.splice(add.i, 0, add.d);
			}
		} else {
			let l = 0;
			let allL = 0;
			let dl = change.cd.ops[0].delete;
			const cp = { s: change.pos.i, f: change.pos.i + change.cd.ops[0].delete };
			const toDel: any = [];
			const delsToDel: any = [];
			for (let existingChange of changes) {
				if (existingChange.pos.l) {
					const cl = existingChange.pos.l;
					const ep = {
						s: existingChange.pos.i + allL,
						f: existingChange.pos.i + existingChange.pos.l + allL
					};
					if (ep.f <= cp.s) {
						l += existingChange.pos.l;
					} else if (cp.s <= ep.s && cp.f >= ep.f) {
						dl -= existingChange.pos.l;
						toDel.push(changes.indexOf(existingChange));
					} else if (ep.s < cp.s && ep.f > cp.s) {
						l += cp.s - ep.s;
						dl -= ep.f - cp.s;
						existingChange.cd.ops[0].insert = existingChange.cd.ops[0].insert.slice(0, cp.s - ep.s);
						existingChange.d.ops[1] = existingChange.cd.ops[0];
						existingChange.pos.l = existingChange.cd.ops[0].insert.length;

						const rp = { s: cp.s - ep.s, f: ep.f - ep.s };
						let deleteFound = false;
						let deleteAtts: any = [];
						for (let att of existingChange.attributes) {
							const ap = { s: att.i, f: att.i + att.l };
							if (deleteFound) {
								deleteAtts.push(existingChange.attributes.indexOf(att));
							} else if (ap.s < rp.s && ap.f > rp.s) {
								att.l = ap.f - rp.s;
							} else if (ap.s >= rp.s) {
								deleteAtts.push(existingChange.attributes.indexOf(att));
								deleteFound = true;
							}
						}
						let iaOff = 0;
						for (let dai of deleteAtts) {
							existingChange.attributes.splice(dai - iaOff, 1);
							iaOff++;
						}
						if (existingChange?.deleteChildren) {
							let deleteDFound = false;
							let deleteDCs: any = [];
							for (let dChild of existingChange.deleteChildren) {
								const ap = { s: dChild.i, f: dChild.i + dChild.l };
								if (deleteDFound) {
									deleteDCs.push(existingChange.deleteChildren.indexOf(dChild));
								} else if (ap.s < rp.s && ap.f > rp.s) {
									dChild.l = ap.f - rp.s;
								} else if (ap.s >= rp.s) {
									deleteDCs.push(existingChange.deleteChildren.indexOf(dChild));
									deleteDFound = true;
								}
							}
							let iDOff = 0;
							for (let dai of deleteDCs) {
								existingChange.deleteChildren.splice(dai - iDOff, 1);
								iDOff++;
							}
						}
						if (existingChange?.children) {
							let deleteCFound = false;
							let deleteCs: any = [];
							for (let child of existingChange.children) {
								const ap = { s: child.i, f: child.i + child.l };
								if (deleteCFound) {
									deleteCs.push(existingChange.children.indexOf(child));
								} else if (ap.s < rp.s && ap.f > rp.s) {
									child.l = ap.f - rp.s;
								} else if (ap.s >= rp.s) {
									deleteCs.push(existingChange.children.indexOf(child));
									deleteCFound = true;
								}
							}
							let iCOff = 0;
							for (let dai of deleteCs) {
								existingChange.children.splice(dai - iCOff, 1);
								iCOff++;
							}
						}
					} else if (ep.f > cp.f && ep.s < cp.f) {
						dl -= cp.f - ep.s;
						existingChange.cd.ops[0].insert = existingChange.cd.ops[0].insert.slice(cp.f - ep.s);
						existingChange.d.ops[1] = existingChange.cd.ops[0];
						existingChange.d.ops[0].retain = cp.s - l;
						existingChange.pos.l = existingChange.cd.ops[0].insert.length;
						existingChange.pos.i = existingChange.d.ops[0].retain;

						const rp = { s: 0, f: cp.f - ep.s };
						let deleteFound = false;
						let deleteAtts: any = [];
						for (let att of existingChange.attributes) {
							const ap = { s: att.i, f: att.i + att.l };
							if (deleteFound) {
								att.i -= rp.f;
							} else if (ap.f <= rp.f) {
								deleteAtts.push(existingChange.attributes.indexOf(att));
							} else if (ap.s < rp.f) {
								att.l = ap.f - rp.f;
								att.i = 0;
							} else if (ap.s >= rp.f) {
								deleteFound = true;
								att.i -= rp.f;
							}
						}
						let iaOff = 0;
						for (let dai of deleteAtts) {
							existingChange.attributes.splice(dai - iaOff, 1);
							iaOff++;
						}
						if (existingChange?.deleteChildren) {
							let deleteDFound = false;
							let deleteDs: any = [];
							for (let dChild of existingChange.deleteChildren) {
								const ap = { s: dChild.i, f: dChild.i + dChild.l };
								if (deleteDFound) {
									dChild.i -= rp.f;
								} else if (ap.f <= rp.f) {
									deleteDs.push(existingChange.deleteChildren.indexOf(dChild));
								} else if (ap.s < rp.f) {
									dChild.l = ap.f - rp.f;
									dChild.i = 0;
								} else if (ap.s >= rp.f) {
									deleteDFound = true;
									dChild.i -= rp.f;
								}
							}
							let iDOff = 0;
							for (let dai of deleteDs) {
								existingChange.deleteChildren.splice(dai - iDOff, 1);
								iDOff++;
							}
						}
						if (existingChange?.children) {
							let deleteDFound = false;
							let deleteCs: any = [];
							for (let child of existingChange.children) {
								const ap = { s: child.i, f: child.i + child.l };
								if (deleteDFound) {
									child.i -= rp.f;
								} else if (ap.f <= rp.f) {
									deleteCs.push(existingChange.children.indexOf(child));
								} else if (ap.s < rp.f) {
									child.l = ap.f - rp.f;
									child.i = 0;
								} else if (ap.s >= rp.f) {
									deleteDFound = true;
									child.i -= rp.f;
								}
							}
							let iCOff = 0;
							for (let dai of deleteCs) {
								existingChange.children.splice(dai - iCOff, 1);
								iCOff++;
							}
						}
					} else if (ep.s >= cp.f) {
						existingChange.pos.i -= dl;
						existingChange.d.ops[0].retain = existingChange.pos.i;
					}
					allL += cl;
				} else {
					const dp = {
						s: existingChange.pos.i,
						f: existingChange.pos.i + existingChange.cd.ops[0].delete
					};
					if (cp.s <= dp.s && cp.f >= dp.f) {
						delsToDel.push(existingChange);
					} else if (dp.s < cp.s && dp.f > cp.s) {
						existingChange.cd.ops[0].delete = cp.s - dp.s;
						existingChange.d.ops[1] = existingChange.cd.ops[0];
					} else if (dp.f > cp.f && dp.s < cp.f) {
						existingChange.cd.ops[0].delete = dp.f - cp.f;
						existingChange.d.ops[1] = existingChange.cd.ops[0];
						existingChange.d.ops[0].retain = cp.s;
						existingChange.pos.i = existingChange.d.ops[0].retain;
					} else if (dp.s >= cp.f) {
						existingChange.pos.i -= dl;
						existingChange.d.ops[0].retain = existingChange.pos.i;
					}
				}
			}
			let diOff = 0;
			for (let del of toDel) {
				changes.splice(del - diOff, 1);
				diOff++;
			}
			for (let del of delsToDel) {
				changes.splice(changes.indexOf(del), 1);
			}
			if (change.d.ops[0].retain - l > 0) {
				base = base.compose({ ops: [{ retain: change.d.ops[0].retain - l }, { delete: dl }] });
			} else {
				base = base.compose({ ops: [{ delete: dl }] });
			}
		}
		sections.find((s: any) => s.title === section.title).base = base;
		sections = sections.map((section: any) => ({
			...section,
			suggestions: section.suggestions.map((suggestion: any) => ({ ...suggestion }))
		}));
		switchCurrent(sections.find((s: any) => s.title === section.title));
		updateQuillWithChanges();
		checkChangeInUserColors();
	}
	function denyChange(change: any, i: number, section: any) {
		saved = false;
		switchCurrent(section);
		changes.splice(i, 1);
		if (change.pos.l) {
			const cp = { s: change.pos.i, f: change.pos.i + change.pos.l };
			for (let existingChange of changes) {
				if (!existingChange.pos.l) {
					const ep = {
						s: existingChange.pos.i,
						f: existingChange.pos.i + existingChange.cd.ops[0].delete
					};
					if (ep.f > cp.f && ep.s < cp.s) {
						existingChange.cd.ops[0].delete -= change.pos.l;
						existingChange.d.ops[1] = existingChange.cd.ops[0];
					} else if (ep.s < cp.s && ep.f > cp.s) {
						existingChange.cd.ops[0].delete -= ep.f - cp.s;
						existingChange.d.ops[1] = existingChange.cd.ops[0];
					} else if (ep.f > cp.f && ep.s < cp.f) {
						existingChange.pos.i = change.pos.i;
						existingChange.d.ops[0].retain = change.pos.i;
						existingChange.cd.ops[0].delete = ep.f - cp.f;
						existingChange.d.ops[1] = existingChange.cd.ops[0];
					} else if (existingChange.pos.i >= change.pos.i + change.pos.l) {
						existingChange.pos.i -= change.pos.l;
						existingChange.d.ops[0].retain -= change.pos.l;
					}
				}
			}
		}
		sections.find((s: any) => s.title === section.title).base = base;
		sections = sections.map((section: any) => ({
			...section,
			suggestions: section.suggestions.map((suggestion: any) => ({ ...suggestion }))
		}));
		switchCurrent(sections.find((s: any) => s.title === section.title));
		updateQuillWithChanges();
		checkChangeInUserColors();
	}
	function updateQuillWithChanges(ch: any = changes, b: any = base, cq: any = currentQuill) {
		let l = 0;
		for (let change of ch) {
			if (change.pos.l) {
				let newInsert;
				if (change.d.ops[0].retain + l > 0) {
					newInsert = new Delta([
						{ retain: change.d.ops[0].retain + l },
						{
							insert: change.cd.ops[0].insert,
							attributes: { color: change.color, underline: true }
						}
					]);
				} else {
					newInsert = new Delta([
						{
							insert: change.cd.ops[0].insert,
							attributes: { color: change.color, underline: true }
						}
					]);
				}
				if (change?.children) {
					for (let child of change.children) {
						if (newInsert.ops[0].retain + child.i > 0) {
							newInsert = newInsert.compose({
								ops: [
									{ retain: newInsert.ops[0].retain + child.i },
									{
										retain: child.l,
										attributes: { color: child.owner, underline: true }
									}
								]
							});
						} else {
							newInsert = newInsert.compose({
								ops: [
									{
										retain: child.l,
										attributes: { color: child.owner, underline: true }
									}
								]
							});
						}
					}
				}
				if (change?.deleteChildren) {
					for (let deleteChild of change.deleteChildren) {
						if (newInsert.ops[0].retain + deleteChild.i > 0) {
							newInsert = newInsert.compose({
								ops: [
									{ retain: newInsert.ops[0].retain + deleteChild.i },
									{
										retain: deleteChild.l,
										attributes: { color: deleteChild.owner, strike: true }
									}
								]
							});
						} else {
							newInsert = newInsert.compose({
								ops: [
									{
										retain: deleteChild.l,
										attributes: { color: deleteChild.owner, strike: true }
									}
								]
							});
						}
					}
				}
				for (let att of change.attributes) {
					if (att.i + newInsert.ops[0].retain > 0) {
						newInsert = newInsert.compose({
							ops: [
								{ retain: att.i + newInsert.ops[0].retain },
								{ retain: att.l, attributes: att.a }
							]
						});
					} else {
						newInsert = newInsert.compose({
							ops: [{ retain: att.l, attributes: att.a }]
						});
					}
				}
				b = b.compose(newInsert);
				l += change.pos.l;
			}
		}
		for (let change of ch) {
			if (!change.pos.l) {
				if (change.d.ops[0].retain > 0) {
					b = b.compose({
						ops: [
							{ retain: change.d.ops[0].retain },
							{
								retain: change.cd.ops[0].delete,
								attributes: { color: change.color, strike: true }
							}
						]
					});
				} else {
					b = b.compose({
						ops: [
							{
								retain: change.cd.ops[0].delete,
								attributes: { color: change.color, strike: true }
							}
						]
					});
				}
			}
		}
		cq.setContents(b);
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
	function checkChangeInUserColors() {
		let updatedUsedColors = findAllUserColors();
		userColors = userColors.filter((uc: any) =>
			updatedUsedColors.find((uuc: any) => uuc === uc.color)
		);
		activateUser(undefined, userColors);
	}

	function saving(start: boolean = false) {
		if (start) isSaving = true;
		if (isSaving) {
			save();
			savingTimeout = setTimeout(saving, 1600);
		}
	}
	function save(closing = false) {
		if (!saved && !posting) {
			if (userColor === 'owner') {
				pushToProblemEdit({
					id: treeData.id,
					uuid: treeData.uuid,
					base,
					newChanges: changes,
					section: currentSection,
					userId: data.session?.user.id
				});
			} else {
				pushToProblemSuggestions({
					id: treeData.id,
					uuid: treeData.uuid,
					newChanges: changes,
					section: currentSection,
					userId: data.session?.user.id
				});
			}
			saved = true;
		}

		if (closing) {
			const treeDataTemp = tree.getObjFromId(treeData.id, treeData.uuid).data;
			treeDataTemp.title = title;
			treeDataTemp.tldr = sections[0].quill.getContents();
		}
	}
	async function pushToProblemSuggestions(d: any): Promise<void> {
		if (posting) await waitForServer();
		posting = true;
		try {
			const response = await fetch('/home/tree/actions/push_problem_suggestion', {
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
	async function pushToProblemEdit(d: any): Promise<void> {
		if (posting) await waitForServer();
		posting = true;
		try {
			const response = await fetch('/home/tree/actions/push_problem_edit', {
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
			const response = await fetch('/home/tree/actions/change_problem_title', {
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
			editor: undefined,
			base: new Delta(),
			suggestions: [],
			history: [],
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
			const response = await fetch('/home/tree/actions/new_section', {
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
		if (sections.find((s: any) => s.title === sectionTitle)) {
			failurePopUp.set('Error: Sections must be unique!');
			return;
		}
		if (posting) await waitForServer();
		posting = true;
		const prevTitle = sections[i].title;
		sections[i].title = sectionTitle;
		try {
			const response = await fetch('/home/tree/actions/change_section_title', {
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
			const response = await fetch('/home/tree/actions/delete_section', {
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
	function findAllUserColors() {
		const usedColors: any = [];

		for (let section of sections) {
			let sugs = section.suggestions;
			for (let change of sugs) {
				if (!usedColors.includes(change.color)) {
					usedColors.push(change.color);
				}
				if (change?.children) {
					for (let child of change.children) {
						if (!usedColors.includes(child.owner)) {
							usedColors.push(child.owner);
						}
					}
				}
				if (change?.deleteChildren) {
					for (let deleteChild of change.deleteChildren) {
						if (!usedColors.includes(deleteChild.owner)) {
							usedColors.push(deleteChild.owner);
						}
					}
				}
			}
		}

		return usedColors;
	}
	async function activateUser(color: string | undefined, userColors: any) {
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
					color,
					userColors,
					nodeType: true
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
					nodeType: true
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
			editIconActive = true;
			if (referenced.uuid) $viewingNode = referenced.id;
			else $viewingNode = treeData.id;
			startListening();
			escBtn = true;
			treeAction.set('find-node-position');
		} else if (data?.props?.loggedIn) {
			if (editable) {
				editBtnActive = false;
				isSaving = false;
				clearTimeout(savingTimeout);
				editable = false;
				enableQuills(false);
				editIconActive = true;
				emptyQuillsOfSuggestions();
				toolBarShown.set(false);
				toolBarDotsShown.set(false);
				unactivateUser().then(() => {
					editBtnActive = true;
				});
			} else {
				editIconActive = false;
				editBtnActive = false;
				$processing = true;
				data.supabase
					.from('Problems')
					.select('*')
					.eq('uuid', treeData.uuid)
					.then(({ data: problemData }) => {
						if (problemData) {
							const bases = JSON.parse(
								JSON.stringify([problemData[0].tldr, ...problemData[0].content])
							);
							const suggestions = JSON.parse(JSON.stringify(problemData[0].suggestions));
							updateQuillData(bases, suggestions);
							fillQuills().then(() => {
								fillQuillsWithSuggestions();
								let color = undefined;
								userColors = problemData[0].userColors;
								if (userColor !== 'owner') {
									let colorMatching = problemData[0].userColors.find(
										(uc: any) => uc.user === username
									);
									if (colorMatching) {
										userColor = colorMatching.color;
									} else {
										let colorI = problemData[0].userColors.length;
										if (colorI > colors.length - 1) {
											userColor = colors[colorI - colors.length + 1];
										} else {
											userColor = colors[colorI];
										}
										color = userColor;
									}
								}
								activateUser(color, problemData[0].userColors).then(
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
	function handleSuggestionClick(change: any, i: number, section: any, pi: number) {
		change.selected = true;
		if (change.pos.l) {
			let l = 0;
			let k = 0;
			for (let ch of section.suggestions) {
				if (ch.pos.l && k >= i) break;
				l += ch.pos.l;
				k++;
			}
			section.quill.setSelection(change.pos.i + l, change.pos.l, 'user');
		} else {
			section.quill.setSelection(change.pos.i, change.cd.ops[0].delete, 'user');
		}
		function handleSuggestionCleanup() {
			sections[pi].suggestions[i].selected = undefined;
			window.removeEventListener('click', handleSuggestionCleanup);
			sections = sections.map((section: any) => ({
				...section,
				suggestions: section.suggestions.map((suggestion: any) => ({ ...suggestion }))
			}));
			switchCurrent(sections.find((s: any) => s.title === section.title));
		}
		setTimeout(() => {
			window.addEventListener('click', handleSuggestionCleanup);
		}, 2);
		sections = sections.map((section: any) => ({
			...section,
			suggestions: section.suggestions.map((suggestion: any) => ({ ...suggestion }))
		}));
		switchCurrent(sections.find((s: any) => s.title === section.title));
	}
	function checkWorking() {
		return true;
	}
</script>

<div
	class="grid bg-[#1f1f1f] rounded-[20px] w-[800px] p-[60px] relative selection:bg-[#6a87b389]"
	style="box-shadow: -2px 2px #a53a3a;"
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
		class="absolute top-[55px] right-[65px] rounded-md w-[36px] h-[36px] items-center justify-center {editBtnActive &&
		data?.props?.loggedIn
			? 'hover:bg-[#4949495a]'
			: ''}"
	>
		{#if editIconActive}
			<Edit color={editBtnActive && data?.props?.loggedIn ? '#9c9c9c' : '#595959'} size="36px" />
		{:else}
			<View color="#9c9c9c" size="36px" />
		{/if}
	</button>
	<p class="ml-[14px] mr-[50px] title mb-[25px] relative" on:dblclick={editTitle}>
		{title || 'untitled'}
		{#if referenced.uuid}
			<div class="absolute left-[-9px] top-[-11px]" title="This is a linked problem">
				<Linked color="#9c9c9c" size="12px" />
			</div>
		{/if}
	</p>
	{#each sections as section, i (section.title)}
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
			{#if editable && userColor === 'owner'}
				<div class="absolute top-[15px] right-[-185px] flex flex-col space-y-[5px]">
					{#if section?.suggestions}
						{#each section.suggestions as change, k}
							<div
								class="flex p-[2px] bg-[#252525] space-x-[3px] rounded-[2px] {change?.selected &&
								checkWorking()
									? 'border-[.5px] border-[#758ed2]'
									: ''}"
							>
								<button
									class="p-[2px] rounded-[2px] hover:bg-[#303030]"
									on:click={() => approveChange(change, k, section)}
									><Check size="12px" color="#6e6e6e" /></button
								>
								<button
									class="p-[2px] rounded-[2px] hover:bg-[#303030]"
									on:click={() => denyChange(change, k, section)}
									><Cross size="12px" color="#6e6e6e" /></button
								>
								<button
									class="p-[2px] rounded-[2px] hover:bg-[#303030]"
									on:click={() => handleSuggestionClick(change, k, section, i)}
									><Paragraph size="12px" color="#6e6e6e" /></button
								>
							</div>
						{/each}
					{/if}
				</div>
			{/if}
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
