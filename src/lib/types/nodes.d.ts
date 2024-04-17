interface Problem {
	id: string;
	created_at?: any;
	owners?: string[];
	title: string;
	tldr?: Object;
	prerequisites?: Object;
	content?: Object;
	measurable_objective?: Object;
	skills_needed?: Object;
	existing_work?: Object;
	references?: Object;
	undeveloped_strategies?: Object[];
	guiding_questions?: Object;
	comments?: Object[];
}

interface SelectedStrategy {
	id: string;
	selection: number;
}

interface Strategy {
	id: string;
	created_at?: any;
	owners?: string[];
	title: string;
	tldr?: Object;
	prerequisites?: Object;
	content?: Object;
	references?: Object;
	guiding_questions?: Object;
	comments?: Object[];
}

interface Tree {
	problem?: TreeProblem;
}

interface TreeProblem {
	id: string;
	data: { title: string; tldr?: Object };
	owners?: string[];
	strategies: TreeStrategy[];
	selectedStrategy: number;
	top?: number | undefined;
	left?: number | undefined;
}

interface TreeStrategy {
	id: string;
	data: { title: string; tldr?: Object };
	owners?: string[];
	problems: TreeProblem[];
	top?: number | undefined;
	left?: number | undefined;
}

interface TreeInterface {
	getTree: () => Tree;
	setTree: (
		t: Tree,
		c?: TrackChanges | undefined,
		sS?: SelectedStrategy[] | undefined,
		owner?: string | undefined
	) => void;
	getParent: (id: string | undefined) => string | undefined;
	getNodeType: (id: string | undefined) => string | undefined;
	getObjFromId: (id: string, tempTree: Tree | null = null) => any;
	calculateSpacing: () => { width: number; height: number };
	createRootProblem: (title?: string) => [Problem, Object];
	createProblem: (
		strategyID: string,
		title?: string,
		user?: boolean,
		tldr?: any,
		owners?: any,
		api?: boolean
	) => Problem | false;
	createStrategy: (
		problemID: string,
		title?: string,
		user?: boolean,
		tldr?: any,
		owners?: any
	) => Strategy | false;
	getChanges: () => TrackChanges;
	setChanges: (v: TrackChanges) => void;
	updateSelected: (id: string | undefined, selection: number) => void;
	getSelections: () => SelectedStrategy[];
}

interface NodeChange {
	id: string;
	sections: any;
}

interface TrackChanges {
	nodes: NodeChange[];
}

export {
	Problem,
	Strategy,
	Tree,
	TreeInterface,
	TreeProblem,
	TreeStrategy,
	TrackChanges,
	SelectedStrategy
};
