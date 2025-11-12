<script lang="ts">
	import * as THREE from "three";
	import { createdTree } from "@/utility/three/createdThree";
	import { onMount } from "svelte";
	import { Timer } from "three";
	import { DevOrbitControls } from "@/utility/three/devOrbitControls";
	import { DevHelpers } from "@/utility/three/devHelper";
	import { HDRLoader, RoomEnvironment } from "three/examples/jsm/Addons.js";

	import vertexShader from "./shaders/grass-vertex.glsl";
	import fragmentShader from "./shaders/grass-fragment.glsl";
	import GrassChunk from "@/modules/grass-murova/components/grass-chunk";

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
				scene.background = envMap;
				scene.environment = envMap;
				texture.dispose();
				pmremGenerator.dispose();
			});
			renderer.toneMapping = THREE.ACESFilmicToneMapping;
			renderer.toneMappingExposure = 1; // Настройте экспозицию по необходимости

			scene.background = new THREE.Color(0x90c6d8);
			camera.position.z = 5;

			// renderer.shadowMap.enabled = true;

			// _rv_isDev
			let devOrbitControls: DevOrbitControls | null = null;
			let devHelper: DevHelpers | null = null;
			if (window._rv_isDev) {
				devOrbitControls = new DevOrbitControls(camera, renderer.domElement);

				devHelper = new DevHelpers(scene);
				devHelper.axes();
				// const devGround = devHelper.ground();
				// devGround.material.color.setHex(0x808a58);
				// devGround.material.map = null;
				// devGround.receiveShadow = true;
			}

			// grass
			const grassMaterial = new THREE.MeshStandardMaterial({
				color: 0xffffff,
				emissive: 0xffffff,
				emissiveMap: textures.diff,
				emissiveIntensity: 0.2,
				metalness: 0.8,
				roughness: 0.4,
				side: THREE.DoubleSide,
				map: textures.diff,
				metalnessMap: textures.rough,
				aoMap: textures.ao,
				aoMapIntensity: 1,
				alphaMap: textures.alpha,
				alphaTest: 0.8,
				transparent: true,
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

			const bladeGrassCount = 360;
			const grassGeometry = new THREE.PlaneGeometry(2.1, 3, 1, 3);
			const instancedGrass = new THREE.InstancedMesh(grassGeometry, grassMaterial, bladeGrassCount);

			const color = new THREE.Color();

			const randoms = new Float32Array(bladeGrassCount);
			const positionHelper = new THREE.Object3D();
			const squareSize = 50;
			for (let index = 0; index < bladeGrassCount; index++) {
				randoms[index] = THREE.MathUtils.randFloat(0.0, 1.2);
				const scaleHeight = THREE.MathUtils.randFloat(0.4, 1.2);

				positionHelper.position.set(
					THREE.MathUtils.randFloat(-squareSize, squareSize),
					(grassGeometry.parameters.height / 2) * scaleHeight,
					THREE.MathUtils.randFloat(-squareSize, squareSize),
				);
				positionHelper.rotation.y = THREE.MathUtils.randFloat(0, Math.PI * 2);
				positionHelper.scale.set(1, scaleHeight, 1);

				positionHelper.updateMatrix();
				instancedGrass.setMatrixAt(index, positionHelper.matrix);

				// color.setHSL(
				// 	(360 / 100000) * THREE.MathUtils.randInt(64, 94),
				// 	THREE.MathUtils.randFloat(0.6, 0.9),
				// 	THREE.MathUtils.randFloat(0.3, 0.5),
				// );
				// color.setHSL(0, 0, THREE.MathUtils.randFloat(0.1, 1));
				// instancedGrass.setColorAt(index, color);
			}

			grassGeometry.setAttribute("random", new THREE.InstancedBufferAttribute(randoms, 1));
			instancedGrass.instanceMatrix.needsUpdate = true;
			// scene.add(instancedGrass);

			positionHelper.position.set(0, 0, 0);
			positionHelper.rotation.set(0, 0, 0);
			positionHelper.scale.set(1, 1, 1);
			instancedGrass.getMatrixAt(10, positionHelper.matrix);
			positionHelper.matrix.decompose(positionHelper.position, positionHelper.quaternion, positionHelper.scale);
			// console.log(positionHelper);

			instancedGrass.position.x = 10;

			// light
			const aLight = new THREE.AmbientLight(0xffffff, 0.3);
			scene.add(aLight);

			// const dLight = new THREE.DirectionalLight(0xffffff, 1.3);
			// dLight.position.set(10, 10, 15);
			// dLight.castShadow = true;
			// dLight.shadow.mapSize.set(1024, 1024);
			// scene.add(dLight);
			// const dLightH = new THREE.DirectionalLightHelper(dLight, 5);
			// scene.add(dLightH);

			// GrassChunk
			const chunk = new GrassChunk({
				chunkPosition: new THREE.Vector3(0, 0, 0),
				chunkSize: new THREE.Vector2(50, 50),
				bladeGrassCount: 1000,
				lod: [
					{
						distance: 10,
						geometry: new THREE.PlaneGeometry(2, 3, 1, 3),
						material: new THREE.MeshBasicMaterial({ color: 0x0091ff, side: THREE.DoubleSide }),
					},
					{
						distance: 30,
						geometry: new THREE.SphereGeometry(2, 5, 5),
						material: new THREE.MeshBasicMaterial({ color: 0xffee00, side: THREE.DoubleSide }),
					},
					{
						distance: 50,
						geometry: new THREE.BoxGeometry(2, 2, 2),
						material: new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide }),
					},
				],
			});

			scene.add(...chunk.lodInstancedMeshes);

			if (devOrbitControls) devOrbitControls.addEventListener("change", () => chunk.updateLOD(camera.position));

			// setAnimationLoop
			const timer = new Timer();
			function animate(timestamp: number) {
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
							Math.cos(timer.getElapsed() * 0.01),
						)
						.normalize();
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
