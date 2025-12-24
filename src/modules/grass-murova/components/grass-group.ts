import { GrassChunk, type GrassChunkParams } from "@/modules/grass-murova/components/grass-chunk";
import { getYSimplex } from "@/modules/grass-murova/components/utility";
import { FLAT_MATRIX_4_LENGTH, FLAT_VECTOR_3_LENGTH } from "@/utility/three/constants";
import * as THREE from "three";
import type { SimplexNoise } from "three/examples/jsm/Addons.js";

interface GrassGroupParams {
	groupPosition?: THREE.Vector3;
	groupSize: THREE.Vector2;
	groupGrid: THREE.Vector2;

	chunkBladeGrassCount: GrassChunkParams["bladeGrassCount"];
	chunkLod: GrassChunkParams["lod"];

	simplex: SimplexNoise;
}

const HELPER_COLOR = {
	ACTIVE: 0x96ffa3,
	INACTIVE: 0xc84369,
} as const;

export class GrassGroup {
	private _group = new THREE.Group();
	private _chunkList: GrassChunk[];

	private _cameraSphere: THREE.Sphere;
	private _box3Helpers: THREE.Box3Helper[] = [];

	constructor(params: GrassGroupParams) {
		this._group.position.copy(params.groupPosition ?? new THREE.Vector3());
		this._chunkList = this._createChunkList(params);
		this._cameraSphere = new THREE.Sphere(undefined, params.chunkLod[params.chunkLod.length - 1]!.distance);
	}

	// instanced
	private _createChunkList(params: GrassGroupParams) {
		const chunkSize = params.groupSize.clone().divide(params.groupGrid.clone());
		const chunkBladeGrassCount = params.chunkBladeGrassCount ?? 100;
		const { matrixArray, positionArray } = this._createInstancedArray(chunkSize, chunkBladeGrassCount);
		const chunkList: GrassChunk[] = [];

		for (let y = 0; y < params.groupGrid.y; y++) {
			for (let x = 0; x < params.groupGrid.x; x++) {
				const positionArrayClone = positionArray.slice();
				const matrixArrayClone = matrixArray.slice();
				const chunkPosition = new THREE.Vector3(
					chunkSize.x / 2 + chunkSize.x * x - params.groupSize.x / 2,
					0,
					chunkSize.y / 2 + chunkSize.y * y - params.groupSize.y / 2
				);

				// FIXME:
				for (let index = 0; index < chunkBladeGrassCount; index++) {
					positionArrayClone[index * FLAT_VECTOR_3_LENGTH + 1] = getYSimplex(
						params.simplex,
						positionArrayClone[index * FLAT_VECTOR_3_LENGTH]! + chunkPosition.x,
						positionArrayClone[index * FLAT_VECTOR_3_LENGTH + 2]! + chunkPosition.z
					);

					matrixArrayClone[index * FLAT_MATRIX_4_LENGTH + 13] =
						positionArrayClone[index * FLAT_VECTOR_3_LENGTH + 1]!;
				}

				const chunk = new GrassChunk({
					groupPosition: params.groupPosition,
					chunkPosition,
					lod: params.chunkLod,
					positionArray: positionArrayClone,
					matrixArray: matrixArrayClone,
				});

				chunkList.push(chunk);

				this._group.add(...chunk.lodInstancedMeshes);
			}
		}

		return chunkList;
	}

	private _createInstancedArray(
		chunkSize: THREE.Vector2,
		bladeGrassCount: number,
		objectHelper: THREE.Object3D = new THREE.Object3D()
	) {
		const size = chunkSize.clone().divideScalar(2);
		const matrixArray = new Float32Array(bladeGrassCount * FLAT_MATRIX_4_LENGTH);
		const positionArray = new Float32Array(bladeGrassCount * FLAT_VECTOR_3_LENGTH);

		for (let index = 0; index < bladeGrassCount; index++) {
			objectHelper.position.set(
				// index * 40 - 200,
				THREE.MathUtils.randFloat(-size.x, size.x),
				0,
				// 2.5,
				THREE.MathUtils.randFloat(-size.y, size.y)
				// 0
			);

			objectHelper.rotation.y = THREE.MathUtils.randFloat(0, Math.PI * 2);
			// this._positionHelper.scale.set(1, 1, 1);

			objectHelper.updateMatrix();

			matrixArray.set(objectHelper.matrix.elements, index * FLAT_MATRIX_4_LENGTH);
			positionArray.set(objectHelper.position.toArray(), index * FLAT_VECTOR_3_LENGTH);
		}

		return { matrixArray, positionArray };
	}

	// update
	public updateLOD(cameraPosition: THREE.Vector3) {
		this._cameraSphere.center.copy(cameraPosition);

		this._chunkList.forEach((chunk, index) => {
			const isActiveChunk = chunk.chunkBox.intersectsSphere(this._cameraSphere);
			chunk.updateLOD(cameraPosition, isActiveChunk);

			if (this._box3Helpers[index]) {
				// @ts-ignore: Property 'color' does not exist on type 'Material | Material[]'.
				this._box3Helpers[index].material.color = new THREE.Color(
					isActiveChunk ? HELPER_COLOR.ACTIVE : HELPER_COLOR.INACTIVE
				);
			}
		});
	}

	public get group() {
		return this._group;
	}

	public get chunkList() {
		return this._chunkList;
	}

	public get box3Helpers() {
		if (!this._box3Helpers.length) {
			this._chunkList.forEach((chunk) => {
				const helper = new THREE.Box3Helper(chunk.chunkBox, HELPER_COLOR.INACTIVE);
				this._box3Helpers.push(helper);
			});
		}

		return this._box3Helpers;
	}
}
