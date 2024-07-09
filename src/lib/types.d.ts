import type { Writable } from 'svelte/store';
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
	created_at: number;
	type: NodeTypes;
	data: { title: string; tldr?: any; tldr_title?: string };
	owners: string[];
	children: TreeNode[];
	parent_category: string;
	linking_categories: LinkingCategory[];
	top?: number | undefined;
	left?: number | undefined;
	fullChildren?: TreeNode[];
	pinned?: boolean;
	members?: string[];
	anyonePermissions?: NodeAnyonePermissions | ThreadAnyonePermissions;
	memberPermissions?: NodeMemberPermissions | ThreadMemberPermissions;
}

interface LinkingCategory {
	id: string;
	title: string;
	description: string;
	color: CategoryColors;
	type: CategoryTypes;
	postPermissions: PostPermissions;
	nodesAllowed: NodeTypes[];
	left?: number;
	div?: HTMLDivElement;
	typesOpen?: boolean;
	permissionsOpen?: boolean;
	input?: HTMLInputElement;
}

type CategoryTypes = 'Expanded' | 'Collapsed';
type PostPermissions = 'Members' | 'Owner' | 'Anyone';
type NodeTypes = 'Thread' | 'Poll' | 'Default';

type CategoryColors =
	| '#3f3f3f'
	| '#46966c'
	| '#6d4ba3'
	| '#3f8b91'
	| '#b04d35'
	| '#68497a'
	| '#8d8142';

interface TreeInterface {
	setTree(t: Tree): void;
	setClientTree(t: Tree): void;
	getTree(user?: string | true): Tree;
	getParent(
		uuid: string | undefined,
		obj?: any
	):
		| {
				i: number;
				node: TreeNode;
		  }
		| undefined;
	getObjFromId(uuid?: string | undefined): TreeNode | undefined;
	calculateSpacing(): { width: number; height: number };
	createNode(
		parent: TreeNode,
		parent_category: string,
		title?: string,
		tldr?: any,
		owners?: any
	): TreeNode | undefined;
	deleteNode(uuid: string): { error?: string } | undefined;
}

interface CategoriesModal {
	uuid: string;
	visible: boolean;
	categories: LinkingCategory[];
	uneditableCats: Set<string>;
	waiting: boolean;
}

type NewNodeModalStore = Writable<{
	visible: boolean;
	title: string;
	allowedTypes: NodeTypes[];
	uuid?: string;
	category_id?: string;
	type?: NodeTypes;
	input?: HTMLInputElement;
}>;

type EditThreadInfoStore = Writable<{
	visible: boolean;
	title: string;
	tldr: string;
	vote_message: string;
	titleInput?: HTMLInputElement;
	tldrInput?: HTMLTextAreaElement;
}>;

type ExtraContextStore = Writable<
	{
		title: string;
		callback: () => void;
	}[]
>;
type EditPermissionsStore = Writable<
	{
		visible: boolean;
		members: string[];
		owners: string[];
	} & (NodePermissions | ThreadPermissions)
>;

type NodeAnyonePermissions = 'Can view' | 'Cannot view';
type NodeMemberPermissions = 'Can edit' | 'Can view';

type ThreadAnyonePermissions =
	| 'Can post & reply'
	| 'Can post'
	| 'Can reply'
	| 'Can view'
	| 'Cannot view';
type ThreadMemberPermissions =
	| 'Can delete posts'
	| 'Can post & reply'
	| 'Can post'
	| 'Can reply'
	| 'Can view';

interface NodePermissions {
	type: 'Default';
	anyonePermissions: NodeAnyonePermissions;
	memberPermissions: NodeMemberPermissions;
}
interface ThreadPermissions {
	type: 'Thread';
	anyonePermissions: ThreadAnyonePermissions;
	memberPermissions: ThreadMemberPermissions;
}

interface ThreadPost {
	id: string;
	owner: string;
	post: string;
	vote: number;
	votes: ThreadVotes;
	created_at: number;
	openSettings?: boolean;
	editing?: boolean;
	previousValue?: string;
	textarea?: HTMLTextAreaElement;
}

type ThreadVotes = { vote: number; user: string }[];

type TreeArrayNode = {
	treeNode: TreeNode;
	arrayChildren: Array<{
		uuid: string;
		pos: { left: number; top: number };
		parent_category: LinkingCategory;
	}>;
	fullSearchSiblings?: {
		uuid: string;
		title: string;
	}[];
	parent?: {
		node: TreeArrayNode;
		category: LinkingCategory;
	};
	div?: HTMLDivElement;
	last?: boolean;
	searchSiblings?: {
		uuid: string;
		title: string;
	}[];
	searchInput?: string;
};

export {
	Node,
	Tree,
	TreeInterface,
	TreeNode,
	LinkingCategory,
	CategoriesModal,
	CategoryColors,
	CategoryTypes,
	TreeArrayNode,
	ThreadPost,
	PostPermissions,
	NodeTypes,
	NewNodeModalStore,
	EditThreadInfoStore,
	ThreadVotes,
	ExtraContextStore,
	EditPermissionsStore,
	NodePermissions,
	ThreadPermissions
};
