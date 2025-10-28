<script lang="ts">
	import * as THREE from "three";
	import { createdTree } from "@/utility/three/createdThree";
	import { onMount } from "svelte";
	import { Timer } from "three";
	import { DevOrbitControls } from "@/utility/three/devOrbitControls";
	import { DevHelpers } from "@/utility/three/devHelper";

	let canvasWrapEl = $state<HTMLElementTagNameMap["div"]>();

	const loader = new THREE.TextureLoader();

	const createTexture = (url: string) => {
		const texture = loader.load(url);
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(2, 2);
		texture.colorSpace = THREE.SRGBColorSpace;
		// texture.magFilter = THREE.NearestFilter;
		// texture.center.set(0.5, 0.5);
		texture.minFilter = THREE.LinearMipmapLinearFilter;
		texture.anisotropy = 2;
		return texture;
	};

	const texturesUrl = {
		diff: new URL("./assets/wood_floor_deck_diff_1k.jpg", import.meta.url).href,
		norGl: new URL("./assets/wood_floor_deck_nor_gl_1k.jpg", import.meta.url).href,
	} as const;

	const textures = {
		diff: createTexture(texturesUrl.diff),
		norGl: createTexture(texturesUrl.norGl),
	};

	onMount(() => {
		if (canvasWrapEl) {
			const { scene, camera, renderer } = createdTree(canvasWrapEl, 80);

			camera.position.z = 5;

			renderer.shadowMap.enabled = true;

			let devOrbitControls: DevOrbitControls | null = null;
			let devHelper: DevHelpers | null = null;
			if (window._rv_isDev) {
				devOrbitControls = new DevOrbitControls(camera, renderer.domElement);

				devHelper = new DevHelpers(scene);
				devHelper.axes();
				const devGround = devHelper.ground();
				devGround.receiveShadow = true;
			}

			// Mesh
			const material = new THREE.MeshStandardMaterial({
				// color: 0xffffff,
				map: textures.diff,
				normalMap: textures.norGl,
				normalScale: new THREE.Vector2(0.1, 0.7),
			});
			material.color.setRGB(2, 2, 2);

			const geometry = new THREE.BoxGeometry(2, 2, 1);
			const cube = new THREE.Mesh(geometry, material);
			cube.castShadow = true;
			cube.receiveShadow = true;
			cube.position.y = geometry.parameters.height / 2;
			scene.add(cube);

			const sGeometry = new THREE.SphereGeometry(1, 32, 32);
			const sMesh = new THREE.Mesh(sGeometry, material);
			sMesh.castShadow = true;
			sMesh.position.y = sGeometry.parameters.radius;
			sMesh.position.x = 2;
			sMesh.position.z = 1;

			scene.add(sMesh);

			// light
			const aLight = new THREE.AmbientLight(0xffffff, 0.1);
			scene.add(aLight);

			const dLight = new THREE.DirectionalLight(0xffffff, 2);
			dLight.position.set(10, 10, 15);
			dLight.castShadow = true;
			dLight.shadow.mapSize.set(1024, 1024);
			scene.add(dLight);
			const dLightH = new THREE.DirectionalLightHelper(dLight, 5);
			scene.add(dLightH);

			// setAnimationLoop
			const timer = new Timer();
			function animate(timestamp: number) {
				timer.update(timestamp);

				if (devOrbitControls) devOrbitControls.update(timer.getDelta());

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
		right: 20px;
		color: #dfdfdf;
		text-shadow:
			#000 1px 1px 1px,
			#000 -1px 1px 1px,
			#000 1px -1px 1px,
			#000 -1px -1px 1px;
		pointer-events: none;
	}
</style>
