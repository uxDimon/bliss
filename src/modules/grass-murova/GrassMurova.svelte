<script lang="ts">
	import * as THREE from "three";
	import { createdTree } from "@/utility/three/createdThree";
	import { onMount } from "svelte";
	import { Timer } from "three";
	import { DevOrbitControls } from "@/utility/three/devOrbitControls";
	import { DevHelpers } from "@/utility/three/devHelper";
	import { BufferGeometryUtils, HDRLoader, RoomEnvironment } from "three/examples/jsm/Addons.js";
	import Stats from "stats.js";
	import vertexShader from "./shaders/grass-vertex.glsl";
	import { GrassGroup } from "@/modules/grass-murova/components/grass-group";
	import { GrassLodGeometry } from "@/modules/grass-murova/components/grass-lod-geometry";
	import { GrassGeometry } from "@/modules/grass-murova/components/grass-geometry";
	import { generateCylinderNormalMap } from "@/modules/grass-murova/components/utility";

	let canvasWrapEl = $state<HTMLElementTagNameMap["div"]>();

	onMount(() => {
		if (canvasWrapEl) {
			var stats = new Stats();
			canvasWrapEl.appendChild(stats.dom);
			stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
			stats.dom.style.transform = "scale(2.5)";
			stats.dom.style.transformOrigin = "top left";

			const { scene, camera, renderer } = createdTree(canvasWrapEl, 80);

			const pmremGenerator = new THREE.PMREMGenerator(renderer);
			pmremGenerator.compileEquirectangularShader();
			new HDRLoader().load(new URL("./assets/lilienstein_1k.hdr", import.meta.url).href, (texture) => {
				const envMap = pmremGenerator.fromEquirectangular(texture).texture;
				// scene.background = envMap;
				scene.environment = envMap;
				texture.dispose();
				pmremGenerator.dispose();
			});
			renderer.toneMapping = THREE.ACESFilmicToneMapping;

			scene.background = new THREE.Color(0x283539);
			camera.position.z = 5;

			// renderer.shadowMap.enabled = true;

			// _rv_isDev
			let devOrbitControls: DevOrbitControls | null = null;
			let devHelper: DevHelpers | null = null;
			if (window._rv_isDev) {
				devOrbitControls = new DevOrbitControls(camera, renderer.domElement, {
					// position: new THREE.Vector3(90, 12, 90),
					// target: new THREE.Vector3(0, 6, 0),
				});

				devHelper = new DevHelpers(scene);
				// devHelper.axes();
				// const devGround = devHelper.ground();
				// devGround.material.color.setHex(0x808a58);
				// devGround.material.map = null;
				// devGround.receiveShadow = true;
			}

			const normalMap = generateCylinderNormalMap(16, 16, 1.5, "y", true);
			normalMap.wrapT = THREE.RepeatWrapping;
			normalMap.repeat.set(1, 2);
			normalMap.center.set(0.5, 1);

			type CustomUniforms = {
				[uniform: string]: THREE.IUniform<any>;
			};
			let customUniforms: CustomUniforms | null = null;
			const grassMaterial = new THREE.MeshStandardMaterial({
				color: 0x538836,
				side: THREE.DoubleSide,
				normalMap: normalMap,
				normalScale: new THREE.Vector2(2, 6),
				metalness: 0.6,
				roughness: 0.5,
			});
			grassMaterial.onBeforeCompile = (shader) => {
				customUniforms = shader.uniforms;

				// Добавляем нашу кастомную униформу 'time'
				customUniforms.time = { value: 0.0 };
				customUniforms.windDirection = { value: new THREE.Vector3(1, 0, 0) };
				customUniforms.windStrength = { value: 0.4 };

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

			// light
			// const aLight = new THREE.AmbientLight(0xffffff, 1.1);
			// scene.add(aLight);

			// const dLight = new THREE.DirectionalLight(0xffffff, 1.3);
			// dLight.position.set(10, 10, 15);
			// dLight.castShadow = true;
			// dLight.shadow.mapSize.set(1024, 1024);
			// scene.add(dLight);
			// const dLightH = new THREE.DirectionalLightHelper(dLight, 5);
			// scene.add(dLightH);

			// GrassChunk
			const wireframe = false;
			const side: THREE.Side = THREE.DoubleSide;

			const grassGeometry = new GrassGeometry({
				points: [
					new THREE.Vector3(-0.08, 0, 0),
					new THREE.Vector3(-0.1, 1.3, -0.22),
					new THREE.Vector3(0, 2.5, -0.6),
				],
			});

			const grassLodGeometry = new GrassLodGeometry({
				size: new THREE.Vector2(10, 10),
				scaleY: { high: 2.5 },
				bladeGrassCount: 60,
			});

			// ---
			// const mesh = new THREE.Mesh(
			// 	grassLodGeometry.getLodGeometry(grassGeometry.getGeometry(4), 0.25),
			// 	new THREE.MeshStandardMaterial({
			// 		// color: 0x77ee37,
			// 		// emissive: 0x77ee37,
			// 		color: 0x538836,
			// 		normalMap: normalMap,
			// 		normalScale: new THREE.Vector2(2, 6),
			// 		metalness: 0.6,
			// 		roughness: 0.5,
			// 		side: THREE.DoubleSide,
			// 		// wireframe: true,
			// 	}),
			// );
			// scene.add(mesh);
			// ---

			const group = new GrassGroup({
				groupPosition: new THREE.Vector3(0, 0, 0),
				groupSize: new THREE.Vector2(200, 200),
				groupGrid: new THREE.Vector2(2, 2),
				chunkBladeGrassCount: 300,
				chunkLod: [
					{
						distance: 0,
						geometry: grassLodGeometry.getLodGeometry(grassGeometry.getGeometry(5)),
						material: grassMaterial,
					},
					{
						distance: 20,
						geometry: grassLodGeometry.getLodGeometry(grassGeometry.getGeometry(3), 0.8),
						material: grassMaterial,
					},
					{
						distance: 30,
						geometry: grassLodGeometry.getLodGeometry(grassGeometry.getGeometry(2), 0.55),
						material: grassMaterial,
					},
					{
						distance: 40,
						geometry: grassLodGeometry.getLodGeometry(grassGeometry.getGeometry(1), 0.25),
						material: grassMaterial,
					},
				],
			});

			scene.add(group.group);
			scene.add(...group.box3Helpers);

			if (devOrbitControls) {
				devOrbitControls.addEventListener("change", () => {
					group.updateLOD(camera.position);
				});
				// group.updateLOD(camera.position);
			}

			// setAnimationLoop
			const timer = new Timer();
			function animate(timestamp: number) {
				stats.begin();

				timer.update(timestamp);

				// chunk.updateLOD(camera.position);

				if (devOrbitControls) devOrbitControls.update(timer.getDelta());

				if (customUniforms) {
					customUniforms.time!.value = timer.getElapsed();
					// Опционально: динамический ветер
					customUniforms
						.windDirection!.value.set(
							Math.sin(timer.getElapsed() * 0.005),
							0,
							Math.cos(timer.getElapsed() * 0.05),
						)
						.normalize();
				}

				renderer.render(scene, camera);

				stats.end();
			}

			renderer.setAnimationLoop(animate);
		}
	});
</script>

<div bind:this={canvasWrapEl} class="canvas-wrap">
	<h2>bliss</h2>
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
