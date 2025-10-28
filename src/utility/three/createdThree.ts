import * as THREE from "three";

/**
 * Создает и инициализирует сцену Three.js, камеру и рендерер.
 *
 * @param canvasWrapEl - HTML элемент, в который будет вставлен canvas для рендеринга.
 * @returns Объект, содержащий сцену, камеру и рендерер.
 *
 * @remarks
 * - Если включен режим разработки (`isDev`), добавляются вспомогательные сетка и оси.
 */
export var createdTree = (canvasWrapEl: HTMLDivElement, fov: number = 75, rendererAlpha: boolean = false) => {
	var canvasWidth = canvasWrapEl.clientWidth,
		canvasHeight = canvasWrapEl.clientHeight;

	// scene
	var scene = new THREE.Scene();

	// camera
	var camera = new THREE.PerspectiveCamera(fov, canvasWidth / canvasHeight, 0.1, 500);

	// renderer
	var renderer = new THREE.WebGLRenderer({
		alpha: rendererAlpha,
		antialias: true,
	});
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	canvasWrapEl.appendChild(renderer.domElement);

	window.addEventListener("resize", () => {
		canvasWidth = canvasWrapEl.clientWidth;
		canvasHeight = canvasWrapEl.clientHeight;
		renderer.setSize(canvasWidth, canvasHeight);
		camera.aspect = canvasWidth / canvasHeight;
		camera.updateProjectionMatrix();
	});

	return {
		scene,
		camera,
		renderer,
	};
};
