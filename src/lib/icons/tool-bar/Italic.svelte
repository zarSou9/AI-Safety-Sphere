<script lang="ts">
	export let color: string;
	export let size: string;
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	version="1.1"
	xmlns="http://www.w3.org/2000/svg"
	xmlns:xlink="http://www.w3.org/1999/xlink"
>
	<title>Text-Italic</title>
	<g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
		<g id="Text-Italic">
			<rect id="Rectangle" fill-rule="nonzero" x="0" y="0" width="24" height="24"> </rect>
			<line
				x1="10.5"
				y1="20"
				x2="13.5"
				y2="4"
				id="Path"
				stroke={color}
				stroke-width="2"
				stroke-linecap="round"
			>
			</line>
			<line
				x1="9"
				y1="4"
				x2="17"
				y2="4"
				id="Path"
				stroke={color}
				stroke-width="2"
				stroke-linecap="round"
			>
			</line>
			<line
				x1="7"
				y1="20"
				x2="15"
				y2="20"
				id="Path"
				stroke={color}
				stroke-width="2"
				stroke-linecap="round"
			>
			</line>
		</g>
	</g>
</svg>
