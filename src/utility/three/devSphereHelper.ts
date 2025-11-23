import * as THREE from "three";

export class DevSphereHelper extends THREE.Group {
	private _segments = 32;
	private _radius: number;
	private _color: THREE.Color;

	private _geometry = new THREE.BufferGeometry();
	private _material = new THREE.LineBasicMaterial();

	constructor(radius: number = 10, color: THREE.ColorRepresentation = 0xff0000) {
		super();

		this._radius = radius;
		this._color = new THREE.Color(color);

		const vertices = [];

		for (let i = 0; i <= this._segments; i++) {
			const theta = (i / this._segments) * Math.PI * 2; // Угол от 0 до 2*PI
			const x = this._radius * Math.cos(theta);
			const y = this._radius * Math.sin(theta);
			vertices.push(x, y, 0); // Добавляем координаты X, Y, Z (лежит на плоскости XY)
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
