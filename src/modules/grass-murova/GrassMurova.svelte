<script lang="ts">
	import * as THREE from "three";
	import { createdTree } from "@/utility/three/createdThree";
	import { onMount } from "svelte";
	import { Timer } from "three";
	import { DevOrbitControls } from "@/utility/three/devOrbitControls";
	import { DevHelpers } from "@/utility/three/devHelper";
	import { HDRLoader, RoomEnvironment } from "three/examples/jsm/Addons.js";

	import Stats from "stats.js";

	import vertexShader from "./shaders/grass-vertex.glsl";
	import fragmentShader from "./shaders/grass-fragment.glsl";
	import { GrassChunk } from "@/modules/grass-murova/components/grass-chunk";
	import { DevSphereHelper } from "@/utility/three/devSphereHelper";
	import GrassGroup from "@/modules/grass-murova/components/grass-group";

	let canvasWrapEl = $state<HTMLElementTagNameMap["div"]>();

	const loader = new THREE.TextureLoader();

	const createTexture = (url: string) => {
		const texture = loader.load(url);
		// texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		// texture.repeat.set(2, 2);
		texture.colorSpace = THREE.SRGBColorSpace;
		// texture.magFilter = THREE.NearestFilter;
		// texture.center.set(0.5, 0.5);
		// texture.minFilter = THREE.LinearMipmapLinearFilter;
		// texture.anisotropy = 2;
		return texture;
	};

	const texturesUrl = {
		diff: new URL("./assets/diff.png", import.meta.url).href,
		nor: new URL("./assets/nor.png", import.meta.url).href,
		alpha: new URL("./assets/alpha.png", import.meta.url).href,
		ao: new URL("./assets/ao.png", import.meta.url).href,
		rough: new URL("./assets/rough.png", import.meta.url).href,
	} as const;

	const textures = {
		diff: createTexture(texturesUrl.diff),
		norGl: createTexture(texturesUrl.nor),
		alpha: createTexture(texturesUrl.alpha),
		ao: createTexture(texturesUrl.ao),
		rough: createTexture(texturesUrl.rough),
	};

	onMount(() => {
		if (canvasWrapEl) {
			var stats = new Stats();
			canvasWrapEl.appendChild(stats.dom);
			stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
			stats.dom.style.transform = "scale(2.5)";
			stats.dom.style.transformOrigin = "top left";

			const { scene, camera, renderer } = createdTree(canvasWrapEl, 80);

			// const pmremGenerator = new THREE.PMREMGenerator(renderer);
			// const environment = new RoomEnvironment();
			// const envMap = pmremGenerator.fromScene(environment).texture;
			// environment.dispose();
			// scene.environment = envMap;

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
					// position: new THREE.Vector3(1130, 300, 1130),
					// position: new THREE.Vector3(0, 30, 980),
					// target: new THREE.Vector3(0, -260, 260),
					// target: new THREE.Vector3(0, 0, 0),
				});

				devHelper = new DevHelpers(scene);
				devHelper.axes();
				// const devGround = devHelper.ground();
				// devGround.material.color.setHex(0x808a58);
				// devGround.material.map = null;
				// devGround.receiveShadow = true;
			}

			// grass
			// const grassMaterial = new THREE.MeshStandardMaterial({
			// 	color: 0xffffff,
			// 	emissive: 0xffffff,
			// 	emissiveMap: textures.diff,
			// 	emissiveIntensity: 0.2,
			// 	metalness: 0.8,
			// 	roughness: 0.4,
			// 	side: THREE.DoubleSide,
			// 	map: textures.diff,
			// 	metalnessMap: textures.rough,
			// 	aoMap: textures.ao,
			// 	aoMapIntensity: 1,
			// 	alphaMap: textures.alpha,
			// 	alphaTest: 0.8,
			// 	transparent: true,
			// });

			type CustomUniforms = {
				[uniform: string]: THREE.IUniform<any>;
			};
			let customUniforms: CustomUniforms | null = null;
			const grassMaterial = new THREE.MeshStandardMaterial({
				color: 0x2caf22,
				side: THREE.DoubleSide,
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

			const group = new GrassGroup({
				groupPosition: new THREE.Vector3(0, 0, 0),
				groupSize: new THREE.Vector2(2000, 2000),
				groupGrid: new THREE.Vector2(3, 3),
				chunkBladeGrassCount: 200,
				chunkLod: [
					{
						distance: 0,
						geometry: new THREE.TorusKnotGeometry(10, 3, 120, 20),
						material: new THREE.MeshStandardMaterial({
							color: 0x3cffe2,
							side,
							wireframe,
						}),
						// material: grassMaterial,
					},
					{
						distance: 80,
						geometry: new THREE.TorusKnotGeometry(10, 3, 60, 12),
						material: new THREE.MeshStandardMaterial({
							color: 0x8398fe,
							side,
							wireframe,
						}),
						// material: grassMaterial,
					},
					{
						distance: 180,
						geometry: new THREE.TorusKnotGeometry(10, 3, 20, 6),
						material: new THREE.MeshStandardMaterial({
							color: 0xff649a,
							side,
							wireframe,
						}),
						// material: grassMaterial,
					},
					{
						distance: 310,
						geometry: new THREE.TorusKnotGeometry(10, 3, 10, 4),
						material: new THREE.MeshStandardMaterial({
							color: 0xffb1b1,
							side,
							wireframe,
						}),
						// material: grassMaterial,
					},
				],
			});
			// const group = new GrassGroup({
			// 	groupPosition: new THREE.Vector3(0, 0, 0),
			// 	groupSize: new THREE.Vector2(200, 200),
			// 	groupGrid: new THREE.Vector2(3, 3),
			// 	chunkBladeGrassCount: 140,
			// 	chunkLod: [
			// 		{
			// 			distance: 0,
			// 			geometry: new THREE.PlaneGeometry(1, 5, 1, 4),
			// 			material: new THREE.MeshBasicMaterial({
			// 				color: 0x3cffe2,
			// 				side,
			// 				wireframe,
			// 			}),
			// 		},
			// 		{
			// 			distance: 25,
			// 			geometry: new THREE.PlaneGeometry(1, 5, 1, 2),
			// 			material: new THREE.MeshBasicMaterial({
			// 				color: 0x8398fe,
			// 				side,
			// 				wireframe,
			// 			}),
			// 		},
			// 		{
			// 			distance: 50,
			// 			geometry: new THREE.PlaneGeometry(1, 5, 1, 1),
			// 			material: new THREE.MeshBasicMaterial({
			// 				color: 0xff649a,
			// 				side,
			// 				wireframe,
			// 			}),
			// 		},
			// 	],
			// });

			// const group = new GrassGroup({
			// 	groupPosition: new THREE.Vector3(0, 0, 0),
			// 	groupSize: new THREE.Vector2(2000, 2000),
			// 	groupGrid: new THREE.Vector2(10, 10),
			// 	chunkBladeGrassCount: 140,
			// 	chunkLod: [
			// 		{
			// 			distance: 0,
			// 			geometry: new THREE.PlaneGeometry(1, 5, 1, 3),
			// 			material: grassMaterial,
			// 		},
			// 		// {
			// 		// 	distance: 10,
			// 		// 	geometry: new THREE.PlaneGeometry(1, 5, 1, 1),
			// 		// 	material: grassMaterial,
			// 		// },
			// 		// {
			// 		// 	distance: 100,
			// 		// 	geometry: new THREE.PlaneGeometry(1, 5, 1, 1),
			// 		// 	material: grassMaterial,
			// 		// },
			// 		// {
			// 		// 	distance: 150,
			// 		// 	geometry: new THREE.PlaneGeometry(1, 5, 1, 1),
			// 		// 	material: new THREE.MeshStandardMaterial({
			// 		// 		color: 0x2caf22,
			// 		// 		side: THREE.DoubleSide,
			// 		// 	}),
			// 		// },
			// 	],
			// });

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
							Math.sin(timer.getElapsed() * 0.01),
							0,
							Math.cos(timer.getElapsed() * 0.1),
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
