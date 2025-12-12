import * as THREE from "three";
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";

export class GeometryMerger {
	private _geometries: THREE.BufferGeometry[] = [];

	public addGeometry(geometry: THREE.BufferGeometry, matrix: THREE.Matrix4): void {
		const cloned = geometry.clone();
		cloned.applyMatrix4(matrix);
		this._geometries.push(cloned);
	}

	public merge(useGroups: boolean = false): THREE.BufferGeometry {
		if (this._geometries.length < 2) {
			throw new Error("Для объединения необходимо как минимум две геометрии");
		}
		const merged = BufferGeometryUtils.mergeGeometries(this._geometries, useGroups);
		return BufferGeometryUtils.mergeVertices(merged);
	}
}
