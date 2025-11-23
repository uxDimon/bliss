import * as THREE from "three";

/**
 * Вспомогательные инструменты для разработки Three.js.
 */
export class DevHelpers {
	private _scene: THREE.Scene;

	/**
	 * @param scene - Сцена в которую будут добавлены инструменты.
	 */
	constructor(scene: THREE.Scene) {
		this._scene = scene;
	}

	/**
	 * Добавляет сетку и оси в сцену.
	 */
	public axes() {
		const gridColor = new THREE.Color(0x626262);
		const gridHelper = new THREE.GridHelper(200, 20, gridColor, gridColor);
		gridHelper.name = "_dev_GridHelper";
		const axesHelper = new THREE.AxesHelper(10);
		axesHelper.name = "_dev_AxesHelper";
		axesHelper.position.y = 0.01;
		this._scene.add(gridHelper, axesHelper);
	}

	/**
	 * Добавляет плоскость земли с текстурой в сцену.
	 * @returns Меш плоскость.
	 */
	public ground() {
		const groundTexture = new THREE.TextureLoader().load(
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAWSURBVHgBY9i/f/9/BweH/wwgAsQBAFa7CfeGT4F2AAAAAElFTkSuQmCC"
		);
		groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
		groundTexture.repeat.set(10, 10);
		groundTexture.magFilter = THREE.NearestFilter;
		groundTexture.colorSpace = THREE.SRGBColorSpace;

		const groundMaterial = new THREE.MeshPhongMaterial({ map: groundTexture });
		const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), groundMaterial);
		ground.name = "_dev_ground";
		ground.position.y = -0.01;
		ground.rotation.x = -Math.PI / 2;

		this._scene.add(ground);

		return ground;
	}
}
