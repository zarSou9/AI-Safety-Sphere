<script lang="ts">
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import userCoords from '$lib/stores/local_storage/userCoordinates';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import Tree from './Tree.svelte';

	const viewingNodeRect: { l: number; t: number; w: number; h: number } =
		getContext('viewingNodeRect');
	const navNodeRect: { l: number; t: number; w: number; h: number } = getContext('navNodeRect');
	const nodeHeight: any = getContext('nodeHeightStore');
	const viewingNode: any = getContext('viewingNodeStore');
	const shortCutsEnabled: any = getContext('shortCutsEnabledStore');
	const canvasAction: Writable<string | null> = getContext('canvasActionStore');
	const nodeAction: Writable<string | null> = getContext('nodeActionStore');
	const treeAction: Writable<string | null> = getContext('treeActionStore');
	const viewPortContext: { height: number; top: number } = getContext('viewPort');
	const stratChange: { l: number; t: number; pl: number; pt: number } = getContext('stratChange');
	const sectionContextE: Writable<any> = getContext('sectionContextEStore');

	const zoomIntensity = 0.016;

	let canvas: HTMLDivElement;
	let viewPort: HTMLDivElement;
	let rightClickDropdown: HTMLDivElement;
	let sectionContextDropdown: HTMLDivElement;
	let sectionContextOpen = false;

	let homeX: number;
	let homeY: number;
	let homeZ: number;

	let x: number;
	let y: number;
	let z: number;
	let minZoom = 0;
	let verticalOffset = 20;
	let horizontalOffset = 20;
	let contextOpen = false;
	let viewPortResizeObserver: ResizeObserver;
	let canvasResizeObserver: ResizeObserver;
	let vertical = false;
	let initEditSize = 0;
	let initEditHeight = 0;
	let smoothMoving = false;
	let nodeHeightUnsubscribe: any;
	let canvasActionUnsubscribe: any;
	let isZooming = false;
	let currentDir = '';
	let grabX: number;
	let grabY: number;
	let shifted = false;
	let grabbed = false;

	let viewPortOffset = {
		x: 0,
		y: 0
	};

	const motionX = tweened(0, {
		duration: 400,
		easing: cubicOut
	});
	const motionY = tweened(0, {
		duration: 400,
		easing: cubicOut
	});
	const motionZ = tweened(0, {
		duration: 400,
		easing: cubicOut
	});
	$: if (
		$motionX !== undefined &&
		$motionY !== undefined &&
		$motionZ !== undefined &&
		smoothMoving
	) {
		canvas.style.transform = `translate(${$motionX}px, ${$motionY}px) scale(${$motionZ})`;
	}
	function moveToPos(xf: number, yf: number, zf: number, dur = 400, delay = dur) {
		if (!smoothMoving) {
			motionX.set(x, { duration: 0 });
			motionY.set(y, { duration: 0 });
			motionZ.set(z, { duration: 0 });
			smoothMoving = true;

			x = xf;
			y = yf;
			z = zf;

			setTimeout(() => {
				smoothMoving = false;
			}, delay);

			motionX.update(() => xf, { duration: dur });
			motionY.update(() => yf, { duration: dur });
			motionZ.update(() => zf, { duration: dur });
		}
	}

	$: viewPortContext.height = viewPort?.clientHeight * 0.97;
	$: viewPortContext.top = viewPort?.getBoundingClientRect().top;

	function scrollEditing(e: WheelEvent) {
		e.preventDefault();
		if (!smoothMoving && !sectionContextOpen) {
			y = Math.max(Math.min(y - e.deltaY, viewingNodeRect.t), viewingNodeRect.h);
			canvas.style.transform = `translate(${x}px, ${y}px) scale(${z})`;
			$nodeAction = 'handle-caret-out-of-view';
		}
	}

	onMount(() => {
		nodeHeightUnsubscribe = nodeHeight.subscribe((height: any) => {
			if (height) {
				viewingNodeRect.h = initEditSize - height + initEditHeight;
				if (viewingNodeRect.h > viewingNodeRect.t) {
					viewingNodeRect.h = viewingNodeRect.t;
				}
			}
		});
		canvasActionUnsubscribe = canvasAction.subscribe((action) => {
			if (action) {
				if (action === 'move-to-node') {
					const newZ = viewPort.getBoundingClientRect().width / (viewingNodeRect.w + 360 * z);
					viewingNodeRect.l =
						(x - viewingNodeRect.l + viewPort.getBoundingClientRect().left + 180 * z) * newZ;
					viewingNodeRect.t =
						(y - viewingNodeRect.t + viewPort.getBoundingClientRect().top + 80 * z) * newZ;
					viewingNodeRect.w = z * newZ;
					initEditHeight = viewingNodeRect.h * newZ;
					initEditSize =
						viewingNodeRect.t -
						viewingNodeRect.h * newZ +
						viewPort.getBoundingClientRect().height -
						190 * z * newZ;
					viewingNodeRect.h = initEditSize;
					if (viewingNodeRect.h > viewingNodeRect.t) {
						viewingNodeRect.h = viewingNodeRect.t;
					}
					moveToPos(viewingNodeRect.l, viewingNodeRect.t, viewingNodeRect.w);
					setTimeout(() => {
						treeAction.set('fade-out-extra');
						nodeAction.set('expand-node');
					}, 400);
				} else if (action === 'move-page-up') {
					moveToPos(x, y - 110, z, 110);
				} else if (action === 'zoom-out-from-node') {
					scale(z * 0.8);
					setTimeout(() => {
						nodeAction.set('clean-up');
					}, 250);
				} else if (action === 'nav-to-node') {
					let newZ = viewPort.clientWidth / (navNodeRect.w + 360 * z);
					const newX = (x - navNodeRect.l + viewPort.getBoundingClientRect().left + 180 * z) * newZ;
					const newY = (y - navNodeRect.t + viewPort.getBoundingClientRect().top + 80 * z) * newZ;
					newZ = z * newZ;

					moveToPos(newX, newY, newZ, 300);
				} else if (action === 'adjust-for-strat-change') {
					x = x - stratChange.l + stratChange.pl;
					y = y - stratChange.t + stratChange.pt;
					canvas.style.transform = `translate(${x}px, ${y}px) scale(${z})`;
				} else if (action === 'handle-section-context') {
					if (sectionContextOpen) closeContext();
					sectionContextOpen = true;
					setTimeout(() => {
						window.addEventListener('click', closeSectionContext);
						sectionContextDropdown.style.top = `${$sectionContextE.clientY}px`;
						sectionContextDropdown.style.left = `${$sectionContextE.clientX}px`;
					}, 0);
				}
				$canvasAction = null;
			}
		});

		viewPortResizeObserver = new ResizeObserver(updateOnResize);
		canvasResizeObserver = new ResizeObserver(updateOnResize);
		canvasResizeObserver.observe(canvas);
		viewPortResizeObserver.observe(viewPort);
		window.addEventListener('keydown', shortCuts);
		window.addEventListener('keyup', handleKeyUp);
		window.addEventListener('beforeunload', beforeUnload);

		minZoom =
			(canvas?.clientWidth / canvas?.clientHeight > viewPort?.clientWidth / viewPort?.clientHeight
				? viewPort?.clientWidth / canvas?.clientWidth
				: viewPort?.clientHeight / canvas?.clientHeight) / 1.1;
		horizontalOffset = (viewPort?.clientWidth - canvas?.clientWidth * minZoom) / 2 / minZoom;
		verticalOffset = (viewPort?.clientHeight - canvas?.clientHeight * minZoom) / 2 / minZoom;
		if (
			canvas?.clientWidth / canvas?.clientHeight <
			viewPort?.clientWidth / viewPort?.clientHeight
		) {
			vertical = true;
		}
		if ($userCoords[0] === 91291312402) {
			z = minZoom;
			x = horizontalOffset * z;
			y = verticalOffset * z;
			homeX = x;
			homeY = y;
			homeZ = z;
		} else {
			[x, y, z, homeX, homeY, homeZ] = $userCoords;
		}
		canvas.style.transform = `translate(${x}px, ${y}px) scale(${z})`;

		setTimeout(() => {
			if ($userCoords[0] === 91291312402) {
				z = minZoom;
				x = horizontalOffset * z;
				y = verticalOffset * z;
				homeX = x;
				homeY = y;
				homeZ = z;
			} else {
				[x, y, z, homeX, homeY, homeZ] = $userCoords;
			}
			canvas.style.transform = `translate(${x}px, ${y}px) scale(${z})`;
		}, 300);

		return () => {
			document.body.style.overflow = '';

			if (nodeHeightUnsubscribe) nodeHeightUnsubscribe();
			if (canvasActionUnsubscribe) canvasActionUnsubscribe();

			if (viewPort) {
				window.removeEventListener('keydown', shortCuts);
				window.removeEventListener('keyup', handleKeyUp);
				window.removeEventListener('beforeunload', beforeUnload);
				window.removeEventListener('beforeunload', beforeUnload);
				canvasResizeObserver.unobserve(canvas);
				viewPortResizeObserver.unobserve(viewPort);
			}
			userCoords.set([x, y, z, homeX, homeY, homeZ]);
			vertical = false;
		};
	});
	function beforeUnload() {
		userCoords.set([x, y, z, homeX, homeY, homeZ]);
	}
	function updateOnResize() {
		viewPortOffset = {
			x: window.innerWidth - viewPort.clientWidth,
			y: window.innerHeight - viewPort.clientHeight
		};

		minZoom =
			(canvas?.clientWidth / canvas?.clientHeight > viewPort?.clientWidth / viewPort?.clientHeight
				? viewPort?.clientWidth / canvas?.clientWidth
				: viewPort?.clientHeight / canvas?.clientHeight) / 1.1;
		horizontalOffset = (viewPort?.clientWidth - canvas?.clientWidth * minZoom) / 2 / minZoom;
		verticalOffset = (viewPort?.clientHeight - canvas?.clientHeight * minZoom) / 2 / minZoom;

		if (canvas?.clientWidth / canvas?.clientHeight < 1.8) {
			vertical = true;
		} else {
			vertical = false;
		}
		if (!$viewingNode) scale(z);
	}

	function shortCuts(e: KeyboardEvent) {
		const k = e.key;
		if (k === 'Tab') e.preventDefault();
		if ($shortCutsEnabled) {
			if (k === 'h' && (e.ctrlKey || e.metaKey)) {
				setHome();
			} else if (k === 'h') {
				goHome();
			} else if ((e.ctrlKey || e.metaKey) && k === '=') {
				e.preventDefault();
				zoomIn();
			} else if ((e.ctrlKey || e.metaKey) && k === '-') {
				e.preventDefault();
				zoomOut();
			} else if (k === '=' || k === 'x') {
				if (!isZooming) zooming(true);
			} else if (k === '-' || k === 'z') {
				if (!isZooming) zooming(false);
			} else if (k === 'w' || k === 'a' || k === 's' || k === 'd') {
				moving(k);
			} else if (k === 'f') {
				moveToPos(horizontalOffset * minZoom, verticalOffset * minZoom, minZoom);
			} else if (e.shiftKey) shifted = true;
		} else if ((k === '=' && (e.ctrlKey || e.metaKey)) || (k === '-' && (e.ctrlKey || e.metaKey)))
			e.preventDefault();
	}
	function handleKeyUp(e: KeyboardEvent) {
		const k = e.key;
		if (isZooming) {
			if (k === '=' || k === '-' || k === 'z' || k === 'x') {
				isZooming = false;
			}
		}
		if (currentDir) {
			if (currentDir.includes(k)) {
				const newDir = currentDir.replace(k, '');
				currentDir = '';
				if (newDir) {
					moving(newDir);
				}
			}
		}
		if (k === 'Shift') shifted = false;
	}
	function zoomIn() {
		scale(z * (1 + zoomIntensity + 0.15));
	}
	function zoomOut() {
		scale(z * (1 - zoomIntensity - 0.15));
	}
	function setHome() {
		homeX = x;
		homeY = y;
		homeZ = z;
	}
	function goHome() {
		moveToPos(homeX, homeY, homeZ, 400, 900);
	}

	async function moving(dir: string) {
		if (currentDir.includes(dir)) return;
		let speed = 3.5;
		let dx = 0;
		let dy = 0;
		if (currentDir === 'w') {
			if (dir === 'a') {
				currentDir = 'wa';
				dy = (speed / Math.sqrt(2)) * -1;
				dx = (speed / Math.sqrt(2)) * -1;
			} else if (dir === 's') {
				currentDir = '';
				moving(dir);
				return;
			} else if (dir === 'd') {
				currentDir = 'wd';
				dy = (speed / Math.sqrt(2)) * -1;
				dx = speed / Math.sqrt(2);
			}
		} else if (currentDir === 'a') {
			if (dir === 'w') {
				currentDir = 'wa';
				dy = (speed / Math.sqrt(2)) * -1;
				dx = (speed / Math.sqrt(2)) * -1;
			} else if (dir === 's') {
				currentDir = 'as';
				dy = speed / Math.sqrt(2);
				dx = (speed / Math.sqrt(2)) * -1;
			} else if (dir === 'd') {
				currentDir = '';
				moving(dir);
				return;
			}
		} else if (currentDir === 's') {
			if (dir === 'w') {
				currentDir = '';
				moving(dir);
				return;
			} else if (dir === 'a') {
				currentDir = 'as';
				dy = speed / Math.sqrt(2);
				dx = (speed / Math.sqrt(2)) * -1;
			} else if (dir === 'd') {
				currentDir = 'sd';
				dy = speed / Math.sqrt(2);
				dx = speed / Math.sqrt(2);
			}
		} else if (currentDir === 'd') {
			if (dir === 'w') {
				currentDir = 'wd';
				dy = (speed / Math.sqrt(2)) * -1;
				dx = speed / Math.sqrt(2);
			} else if (dir === 'a') {
				currentDir = '';
				moving(dir);
				return;
			} else if (dir === 's') {
				currentDir = 'sd';
				dy = speed / Math.sqrt(2);
				dx = speed / Math.sqrt(2);
			}
		} else if (!currentDir) {
			currentDir = dir;
			if (dir === 'w') dy = -speed;
			else if (dir === 'a') dx = -speed;
			else if (dir === 's') dy = speed;
			else if (dir === 'd') dx = speed;
		} else {
			currentDir = '';
			return;
		}
		let prevDir = currentDir;
		while (currentDir === prevDir) {
			prevDir = currentDir;
			if ((x - dx) / z <= horizontalOffset) {
				if (
					viewPort.clientWidth / z - ((x - dx) / z + canvas.clientWidth) >=
					horizontalOffset + 1
				) {
					x = (viewPort.clientWidth / z - (horizontalOffset + 1) - canvas.clientWidth) * z;
				} else {
					x -= dx;
					if (x / z > horizontalOffset) {
						x = horizontalOffset * z;
					}
				}
			} else {
				x = horizontalOffset * z;
			}
			if ((y - dy) / z <= verticalOffset) {
				if (viewPort.clientHeight / z - ((y - dy) / z + canvas.clientHeight) >= verticalOffset) {
					y = (viewPort.clientHeight / z - verticalOffset - canvas.clientHeight) * z;
				} else {
					y -= dy;
					if (y / z > verticalOffset) {
						y = verticalOffset * z;
					}
				}
			} else {
				y = verticalOffset * z;
			}

			canvas.style.transform = `translate(${x}px, ${y}px) scale(${z})`;
			await new Promise((resolve) => setTimeout(resolve, 1));
		}
	}
	async function zooming(dir: boolean) {
		let zf;
		if (!smoothMoving) {
			isZooming = true;
			while (isZooming) {
				if (dir) {
					zf = z * 1.008;
				} else {
					zf = z * 0.992;
				}
				const scaleMultiplier = zf / z;
				z = Math.min(Math.max(zf, minZoom), 100);
				if (!(z === 100) && !(z === minZoom)) {
					const offsetX = (viewPort.clientWidth / 2 - x) * (1 - scaleMultiplier);
					const offsetY = (viewPort.clientHeight / 2 - y) * (1 - scaleMultiplier);
					if ((x + offsetX) / z <= horizontalOffset) {
						if (
							viewPort.clientWidth / z - ((x + offsetX) / z + canvas.clientWidth) >=
							horizontalOffset + 1
						) {
							x = (viewPort.clientWidth / z - (horizontalOffset + 1) - canvas.clientWidth) * z;
						} else {
							x += offsetX;
							if (x / z > horizontalOffset) {
								x = horizontalOffset * z;
							}
						}
					} else {
						x = horizontalOffset * z;
					}
					if ((y + offsetY) / z <= verticalOffset) {
						if (
							viewPort.clientHeight / z - ((y + offsetY) / z + canvas.clientHeight) >=
							verticalOffset + 1
						) {
							y = (viewPort.clientHeight / z - (verticalOffset + 1) - canvas.clientHeight) * z;
						} else {
							y += offsetY;
							if (y / z > verticalOffset) {
								y = verticalOffset * z;
							}
						}
					} else {
						y = verticalOffset * z;
					}
				} else if (z === minZoom) {
					x = horizontalOffset * z;
					y = verticalOffset * z;
				}
				canvas.style.transform = `translate(${x}px, ${y}px) scale(${z})`;
				await new Promise((resolve) => setTimeout(resolve, 2));
			}
		}
	}
	function handleGrab(e: MouseEvent) {
		if (!shifted && !$viewingNode) {
			grabbed = true;
			grabX = e.clientX;
			grabY = e.clientY;
			window.addEventListener('mousemove', grabMove);
		}
	}
	function grabMove(e: MouseEvent) {
		let dx = grabX - e.clientX;
		let dy = grabY - e.clientY;
		grabX = e.clientX;
		grabY = e.clientY;
		if ((x - dx) / z <= horizontalOffset) {
			if (viewPort.clientWidth / z - ((x - dx) / z + canvas.clientWidth) >= horizontalOffset + 1) {
				x = (viewPort.clientWidth / z - (horizontalOffset + 1) - canvas.clientWidth) * z;
			} else {
				x -= dx;
				if (x / z > horizontalOffset) {
					x = horizontalOffset * z;
				}
			}
		} else {
			x = horizontalOffset * z;
		}
		if ((y - dy) / z <= verticalOffset) {
			if (viewPort.clientHeight / z - ((y - dy) / z + canvas.clientHeight) >= verticalOffset) {
				y = (viewPort.clientHeight / z - verticalOffset - canvas.clientHeight) * z;
			} else {
				y -= dy;
				if (y / z > verticalOffset) {
					y = verticalOffset * z;
				}
			}
		} else {
			y = verticalOffset * z;
		}

		canvas.style.transform = `translate(${x}px, ${y}px) scale(${z})`;
	}

	function scale(zf: number, dur = 250, delay = dur) {
		if (!smoothMoving) {
			motionX.set(x, { duration: 0 });
			motionY.set(y, { duration: 0 });
			motionZ.set(z, { duration: 0 });
			smoothMoving = true;

			const scaleMultiplier = zf / z;
			z = Math.min(Math.max(zf, minZoom), 100);

			if (!(z === 100) && !(z === minZoom)) {
				const offsetX = (viewPort.clientWidth / 2 - x) * (1 - scaleMultiplier);
				const offsetY = (viewPort.clientHeight / 2 - y) * (1 - scaleMultiplier);

				if ((x + offsetX) / z <= horizontalOffset) {
					if (
						viewPort.clientWidth / z - ((x + offsetX) / z + canvas.clientWidth) >=
						horizontalOffset + 1
					) {
						x = (viewPort.clientWidth / z - (horizontalOffset + 1) - canvas.clientWidth) * z;
					} else {
						x += offsetX;
						if (x / z > horizontalOffset) {
							x = horizontalOffset * z;
						}
					}
				} else {
					x = horizontalOffset * z;
				}
				if ((y + offsetY) / z <= verticalOffset) {
					if (
						viewPort.clientHeight / z - ((y + offsetY) / z + canvas.clientHeight) >=
						verticalOffset + 1
					) {
						y = (viewPort.clientHeight / z - (verticalOffset + 1) - canvas.clientHeight) * z;
					} else {
						y += offsetY;
						if (y / z > verticalOffset) {
							y = verticalOffset * z;
						}
					}
				} else {
					y = verticalOffset * z;
				}
			} else if (z === minZoom) {
				x = horizontalOffset * z;
				y = verticalOffset * z;
			}

			motionX.update(() => x, { duration: dur });
			motionY.update(() => y, { duration: dur });
			motionZ.update(() => z, { duration: dur });

			setTimeout(() => {
				smoothMoving = false;
			}, delay);
		}
	}
	function handlePanZoom(e: WheelEvent) {
		e.preventDefault();
		if (!contextOpen && !smoothMoving) {
			if (e.ctrlKey) {
				const scaleMultiplier = 1 + -(e.deltaY * zoomIntensity);
				const targetZoom = z * scaleMultiplier;

				z = Math.min(Math.max(targetZoom, minZoom), 100);
				if (!(z === 100) && !(z === minZoom)) {
					const offsetX = (e.clientX - x - viewPortOffset.x) * (1 - scaleMultiplier);
					const offsetY = (e.clientY - y - viewPortOffset.y) * (1 - scaleMultiplier);

					if ((x + offsetX) / z <= horizontalOffset) {
						if (
							viewPort.clientWidth / z - ((x + offsetX) / z + canvas.clientWidth) >=
							horizontalOffset + 1
						) {
							x = (viewPort.clientWidth / z - (horizontalOffset + 1) - canvas.clientWidth) * z;
						} else {
							x += offsetX;
							if (x / z > horizontalOffset) {
								x = horizontalOffset * z;
							}
						}
					} else {
						x = horizontalOffset * z;
					}
					if ((y + offsetY) / z <= verticalOffset) {
						if (
							viewPort.clientHeight / z - ((y + offsetY) / z + canvas.clientHeight) >=
							verticalOffset + 1
						) {
							y = (viewPort.clientHeight / z - (verticalOffset + 1) - canvas.clientHeight) * z;
						} else {
							y += offsetY;
							if (y / z > verticalOffset) {
								y = verticalOffset * z;
							}
						}
					} else {
						y = verticalOffset * z;
					}
					canvas.style.transform = `translate(${x}px, ${y}px) scale(${z})`;
				} else if (z === minZoom) {
					z = minZoom;
					x = horizontalOffset * z;
					y = verticalOffset * z;
					canvas.style.transform = `translate(${x}px, ${y}px) scale(${z})`;
				}
			} else {
				if ((x - e.deltaX) / z <= horizontalOffset) {
					if (
						viewPort.clientWidth / z - ((x - e.deltaX) / z + canvas.clientWidth) >=
						horizontalOffset + 1
					) {
						x = (viewPort.clientWidth / z - (horizontalOffset + 1) - canvas.clientWidth) * z;
					} else {
						x -= e.deltaX;
						if (x / z > horizontalOffset) {
							x = horizontalOffset * z;
						}
					}
				} else {
					x = horizontalOffset * z;
				}
				if ((y - e.deltaY) / z <= verticalOffset) {
					if (
						viewPort.clientHeight / z - ((y - e.deltaY) / z + canvas.clientHeight) >=
						verticalOffset
					) {
						y = (viewPort.clientHeight / z - verticalOffset - canvas.clientHeight) * z;
					} else {
						y -= e.deltaY;
						if (y / z > verticalOffset) {
							y = verticalOffset * z;
						}
					}
				} else {
					y = verticalOffset * z;
				}

				canvas.style.transform = `translate(${x}px, ${y}px) scale(${z})`;
			}
		}
	}
	function context(e: MouseEvent) {
		if (!$viewingNode) {
			e.preventDefault();
			if (contextOpen) closeContext();
			contextOpen = true;
			setTimeout(() => {
				window.addEventListener('click', closeContext);
				rightClickDropdown.style.top = `${e.clientY}px`;
				rightClickDropdown.style.left = `${e.clientX}px`;
			}, 0);
		}
	}
	function closeContext() {
		contextOpen = false;
		window.removeEventListener('click', closeContext);
	}
	function closeSectionContext() {
		sectionContextOpen = false;
		window.removeEventListener('click', closeSectionContext);
	}
