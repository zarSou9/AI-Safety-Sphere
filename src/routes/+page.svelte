<script>
	import Lay from './HomeLayout.svelte';
</script>

<Lay>
	<div class="ml-[80px] mt-[100px] mr-10">
		<div class="flex">
			<div>
				<h1 class="text-6xl">AI Safety Sphere</h1>
				<div class="mt-10 flex justify-center items-center">
					<p class="mr-auto w-[560px]">
						Welcome to the AI Safety Sphere, or AISS (pronounced: ice), the epicenter for AI Safety
						research. We reach to re-envision how research is developed, and how solutions are
						ideated.
					</p>
				</div>
				<button class="mt-10 rounded-full btn-sm variant-filled-tertiary">
					<span>|></span>
					<span>Watch The Video</span>
				</button>
			</div>
			<div class="ml-[300px] rounded-[100px] overflow-hidden">
				<img class="size-[500px]" src="/images/sphere.png" alt="profile" />
			</div>
		</div>

		<div class="mt-[200px] ml-auto mr-[50px] flex justify-end">
			<div class="flex flex-col items-end">
				<h1 class="text-6xl">Colaborative Mind Map</h1>
				<p class="mt-10 w-[600px] text-right">
					Lorem ipsum dolor sit amet consectetur adipisicing elit. Error, in! Rerum architecto
					aliquid vero itaque, iste fugit provident nam ipsam non illo? Voluptatum est quo ratione
					eaque distinctio reiciendis recusandae? iste fugit provident nam ipsam non illo?
					Voluptatum est quo ratione eaque distinctio reiciendis recusandae?
				</p>
			</div>
		</div>

		<h1 class="text-6xl mt-20">Who are we</h1>
		<div class="mt-10 flex justify-center items-center mb-[200px]">
			<p class="max-w-96 mr-auto max">I am Myles</p>
		</div>
	</div>
</Lay>
