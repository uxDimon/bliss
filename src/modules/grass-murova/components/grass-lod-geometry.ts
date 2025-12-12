import { GeometryMerger } from "@/utility/three/geometryMerger";
import * as THREE from "three";

interface GrassLodGeometryParams {
	size: THREE.Vector2;
	bladeGrassCount: number;
}

export class GrassLodGeometry {
	private _matrixes: THREE.Matrix4[];

	constructor(params: GrassLodGeometryParams) {
		this._matrixes = this._createMatrixes(params);
	}

	private _createMatrixes(params: GrassLodGeometryParams) {
		const size = params.size.clone().divideScalar(2);

		return Array.from({ length: params.bladeGrassCount }, () => {
			const scaleY = THREE.MathUtils.randFloat(1, 2.2);
			return new THREE.Matrix4().compose(
				new THREE.Vector3(
					THREE.MathUtils.randFloat(-size.x, size.y),
					(2.5 * scaleY) / 2,
					THREE.MathUtils.randFloat(-size.x, size.y)
				),
				new THREE.Quaternion().setFromEuler(
					new THREE.Euler(
						THREE.MathUtils.randFloat(0, Math.PI / 8),
						THREE.MathUtils.randFloat(0, Math.PI * 2),
						THREE.MathUtils.randFloat(0, Math.PI / 8)
					)
				),
				new THREE.Vector3(1, scaleY, 1)
			);
		});
	}

	public getGeometry(geometry: THREE.BufferGeometry, step: number = 1) {
		const geometryMerger = new GeometryMerger();

		for (let index = 0; index < this._matrixes.length; index += step) {
			geometryMerger.addGeometry(geometry, this._matrixes[index]!);
		}

		return geometryMerger.merge();
	}
}
