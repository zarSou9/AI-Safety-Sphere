<script lang="ts">
	export let size = { width: 2200, height: 2000 };
	export let pointA = { x: 100, y: 100 };
	export let pointB = { x: 12, y: 0 };

	let controlDistance: any;
	let controlPointB: any;
	let controlPointA: any;
	let pathData: any;

	$: {
		controlDistance = Math.abs(pointA.y - pointB.y) / 1.5;
		controlPointB = { x: pointB.x, y: pointB.y - controlDistance };
		controlPointA = { x: pointA.x, y: pointA.y + controlDistance };
		pathData = `M ${pointB.x},${pointB.y} C ${controlPointB.x},${controlPointB.y} ${controlPointA.x},${controlPointA.y} ${pointA.x},${pointA.y}`;
	}
</script>

<div class="pointer-events-none absolute left-0 right-0">
	<svg viewBox="0 0 {size.width} {size.height}" xmlns="http://www.w3.org/2000/svg">
		<path d={pathData} stroke="#9a9a9a" fill="none" stroke-width="1px" />
	</svg>
</div>
