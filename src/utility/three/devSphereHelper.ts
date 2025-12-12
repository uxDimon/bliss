import * as THREE from "three";

/**
 * Класс DevSphereHelper расширяет THREE.Group для создания вспомогательного объекта в виде трех окружностей, имитирующих сферу для отладки.
 * @extends THREE.Group
 */
export class DevSphereHelper extends THREE.Group {
	/**
	 * Количество сегментов для окружностей.
	 * @private
	 * @type {number}
	 */
	private _segments = 32;

	/**
	 * Радиус сферы.
	 * @private
	 * @type {number}
	 */
	private _radius: number;

	/**
	 * Цвет линий.
	 * @private
	 * @type {THREE.Color}
	 */
	private _color: THREE.Color;

	/**
	 * Геометрия для окружностей.
	 * @private
	 * @type {THREE.BufferGeometry}
	 */
	private _geometry = new THREE.BufferGeometry();

	/**
	 * Материал для линий.
	 * @private
	 * @type {THREE.LineBasicMaterial}
	 */
	private _material = new THREE.LineBasicMaterial();

	/**
	 * Конструктор создает три окружности в плоскостях XY, XZ и YZ.
	 * @param {number} [radius=10] - Радиус сферы.
	 * @param {THREE.ColorRepresentation} [color=0xff0000] - Цвет линий.
	 */
	constructor(radius: number = 10, color: THREE.ColorRepresentation = 0xff0000) {
		super();

		this._radius = radius;
		this._color = new THREE.Color(color);

		const vertices = new Array(this._segments * 3);
		for (let i = 0; i <= this._segments; i++) {
			const theta = (i / this._segments) * Math.PI * 2;
			const x = this._radius * Math.cos(theta);
			const y = this._radius * Math.sin(theta);
			vertices[i * 3] = x;
			vertices[i * 3 + 1] = y;
			vertices[i * 3 + 2] = 0;
		}

		this._geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
		this._material.color = this._color;

		const circle = new THREE.LineLoop(this._geometry, this._material);
		this.add(circle.clone());

		circle.rotation.x = Math.PI / 2;
		this.add(circle.clone());

		circle.rotation.y = Math.PI / 2;
		this.add(circle);
	}
}
