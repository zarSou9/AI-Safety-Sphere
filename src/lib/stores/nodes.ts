import type { Node, Tree, TreeNode } from '../types/nodes';
import { v4 as uuidv4 } from 'uuid';

export function createTree() {
	let tree: Tree;
	let ySpace = 560;

	function endNodes(
		obj: any,
		pos: { left: number; height: number },
		currentDepth = 0,
		firstProblem = false,
		problemsLength = 2
	) {
		currentDepth++;
		if (obj?.strategies) {
			if (obj.strategies.length === 0) {
				if (currentDepth > pos.height) pos.height = currentDepth;
				obj.top = (currentDepth - 1) * ySpace;
				if (problemsLength === 1 && pos.left !== 0) {
					obj.left = pos.left + 60;
					pos.left += 940;
				} else if (firstProblem && pos.left !== 0) {
					obj.left = pos.left + 60;
					pos.left += 880;
				} else {
					obj.left = pos.left;
					pos.left += 820;
				}
			} else {
				obj.top = undefined;
				obj.left = undefined;
				endNodes(obj.strategies[obj.selectedStrategy], pos, currentDepth, firstProblem);
			}
		} else if (obj?.problems) {
			if (obj.problems.length === 0) {
				if (currentDepth > pos.height) pos.height = currentDepth;
				obj.top = (currentDepth - 1) * ySpace;
				if (firstProblem) {
					obj.left = pos.left + 20;
					pos.left += 940;
				} else {
					obj.left = pos.left;
					pos.left += 900;
				}
			} else {
				for (let i = 0; i < obj.problems.length; i++) {
					obj.top = undefined;
					obj.left = undefined;
					if (i === 0) endNodes(obj.problems[i], pos, currentDepth, true, obj.problems.length);
					else endNodes(obj.problems[i], pos, currentDepth);
				}
			}
		}
	}
	function bodyNodes(obj: any) {
		if (obj?.strategies) {
			if (obj.strategies[obj.selectedStrategy]?.top !== undefined) {
				obj.top = obj.strategies[obj.selectedStrategy].top - ySpace;
				obj.left = obj.strategies[obj.selectedStrategy].left + 40;
				if (obj.id === 'r') return true;
			} else {
				bodyNodes(obj.strategies[obj.selectedStrategy]);
			}
		} else if (obj?.problems) {
			let c = true;
			for (let i = 0; i < obj.problems.length; i++) {
				if (obj.problems[i]?.top === undefined) {
					c = false;
					bodyNodes(obj.problems[i]);
				}
			}
			if (c) {
				obj.top = obj.problems[0].top - ySpace;
				let totalChildWidth =
					obj.problems[obj.problems.length - 1].left + 800 - obj.problems[0].left;
				obj.left = totalChildWidth / 2 + obj.problems[0].left - 440;
			}
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
		createRootNode(title: string = 'untitled') {
			const uuid = uuidv4();
			let prob: Node = {
				uuid,
				title: title
			};
			tree.node = {
				uuid,
				data: { title: title },
				children: []
			};

			return [prob, { node: { uuid, data: { title: title }, strategies: [] } }];
		},
		createNode(
			parent: TreeNode,
			title: string = 'untitled',
			tldr: any = undefined,
			owners: any = undefined
		) {
			const uuid = uuidv4();
			const newNode = {
				uuid,
				data: { title, tldr },
				owners,
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
