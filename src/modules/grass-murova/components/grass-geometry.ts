import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";
import * as THREE from "three";

interface GrassGeometryParams {
	points: THREE.Vector3[];
}

export class GrassGeometry {
	private _curve: THREE.CatmullRomCurve3;

	constructor(params: GrassGeometryParams) {
		this._curve = new THREE.CatmullRomCurve3(params.points);
	}

	public logVertexCount(geometry: THREE.BufferGeometry) {
		const positionAttribute = geometry.getAttribute("position");
		const vertexCount = positionAttribute.count;
		console.log(`Всего вершин: ${vertexCount}`);
	}

	public getGeometry(divisions: number) {
		const { leftVector, rightVector } = this._createVectors(divisions);
		return this._createGeometry(leftVector, rightVector, divisions);
	}

	private _createVectors(divisions: number) {
		const leftVector = this._curve.getPoints(divisions);
		const rightVector = leftVector.map((v) => {
			const vClone = v.clone();
			vClone.x *= -1;
			return vClone;
		});

		return {
			leftVector,
			rightVector,
		};
	}

	private _createGeometry(leftVector: THREE.Vector3[], rightVector: THREE.Vector3[], divisions: number) {
		let geometry = new THREE.BufferGeometry();
		const vertices = new Float32Array((divisions + 1) * 2 * 3);
		const uvs = new Float32Array((divisions + 1) * 2 * 2);

		for (let index = 0; index < divisions + 1; index++) {
			const left = leftVector[index]!;
			const right = rightVector[index]!;

			vertices.set([...left.toArray(), ...right.toArray()], index * 6);
			uvs.set([index / divisions, 0, index / divisions, 1], index * 4);
		}

		geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
		geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));

		const indices: number[] = new Array();
		for (let index = 0; index < divisions; index++) {
			const start = index * 2;
			indices.push(start, start + 1, start + 2);

			// Не добовляем индексы для последнего треугольника что бы
			// BufferGeometryUtils.mergeVertices() удалил лишнюю вершину
			if (index < divisions - 1) {
				indices.push(start + 1, start + 3, start + 2);
			}
		}

		geometry.setIndex(indices);
		geometry = BufferGeometryUtils.mergeVertices(geometry);
		geometry.computeVertexNormals();

		return geometry;
	}
}
