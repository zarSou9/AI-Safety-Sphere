<script lang="ts">
	export let color: string;
	export let size: string;
</script>

<svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
	<path
		stroke={color}
		stroke-linecap="round"
		stroke-linejoin="round"
		stroke-width="2"
		d="M7 4v7a5 5 0 0 0 5 5v0a5 5 0 0 0 5-5V4M7 20h10"
	/>
</svg>