</script>

{#if contextOpen}
	<div
		class="fixed z-[200] w-auto top-[-100px] left-[-100px] rounded-md bg-[#282828] grid text-[12px] text-nowrap px-[5px] py-[5px] h-auto outline outline-[1px] outline-[#535353]"
		bind:this={rightClickDropdown}
	>
		<button on:click={setHome} class="hover:bg-[#3c72ca] rounded-[4px] flex items-center px-[6px]"
			>Set Home <p class="ml-2">(<kbd>cmd</kbd>+<kbd>h</kbd>)</p></button
		>
		<button on:click={goHome} class="hover:bg-[#3c72ca] rounded-[4px] flex items-center px-[6px]"
			>Go Home <p class="ml-auto">(<kbd>h</kbd>)</p></button
		>
	</div>
{:else if sectionContextOpen}
	<div
		class="fixed z-[200] w-auto top-[-100px] left-[-100px] rounded-md bg-[#282828] grid text-[12px] text-nowrap px-[5px] py-[5px] h-auto outline outline-[1px] outline-[#535353]"
		bind:this={sectionContextDropdown}
	>
		<button
			on:click={() => nodeAction.set('delete-section')}
			class="hover:bg-[#c44747] rounded-[4px] flex items-center px-[6px]">Delete Section</button
		>
	</div>
{/if}

<div
	class="h-full w-full overflow-hidden bg-[#151515] {grabbed ? 'cursor-grabbing' : ''}"
	on:wheel={$viewingNode ? scrollEditing : handlePanZoom}
	on:mousedown={handleGrab}
	on:mouseup={() => {
		window.removeEventListener('mousemove', grabMove);
		grabbed = false;
	}}
	on:contextmenu={context}
	bind:this={viewPort}
	role="presentation"
>
	<div class="canvas" bind:this={canvas}>
		<Tree />
		{#if vertical}
			<div style="height: {verticalOffset}px" />
		{/if}
	</div>
</div>

<style>
	.canvas {
		position: relative;
		transform-origin: top left;
		width: min-content;
		height: min-content;
	}
	.canvas::selection {
		background: #80808080;
		color: #f5f5f5;
	}
</style>
