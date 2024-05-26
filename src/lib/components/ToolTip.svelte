<script lang="ts">
	import { twMerge as tm } from 'tailwind-merge';

	export let tip: string;
	export let className: string = '';
	export let top: boolean = true;
</script>

<p
	class={tm(
		'group-hover:opacity-100 fade-100 rounded-[10px] text-[13px] text-nowrap opacity-0 pointer-events-none absolute left-1/2 -translate-x-1/2 py-[4px] px-[8px] bg-[#464646e1]',
		top ? 'top-0 -translate-y-[calc(100%+3px)]' : 'bottom-0 translate-y-[calc(100%+3px)]',
		className
	)}
>
	{tip}
</p>
