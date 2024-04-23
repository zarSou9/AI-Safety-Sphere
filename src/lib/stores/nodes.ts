import type { Problem, Tree, SelectedStrategy } from '../types/nodes';

export function createTree() {
	let tree: Tree = {};
	let ySpace = 560;
	let selectedStrategies: SelectedStrategy[];

	function endNodes(
		obj: any,
		pos: { left: number; height: number },
		currentDepth = 0,
		firstProblem = false,
		problemsLength = 2
	) {
		currentDepth++;
		if (obj?.strategies !== undefined) {
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
		} else {
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
		if (obj?.strategies !== undefined) {
			if (obj.strategies[obj.selectedStrategy]?.top !== undefined) {
				obj.top = obj.strategies[obj.selectedStrategy].top - ySpace;
				obj.left = obj.strategies[obj.selectedStrategy].left + 40;
				if (obj.id === 'r') return true;
			} else {
				bodyNodes(obj.strategies[obj.selectedStrategy]);
			}
		} else if (obj?.problems !== undefined) {
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
	function updateTreeStrategySelections(obj: any) {
		if (obj?.strategies !== undefined) {
			obj.selectedStrategy = selectedStrategies.find((s) => s.id === obj.id)?.selection;
			if (obj?.selectedStrategy === undefined) {
				obj.selectedStrategy = 0;
				selectedStrategies.push({ id: obj.id, selection: 0 });
			}
			obj.strategies.forEach((s: any) => {
				updateTreeStrategySelections(s);
			});
		} else {
			obj.problems.forEach((p: any) => {
				updateTreeStrategySelections(p);
			});
		}
	}

	return {
		setTree(t: Tree, sS: SelectedStrategy[] | undefined = undefined) {
			tree.problem = JSON.parse(JSON.stringify(t.problem));
			if (sS) {
				selectedStrategies = sS;
				updateTreeStrategySelections(tree.problem);
			}
		},
		getTree() {
			return tree;
		},
		getParent(id: string | undefined) {
			if (!id) return undefined;
			if (id === 'r') return 'r';
			let j = id.length - 1;
			let c = '0';

			while (c !== 's' && c !== 'p' && c !== 'f' && j >= 0) {
				c = id.charAt(j);
				j--;
			}

			return id.substring(0, j + 1);
		},
		getNodeType(id: string | undefined) {
			if (!id) return undefined;
			if (id === 'r') return 'r';
			let j = id.length - 1;
			let c = '0';

			while (c !== 's' && c !== 'p' && j >= 0) {
				c = id.charAt(j);
				j--;
			}
			return c;
		},
		getObjFromId(id: string | undefined) {
			if (!id) return false;
			const prevId = id;
			let obj: any = tree.problem;
			if (id === 'r') return tree.problem;
			if (id.charAt(0) !== 'r') return false;
			id = id.substring(1);
			let running = true;
			while (running) {
				if (id.charAt(0) === 's') {
					obj = obj?.strategies;
					id = id.substring(1);
				} else if (id.charAt(0) === 'p') {
					obj = obj?.problems;
					id = id.substring(1);
				} else if (!isNaN(Number(id.charAt(0))) && id.length > 0) {
					let index = 0;
					while (!isNaN(Number(id.charAt(index))) && index < id.length) {
						index++;
					}
					if (!obj?.length) return false;
					obj = obj[Number(id.substring(0, index))];
					id = id.substring(index);
				} else {
					running = false;
				}
			}
			if (obj?.id === prevId) return obj;
			else return false;
		},
		calculateSpacing() {
			let container = { left: 0, height: 0 };

			endNodes(tree.problem, container);
			if (tree.problem?.strategies.length) while (!bodyNodes(tree.problem));

			return { width: container.left, height: container.height * ySpace };
		},
		createRootProblem(title: string = 'untitled') {
			let prob: Problem = {
				id: 'r',
				title: title
			};

			tree.problem = {
				id: prob.id as string,
				data: { title: title },
				strategies: [],
				selectedStrategy: 0
			};

			return [prob, { problem: { id: prob.id as string, data: { title: title }, strategies: [] } }];
		},
		createProblem(
			strategyID: string,
			title: string = 'untitled',
			user = true,
			tldr: any = undefined,
			owners: any = undefined,
			api = false
		) {
			let strategyTreeObj = this.getObjFromId(strategyID);
			if (!strategyTreeObj) return false;

			const id = strategyID + 'p' + strategyTreeObj.problems.length.toString();

			if (!api) {
				strategyTreeObj.problems.push({
					id,
					data: { title, tldr },
					owners,
					strategies: [],
					selectedStrategy: 0
				});
			} else {
				strategyTreeObj.problems.push({
					id,
					data: { title, tldr },
					owners,
					strategies: []
				});
			}
			return id;
		},
		createStrategy(
			problemID: string,
			title: string = 'untitled',
			user = true,
			tldr: any = undefined,
			owners: any = undefined
		) {
			let problemTreeObj = this.getObjFromId(problemID);
			if (!problemTreeObj) return false;

			const id = problemID + 's' + problemTreeObj.strategies.length.toString();

			problemTreeObj.strategies.push({ id, data: { title, tldr }, owners, problems: [] });

			return id;
		},
		deleteProblem(probId: string) {
			let strategyTreeObj = this.getObjFromId(this.getParent(probId));
			if (!strategyTreeObj) return { error: 'Invalid problem ID' };

			if (this.getObjFromId(probId)?.strategies?.length)
				return { error: 'Problem has child strategies' };

			const index = strategyTreeObj.problems.findIndex((prob: any) => prob.id === probId);
			const data: any = { newProbIds: [] };

			strategyTreeObj.problems.forEach((prob: any, i: number) => {
				if (i > index) {
					let updateProbId: any = { old: prob.id };
					let j = prob.id.length - 1;
					let c = '0';

					while (c !== 's' && c !== 'p' && j >= 0) {
						c = prob.id.charAt(j);
						j--;
					}
					const newNum = Number(prob.id.substring(j + 2)) - 1;

					prob.id = prob.id.substring(0, j + 2) + newNum;

					updateProbId.new = prob.id;
					data.newProbIds.push(updateProbId);
				}
			});
			strategyTreeObj.problems.splice(index, 1);

			return { success: 'Problem succesfully deleted from tree', data };
		},
		deleteStrategy(stratId: string) {
			let problemTreeObj = this.getObjFromId(this.getParent(stratId));
			if (!problemTreeObj) return { error: 'Invalid strategy ID' };

			if (this.getObjFromId(stratId)?.problems?.length)
				return { error: 'Strategy has child problems' };

			const index = problemTreeObj.strategies.findIndex((strat: any) => strat.id === stratId);
			const data: any = { newStratIds: [] };

			problemTreeObj.strategies.forEach((strat: any, i: number) => {
				if (i > index) {
					let updateStratId: any = { old: strat.id };
					let j = strat.id.length - 1;
					let c = '0';

					while (c !== 's' && c !== 'p' && j >= 0) {
						c = strat.id.charAt(j);
						j--;
					}
					const newNum = Number(strat.id.substring(j + 2)) - 1;

					strat.id = strat.id.substring(0, j + 2) + newNum;

					updateStratId.new = strat.id;
					data.newStratIds.push(updateStratId);
				}
			});
			problemTreeObj.strategies.splice(index, 1);
			return { success: 'Strategy succesfully deleted from tree', data };
		},
		updateSelected(id: string | undefined, selection: number) {
			const obj = selectedStrategies.find((s) => s.id === id);
			if (obj) obj.selection = selection;
			else if (id) {
				selectedStrategies.push({ id, selection });
			}
		},
		updateSelections() {
			updateTreeStrategySelections(tree.problem);
		},
		getSelections() {
			return selectedStrategies;
		}
	};
}
