interface Node {
	uuid: string;
	created_at?: any;
	title: string;
	tldr?: Object;
	content?: Object;
	undeveloped_strategies?: Object[];
	comments?: Object[];
}

interface Tree {
	node: TreeNode;
}

interface TreeNode {
	uuid: string;
	data: { title: string; tldr?: Object };
	owners?: string[];
	children: TreeNode[];
	parent_category: string;
	linking_categories: LinkingCategory[];
	top?: number | undefined;
	left?: number | undefined;
}

interface LinkingCategory {
	id: string;
	title: string;
	description: string;
	color: string;
	left?: number;
	div?: HTMLDivElement;
}

interface TreeInterface {
	setTree(t: Tree): void;
	getTree(): Tree | undefined;
	getParent(uuid: string | undefined, obj?: TreeNode): { i: number; node: TreeNode } | undefined;
	getObjFromId(uuid?: string | undefined): TreeNode | undefined;
	calculateSpacing(): { width: number; height: number };
	createNode(parent: TreeNode, title?: string, tldr?: any, owners?: any): TreeNode;
	deleteNode(uuid: string): { error?: string };
}

interface CategoriesModal {
	uuid: string;
	visible: boolean;
	categories: linking_category[];
	uneditableCats: Set<string>;
	waiting: boolean;
}

export { Node, Tree, TreeInterface, TreeNode, LinkingCategory, CategoriesModal };
