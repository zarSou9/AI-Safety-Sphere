import { browser } from '$app/environment';
import { writable } from 'svelte/store';

type TreeSelects = { uuid: string; selection: string; catId: string }[];

const defaultValue: TreeSelects = [];

const initialValue = browser
	? JSON.parse(window.localStorage.getItem('treeSelections') ?? JSON.stringify(defaultValue))
	: defaultValue;

const treeSelections = writable<TreeSelects>(initialValue);

treeSelections.subscribe((value) => {
	if (browser) {
		window.localStorage.setItem('treeSelections', JSON.stringify(value));
	}
});

export type { TreeSelects };
export default treeSelections;
