import * as THREE from "three";

const FLAT_MATRIX_4_SIZE = 16;
const FLAT_VECTOR_3_LENGTH = 3;

interface GrassChunkParams {
	chunkPosition: THREE.Vector3;
	chunkSize: THREE.Vector2;

	bladeGrassCount?: number;
	lod: {
		geometry: THREE.InstancedMesh["geometry"];
		material: THREE.InstancedMesh["material"];
		distance: number;
	}[];
}

export default class GrassChunk {
	private readonly _chunkPosition: GrassChunkParams["chunkPosition"];
	private readonly _chunkSize: GrassChunkParams["chunkSize"];

	private readonly _objectHelper = new THREE.Object3D();
	private readonly _matrixHelper = new THREE.Matrix4();
	private readonly _bladeGrassCount: number;
	private _lodInstancedMeshes: THREE.InstancedMesh[];

	private _instanceMatrix: Float32Array<ArrayBuffer>;
	private _instancePosition: Float32Array<ArrayBuffer>;
	private _oldActiveLodLevel: Uint8Array<ArrayBuffer>;
	private _newActiveLodLevel: Uint8Array<ArrayBuffer>;
	private _lodDistance: number[];

	private _chunkBox: THREE.Box3 = new THREE.Box3();

	constructor(prams: GrassChunkParams) {
		this._chunkPosition = prams.chunkPosition;
		this._chunkSize = prams.chunkSize;
		this._bladeGrassCount = prams.bladeGrassCount ?? 1000;
		const { matrixArray, positionArray } = this._createInstancedArray();
		this._instanceMatrix = matrixArray;
		this._instancePosition = positionArray;
		this._oldActiveLodLevel = new Uint8Array(this._bladeGrassCount);
		this._newActiveLodLevel = new Uint8Array(this._bladeGrassCount);
		this._lodDistance = prams.lod.map((item) => item.distance);
		this._lodInstancedMeshes = this._createdInstancedMeshes(prams.lod);
	}

	// chunkBox
	public get chunkBox() {
		if (this._chunkBox.isEmpty()) {
			this._chunkBox.setFromBufferAttribute(new THREE.BufferAttribute(this._instancePosition, 3));
		}

		return this._chunkBox;
	}

	// instanced
	private _createInstancedArray() {
		const size = this._chunkSize.clone();
		const matrixArray = new Float32Array(this._bladeGrassCount * FLAT_MATRIX_4_SIZE);
		const positionArray = new Float32Array(this._bladeGrassCount * FLAT_VECTOR_3_LENGTH);

		for (let index = 0; index < this._bladeGrassCount; index++) {
			this._objectHelper.position.set(
				THREE.MathUtils.randFloat(-size.x, size.x),
				THREE.MathUtils.randFloat(2.5, 5),
				// 2.5,
				THREE.MathUtils.randFloat(-size.y, size.y)
			);

			this._objectHelper.rotation.y = THREE.MathUtils.randFloat(0, Math.PI * 2);
			// this._positionHelper.scale.set(1, 1, 1);

			this._objectHelper.updateMatrix();

			matrixArray.set(this._objectHelper.matrix.elements, index * FLAT_MATRIX_4_SIZE);
			positionArray.set(this._objectHelper.position.toArray(), index * FLAT_VECTOR_3_LENGTH);
		}

		return { matrixArray, positionArray };
	}

	private _createdInstancedMeshes(lod: GrassChunkParams["lod"]) {
		return lod.map((Item) => {
			const instancedGrass = new THREE.InstancedMesh(Item.geometry, Item.material, this._bladeGrassCount);
			instancedGrass.instanceMatrix.array = this._instanceMatrix.slice();
			instancedGrass.position.copy(this._chunkPosition);
			instancedGrass.frustumCulled = false;

			return instancedGrass;
		});
	}

	get lodInstancedMeshes() {
		return this._lodInstancedMeshes;
	}

	// update
	public updateLOD(cameraPosition: THREE.Vector3) {
		for (let index = 0; index < this._bladeGrassCount; index++) {
			const indexPositionArray = index * 3;

			this._objectHelper.position.x = this._instancePosition[indexPositionArray] as number;
			this._objectHelper.position.y = this._instancePosition[indexPositionArray + 1] as number;
			this._objectHelper.position.z = this._instancePosition[indexPositionArray + 2] as number;

			const distance = this._objectHelper.position.distanceTo(cameraPosition);
			this._lodDistance.forEach((value, indexLOD) => {
				if (distance > value) this._newActiveLodLevel[index] = indexLOD;
			});
		}

		for (let index = 0; index < this._oldActiveLodLevel.length; index++) {
			const addLodLevel = this._newActiveLodLevel[index] as number;
			const removeLodLevel = this._oldActiveLodLevel[index] as number;

			if (removeLodLevel != addLodLevel) {
				this._matrixHelper.elements[13] = 10000;
				this._lodInstancedMeshes[removeLodLevel]?.setMatrixAt(index, this._matrixHelper);

				this._matrixHelper.fromArray(
					this._instanceMatrix.subarray(
						index * FLAT_MATRIX_4_SIZE,
						index * FLAT_MATRIX_4_SIZE + FLAT_MATRIX_4_SIZE
					)
				);
				this._lodInstancedMeshes[addLodLevel]?.setMatrixAt(index, this._matrixHelper);
				this._oldActiveLodLevel[index] = addLodLevel;
			}
		}

		this._lodInstancedMeshes.forEach((mesh) => {
			mesh.instanceMatrix.needsUpdate = true;
		});
	}

	public firstUpdateLOD() {
		this._matrixHelper.elements[13] = 10000;

		this._lodInstancedMeshes.forEach((mesh, indexMesh) => {
			for (let index = 0; index < this._newActiveLodLevel.length; index++) {
				const removeLodLevel = this._oldActiveLodLevel[index] as number;
				if (indexMesh != removeLodLevel) {
					mesh.setMatrixAt(index, this._matrixHelper);
				}
			}

			mesh.instanceMatrix.needsUpdate = true;
		});
	}
}
