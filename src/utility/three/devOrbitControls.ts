import * as THREE from "three";
import { OrbitControls } from "three/addons";

const ITEM_NAME = {
	POSITION: "_camera_position",
	TARGET: "_controls_target",
} as const;

/**
 * Создает экземпляр OrbitControls для камеры.
 * позволяя камере сохранять свою позицию после перезагрузки страницы.
 *
 * @param {THREE.Camera} camera - Камера Three.js для управления.
 * @param {THREE.WebGLRenderer} renderer - WebGL рендерер Three.js.
 * @returns {OrbitControls} Созданный экземпляр OrbitControls.
 *
 * @example
 * const controls = createdDevOrbitControls(camera, renderer);
 *
 * const timer = new Timer();
 * function animate(timestamp: number) {
 * 	timer.update(timestamp);
 * 	devControls.update(timer.getDelta());
 * 	renderer.render(scene, camera);
 * }
 *
 * renderer.setAnimationLoop(animate);
 *
 */
export const createdDevOrbitControls = (camera: THREE.Camera, renderer: THREE.WebGLRenderer): OrbitControls => {
	const sessionPosition = sessionStorage.getItem(ITEM_NAME.POSITION);

	if (sessionPosition) {
		const pos = JSON.parse(sessionPosition) as THREE.Vector3;
		camera.position.set(pos.x, pos.y, pos.z);
	}

	const controls = new OrbitControls(camera, renderer.domElement);
	controls.target = new THREE.Vector3(0);

	const sessionTarget = sessionStorage.getItem(ITEM_NAME.TARGET);
	if (sessionTarget) {
		const tar = JSON.parse(sessionTarget) as THREE.Vector3;
		controls.target = new THREE.Vector3(tar.x, tar.y, tar.z);
	}

	controls.addEventListener("change", () => {
		sessionStorage.setItem(ITEM_NAME.POSITION, JSON.stringify(camera.position));
		sessionStorage.setItem(ITEM_NAME.TARGET, JSON.stringify(controls.target));
	});

	return controls;
};
