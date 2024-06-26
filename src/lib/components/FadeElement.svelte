<script lang="ts">
	import { twMerge as tm } from 'tailwind-merge';

	export let className: string = '';
	export let side: 'top' | 'bottom' | 'left' | 'right' | 'custom' = 'bottom';
</script>

<div
	class={tm(
		'absolute z-[100] p-[5px] opacity-0 fade-75 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto',
		side === 'top' ? 'left-1/2 -translate-x-1/2 top-0 -translate-y-[calc(100%-1px)]' : '',
		side === 'bottom' ? 'left-1/2 -translate-x-1/2 bottom-0 translate-y-[calc(100%-1px)]' : '',
		side === 'left' ? 'top-1/2 -translate-y-1/2 left-0 -translate-x-[calc(100%-1px)]' : '',
		side === 'right' ? 'top-1/2 -translate-y-1/2 right-0 translate-x-[calc(100%-1px)]' : '',
		className
	)}
>
	<slot />
</div>
