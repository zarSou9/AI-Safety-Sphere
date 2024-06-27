import type { Tree, TreeNode, CategoryTypes, NodeTypes } from '../types';
import { v4 as uuidv4 } from 'uuid';
import treeSelections from './local_storage/treeSelections';
import type { TreeSelects } from './local_storage/treeSelections';

let treeSelectsValue: TreeSelects;

treeSelections.subscribe((v) => {
	treeSelectsValue = v;
});

export function createTree() {
	let tree: Tree;
	let ySpace = 560;
	let xSpace = 30;

	function endNodes(
		obj: TreeNode,
		pos: { left: number; height: number },
		currentDepth = 0,
		firstNode = false
	) {
		currentDepth++;
		if (obj.children.length === 0) {
			if (currentDepth > pos.height) pos.height = currentDepth;
			obj.top = (currentDepth - 1) * ySpace;
			if (firstNode && pos.left !== 0) {
				obj.left = pos.left + 30;
				pos.left += 830 + xSpace;
			} else {
				obj.left = pos.left;
				pos.left += 800 + xSpace;
			}
		} else {
			for (let i = 0; i < obj.children.length; i++) {
				if (i === 0) endNodes(obj.children[i], pos, currentDepth, true);
				else endNodes(obj.children[i], pos, currentDepth);
			}
		}
	}
	function bodyNodes(obj: TreeNode) {
		let c = true;
		for (let child of obj.children) {
			if (child?.top === undefined) {
				c = false;
				bodyNodes(child);
			}
		}
		if (c) {
			obj.top = (obj?.children[0]?.top || 0) - ySpace;
			let totalChildWidth =
				(obj?.children[obj.children.length - 1]?.left || 0) + 800 - (obj?.children[0]?.left || 0);
			obj.left = totalChildWidth / 2 + (obj?.children[0]?.left || 0) - 400;
			if (obj.uuid === '742b77a5-b4ed-4f16-afe1-630686362d10') return true;
		}
	}

	function findNodeFromUUID(
		uuid: string | undefined,
		obj: TreeNode = tree.node
	): TreeNode | undefined {
		if (obj.uuid === uuid) return obj;
		for (let node of obj.children) {
			if (node?.uuid === uuid) return node;
			const objFound: TreeNode | undefined = findNodeFromUUID(uuid, node);
			if (objFound) return objFound;
		}
	}

	function filterTree(node = tree.node) {
		const newChildren: TreeNode[] = [];
		const taken: string[] = [];
		node.children.forEach((child) => {
			const cat = node.linking_categories.find((lc) => lc.id === child.parent_category);
			if (cat?.type === 'Collapsed' && !child.pinned) {
				if (!taken.includes(cat.id)) {
					taken.push(cat.id);
					const selectedChild = node.children.find(
						(nc) =>
							nc.uuid ===
							treeSelectsValue.find(
								(ts) => ts.uuid === node.uuid && ts.catId === child.parent_category
							)?.selection
					);
					newChildren.push(selectedChild || child);
					filterTree(child);
				}
			} else {
				newChildren.push(child);
				filterTree(child);
			}
		});
		if (node.linking_categories.find((lc) => lc.type === 'Collapsed')) {
			node.fullChildren = node.children;
			node.children = newChildren;
		}
	}

	return {
		setTree(t: Tree) {
			tree = JSON.parse(JSON.stringify(t));
		},
		setClientTree(t: Tree) {
			tree = JSON.parse(JSON.stringify(t));
			filterTree();
		},
		getTree() {
			return tree;
		},
		getParent(
			uuid: string | undefined,
			obj: any = tree.node
		): { i: number; node: TreeNode } | undefined {
			let i = 0;
			for (let node of obj.children) {
				if (node.uuid === uuid) {
					return { i, node: obj };
				}
				const parentFound: { i: number; node: TreeNode } | undefined = this.getParent(uuid, node);
				if (parentFound) return parentFound;
				i++;
			}
		},
		getObjFromId(uuid?: string | undefined) {
			return findNodeFromUUID(uuid);
		},
		calculateSpacing() {
			let container = { left: 0, height: 0 };

			endNodes(tree.node, container);
			if (tree.node?.children.length) while (!bodyNodes(tree.node));

			return { width: container.left, height: container.height * ySpace };
		},
		createNode(
			parent: TreeNode,
			parent_category: string,
			title: string = 'untitled',
			type: NodeTypes,
			tldr: any = undefined,
			owners: any = undefined
		) {
			const newNode: TreeNode = {
				uuid: uuidv4(),
				data: { title, tldr },
				owners,
				type,
				parent_category,
				linking_categories:
					type === 'Default'
						? [
								{
									id: uuidv4(),
									type: 'Expanded',
									title: 'Other',
									description:
										'For ideas which relate to this node in a way which is not defined by other categories',
									color: '#3f3f3f',
									postPermissions: 'Anyone',
									nodesAllowed: ['Default', 'Thread', 'Poll']
								}
							]
						: [],
				children: []
			};
			let i = parent.linking_categories.findIndex((lc) => lc.id === parent_category);
			if (i === -1) return;
			// Place node at the end of respective category or categories before it
			for (i; i >= 0; i--) {
				const childFoundI = parent.children.findLastIndex(
					(child) => child.parent_category === parent.linking_categories[i].id
				);
				if (childFoundI !== -1) {
					parent.children.splice(childFoundI + 1, 0, newNode);
					return newNode;
				}
			}
			parent.children.splice(0, 0, newNode);
			return newNode;
		},
		deleteNode(uuid: string) {
			let parent = this.getParent(uuid);
			if (!parent) return { error: 'Parent does not exist' };

			if (this.getObjFromId(uuid)?.children?.length) return { error: 'Problem has child nodes' };

			parent.node.children.splice(parent.i, 1);
		}
	};
}
