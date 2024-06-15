<script lang="ts">
	import { twMerge as tm } from 'tailwind-merge';

	export let className: string = '';
	export let side: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
</script>

<div
	class={tm(
		'absolute z-[100] left-1/2 -translate-x-1/2 pt-[5px] px-[8px] pb-[8px] opacity-0 fade-75 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto',
		side === 'top' ? 'top-0 -translate-y-[calc(100%-1px)]' : '',
		side === 'bottom' ? 'bottom-0 translate-y-[calc(100%-1px)]' : '',
		side === 'left' ? 'top-0 -translate-y-[calc(100%+3px)]' : '',
		side === 'right' ? 'top-0 -translate-y-[calc(100%+3px)]' : '',
		className
	)}
>
	<slot />
</div>
