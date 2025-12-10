import * as THREE from "three";
import { OrbitControls } from "three/addons";

const _ITEM_NAME = {
	POSITION: "_camera_position",
	TARGET: "_controls_target",
} as const;

type Static = {
	position?: THREE.Vector3;
	target?: THREE.Vector3;
};

/**
 * Расширяет OrbitControls для сохранения позиции камеры и цели в sessionStorage.
 *
 * @extends OrbitControls
 *
 * @example
 * const controls = new DevOrbitControls(camera, renderer.domElement);
 *
 * const timer = new Timer();
 * function animate(timestamp: number) {
 * 	timer.update(timestamp);
 * 	devControls.update(timer.getDelta());
 * 	renderer.render(scene, camera);
 * }
 *
 * renderer.setAnimationLoop(animate);
 */
export class DevOrbitControls extends OrbitControls {
	/**
	 * Позиция камеры из sessionStorage.
	 * @private
	 * @type {string | null}
	 */
	private _sessionPosition = sessionStorage.getItem(_ITEM_NAME.POSITION);

	/**
	 * Цель камеры из sessionStorage.
	 * @private
	 * @type {string | null}
	 */
	private _sessionTarget = sessionStorage.getItem(_ITEM_NAME.TARGET);

	/**
	 * @param {THREE.Camera} camera - Камера.
	 * @param {HTMLElement} rendererDomElement - Дом элемент рендера.
	 */
	constructor(camera: THREE.Camera, rendererDomElement: HTMLElement, statics?: Static) {
		super(camera, rendererDomElement);

		if (this._sessionPosition) {
			const pos = statics?.position ?? (JSON.parse(this._sessionPosition) as THREE.Vector3);
			camera.position.set(pos.x, pos.y, pos.z);
		}

		if (this._sessionTarget) {
			const tar = statics?.target ?? (JSON.parse(this._sessionTarget) as THREE.Vector3);
			this.target.set(tar.x, tar.y, tar.z);
		}

		this.addEventListener("change", () => {
			sessionStorage.setItem(_ITEM_NAME.POSITION, JSON.stringify(camera.position));
			sessionStorage.setItem(_ITEM_NAME.TARGET, JSON.stringify(this.target));
		});
	}
}
