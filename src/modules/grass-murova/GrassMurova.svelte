<script lang="ts">
	import * as THREE from "three";
	import { createdTree } from "@/utility/three/createdThree";
	import { onMount } from "svelte";
	import { Timer } from "three";
	import { DevOrbitControls } from "@/utility/three/devOrbitControls";
	import { DevHelpers } from "@/utility/three/devHelper";

	import vertexShader from "./shaders/grass-vertex.glsl";
	import fragmentShader from "./shaders/grass-fragment.glsl";

	let canvasWrapEl = $state<HTMLElementTagNameMap["div"]>();

	onMount(() => {
		if (canvasWrapEl) {
			const { scene, camera, renderer } = createdTree(canvasWrapEl, 80);

			camera.position.z = 5;

			// renderer.shadowMap.enabled = true;

			// _rv_isDev
			let devOrbitControls: DevOrbitControls | null = null;
			let devHelper: DevHelpers | null = null;
			if (window._rv_isDev) {
				devOrbitControls = new DevOrbitControls(camera, renderer.domElement);

				devHelper = new DevHelpers(scene);
				devHelper.axes();
				const devGround = devHelper.ground();
				// devGround.receiveShadow = true;
			}

			// grass
			const grassMaterial = new THREE.MeshStandardMaterial({
				// color: 0x51cb51,
				side: THREE.DoubleSide,
			});

			type CustomUniforms = {
				[uniform: string]: THREE.IUniform<any>;
			};
			let customUniforms: CustomUniforms | null = null;
			grassMaterial.onBeforeCompile = (shader) => {
				customUniforms = shader.uniforms;

				// Добавляем нашу кастомную униформу 'time'
				customUniforms.time = { value: 0.0 };
				customUniforms.windDirection = { value: new THREE.Vector3(1, 0, 0) };
				customUniforms.windStrength = { value: 0.2 };

				// Добавляем атрибут `random` и `uniform` `time`
				const newVertexShader = `
					uniform float time;
					uniform vec3 windDirection;
					uniform float windStrength;
					attribute float random;
					${shader.vertexShader}
				`;

				// Заменяем стандартный блок для добавления нашей анимации
				shader.vertexShader = newVertexShader.replace("#include <begin_vertex>", vertexShader);
			};

			const bladeGrassCount = 1000;
			const grassGeometry = new THREE.PlaneGeometry(0.1, 3, 1, 3);
			const instancedGrass = new THREE.InstancedMesh(grassGeometry, grassMaterial, bladeGrassCount);

			const color = new THREE.Color();

			const randoms = new Float32Array(bladeGrassCount);
			const positionHelper = new THREE.Object3D();
			const squareSize = 5;
			for (let index = 0; index < bladeGrassCount; index++) {
				randoms[index] = THREE.MathUtils.randFloat(0.3, 1.3);
				const scaleHeight = THREE.MathUtils.randFloat(0.7, 1.1);

				positionHelper.position.set(
					THREE.MathUtils.randFloat(-squareSize, squareSize),
					(grassGeometry.parameters.height / 2) * scaleHeight,
					THREE.MathUtils.randFloat(-squareSize, squareSize),
				);
				positionHelper.rotation.y = THREE.MathUtils.randFloat(0, Math.PI);
				positionHelper.scale.set(1, scaleHeight, 1);

				positionHelper.updateMatrix();
				instancedGrass.setMatrixAt(index, positionHelper.matrix);

				color.setHSL(
					(360 / 100000) * THREE.MathUtils.randInt(24, 94),
					THREE.MathUtils.randFloat(0.6, 0.9),
					THREE.MathUtils.randFloat(0.3, 0.5),
				);
				instancedGrass.setColorAt(index, color);
			}

			grassGeometry.setAttribute("random", new THREE.InstancedBufferAttribute(randoms, 1));
			instancedGrass.instanceMatrix.needsUpdate = true;
			scene.add(instancedGrass);

			// light
			const aLight = new THREE.AmbientLight(0xffffff, 0.3);
			scene.add(aLight);

			const dLight = new THREE.DirectionalLight(0xffffff, 1.3);
			dLight.position.set(10, 10, 15);
			// dLight.castShadow = true;
			// dLight.shadow.mapSize.set(1024, 1024);
			scene.add(dLight);
			const dLightH = new THREE.DirectionalLightHelper(dLight, 5);
			scene.add(dLightH);

			// setAnimationLoop
			const timer = new Timer();
			function animate(timestamp: number) {
				timer.update(timestamp);

				if (devOrbitControls) devOrbitControls.update(timer.getDelta());

				if (customUniforms) {
					customUniforms.time!.value = timer.getElapsed();
				}

				renderer.render(scene, camera);
			}

			renderer.setAnimationLoop(animate);
		}
	});
</script>

<div bind:this={canvasWrapEl} class="canvas-wrap">
	<h2>grass-murova</h2>
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
