<script lang="ts">
	import * as THREE from "three";
	import { createdTree } from "@/utility/three/createdThree";
	import { onMount } from "svelte";
	import { Timer } from "three";
	import { createdDevOrbitControls } from "@/utility/three/devOrbitControls";

	let canvasWrapEl = $state<HTMLElementTagNameMap["div"]>();

	onMount(() => {
		if (canvasWrapEl) {
			const { scene, camera, renderer } = createdTree(canvasWrapEl, 80);
			camera.position.z = 5;

			let devControls = window._rv_isDev ? createdDevOrbitControls(camera, renderer) : null;

			const geometry = new THREE.BoxGeometry(1, 1, 1);
			const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
			const cube = new THREE.Mesh(geometry, material);
			scene.add(cube);

			// setAnimationLoop
			const timer = new Timer();
			function animate(timestamp: number) {
				timer.update(timestamp);

				if (devControls) devControls.update(timer.getDelta());

				renderer.render(scene, camera);
			}

			renderer.setAnimationLoop(animate);
		}
	});
</script>

<div bind:this={canvasWrapEl} class="canvas-wrap">
	<h2>wall-trst</h2>
</div>

<style>
	.canvas-wrap {
		width: 100svw;
		height: 100svh;
		position: relative;
	}

	h2 {
		position: absolute;
		top: 20px;
		left: 20px;
		color: #dfdfdf;
		text-shadow:
			#000 1px 1px 1px,
			#000 -1px 1px 1px,
			#000 1px -1px 1px,
			#000 -1px -1px 1px;
		pointer-events: none;
	}
</style>
