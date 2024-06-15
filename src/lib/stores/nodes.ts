import type { Tree, TreeNode } from '../types/nodes';
import { v4 as uuidv4 } from 'uuid';

export function createTree() {
	let tree: Tree;
	let ySpace = 560;

	function endNodes(
		obj: TreeNode,
		pos: { left: number; height: number },
		currentDepth = 0,
		firstNode = false,
		childrenLength = 2
	) {
		currentDepth++;
		if (obj.children.length === 0) {
			if (currentDepth > pos.height) pos.height = currentDepth;
			obj.top = (currentDepth - 1) * ySpace;
			if (childrenLength === 1 && pos.left !== 0) {
				obj.left = pos.left + 60;
				pos.left += 940;
			} else if (firstNode && pos.left !== 0) {
				obj.left = pos.left + 60;
				pos.left += 880;
			} else {
				obj.left = pos.left;
				pos.left += 820;
			}
		} else {
			for (let i = 0; i < obj.children.length; i++) {
				if (i === 0) endNodes(obj.children[i], pos, currentDepth, true, obj.children.length);
				else endNodes(obj.children[i], pos, currentDepth);
			}
		}
	}
	function bodyNodes(obj: TreeNode) {
		if (obj.uuid === '742b77a5-b4ed-4f16-afe1-630686362d10') return true;
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
			obj.left = totalChildWidth / 2 + (obj?.children[0]?.left || 0) - 440;
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

	return {
		setTree(t: Tree) {
			tree = JSON.parse(JSON.stringify(t));
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
			tldr: any = undefined,
			owners: any = undefined
		) {
			const newNode: TreeNode = {
				uuid: uuidv4(),
				data: { title, tldr },
				owners,
				parent_category,
				linking_categories: [
					{
						id: uuidv4(),
						title: 'Other',
						description:
							'For ideas which relate to this node in a way which is not defined by other categories',
						color: '#3f3f3f'
					}
				],
				children: []
			};
			parent.children.push(newNode);
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
