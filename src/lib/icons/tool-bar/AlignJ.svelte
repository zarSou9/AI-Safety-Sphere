<script lang="ts">
	export let color: string;
	export let size: string;
</script>

<svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
	<g stroke={color} stroke-linecap="round" stroke-width="2">
		<path d="M4 6h16" />
		<path d="M4 10h16" />
		<path d="M4 14h16" />
		<path d="M4 18h16" />
	</g>
</svg>
