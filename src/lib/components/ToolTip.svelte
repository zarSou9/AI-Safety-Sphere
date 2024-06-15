<script lang="ts">
	import { twMerge as tm } from 'tailwind-merge';
	import FadeElement from '$lib/components/FadeElement.svelte';

	export let tip: string = '';
	export let className: string = '';
	export let side: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
</script>

<FadeElement {side}>
	<p
		class={tm('text-[13px] text-nowrap rounded-[6px] py-[4px] px-[8px] bg-[#464646ec]', className)}
	>
		{tip}
		<slot />
	</p>
</FadeElement>
