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
	uuid: string;
	data: { title: string; tldr?: Object };
	owners?: string[];
	strategies: TreeStrategy[];
	selectedStrategy: number;
	top?: number | undefined;
	left?: number | undefined;
}

interface TreeStrategy {
	id: string;
	uuid: string;
	data: { title: string; tldr?: Object };
	owners?: string[];
	problems: TreeProblem[];
	top?: number | undefined;
	left?: number | undefined;
}

interface TreeInterface {
	getTree: () => Tree;
	setTree: (t: Tree, sS?: SelectedStrategy[] | undefined) => void;
	setClientTree: (t: Tree, sS?: SelectedStrategy[] | undefined) => void;
	getParent: (id: string | undefined) => string | undefined;
	getNodeType: (id: string | undefined) => string | undefined;
	getObjFromId: (id?: string, UUID?: string) => any;
	calculateSpacing: () => { width: number; height: number };
	createRootProblem: (title?: string) => [Problem, Object];
	createProblem: (
		strategyID: string,
		strategyUUID: string,
		title?: string,
		tldr?: any,
		owners?: any
	) => Problem | false;
	createStrategy: (
		problemID: string,
		problemUUID: string,
		title?: string,
		tldr?: any,
		owners?: any
	) => Strategy | false;
	deleteProblem: (probId: string) =>
		| {
				error: string;
				success?: undefined;
		  }
		| {
				success: string;
				error?: undefined;
		  };
	deleteStrategy: (stratId: string) =>
		| {
				error: string;
				success?: undefined;
		  }
		| {
				success: string;
				error?: undefined;
		  };
	updateSelected: (id: string | undefined, selection: number) => void;
	updateSelections: () => void;
	getSelections: () => SelectedStrategy[];
	setSelections: (newSelects: any) => void;
	findAllProblems: () => any;
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
