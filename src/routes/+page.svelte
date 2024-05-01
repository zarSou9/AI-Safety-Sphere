<script>
	import Lay from './HomeLayout.svelte';
</script>

<Lay>
	<div class="ml-[80px] mt-[100px] mr-10">
		<div class="grid">
			<div>
				<h1 class="text-6xl">AI Safety Sphere</h1>
				<div class="mt-10 flex justify-center items-center">
					<p class="mr-auto max-w-[560px]">
						Welcome to the AI Safety Sphere, or AISS (pronounced: ice). If you are an alignment
						researcher or someone interested in the topic, this is a collaborative tool designed to
						help frame your thinking while tackling this large issue.
					</p>
				</div>
			</div>
			<div class="ml-auto rounded-[100px] overflow-hidden">
				<img src="/images/sphere.png" alt="profile" />
			</div>
		</div>
	</div>
</Lay>

<style>
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
	}

	.grid img {
		width: 100%;
		height: auto;
		max-width: 500px;
		max-height: 500px;
	}

	@media (max-width: 768px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
