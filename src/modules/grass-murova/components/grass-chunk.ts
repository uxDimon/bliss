import { FLAT_MATRIX_4_LENGTH, FLAT_VECTOR_3_LENGTH } from "@/utility/three/constants";
import * as THREE from "three";

const POSITION_IN_SPACE = 10000;

export interface GrassChunkParams {
	groupPosition?: THREE.Vector3;
	chunkPosition: THREE.Vector3;

	bladeGrassCount?: number;
	positionArray: Float32Array<ArrayBuffer>;
	matrixArray: Float32Array<ArrayBuffer>;
	lod: {
		geometry: THREE.InstancedMesh["geometry"];
		material: THREE.InstancedMesh["material"];
		distance: number;
	}[];
}

export class GrassChunk {
	private readonly _chunkPosition: THREE.Vector3;
	private readonly _groupPosition: THREE.Vector3;

	private readonly _objectHelper = new THREE.Object3D();
	private readonly _matrixHelper = new THREE.Matrix4();
	private readonly _bladeGrassCount: number;
	private _lodInstancedMeshes: THREE.InstancedMesh[];

	private _instanceMatrix: Float32Array<ArrayBuffer>;
	private _instanceWorldPosition: Float32Array<ArrayBuffer>;
	private _oldActiveLodLevel: Uint8Array<ArrayBuffer>;
	private _newActiveLodLevel: Uint8Array<ArrayBuffer>;
	private _lodDistance: number[];

	private _chunkBox: THREE.Box3 = new THREE.Box3();

	private _isActiveChunk: boolean = true;

	constructor(prams: GrassChunkParams) {
		this._chunkPosition = prams.chunkPosition;
		this._groupPosition = prams.groupPosition ?? new THREE.Vector3();
		this._instanceMatrix = prams.matrixArray;
		this._instanceWorldPosition = prams.positionArray;
		this._bladeGrassCount = prams.matrixArray.length / FLAT_MATRIX_4_LENGTH;
		this._oldActiveLodLevel = new Uint8Array(this._bladeGrassCount);
		this._newActiveLodLevel = new Uint8Array(this._bladeGrassCount);
		this._lodDistance = prams.lod.map((item) => item.distance);
		this._lodInstancedMeshes = this._createdInstancedMeshes(prams.lod);
		this._updateWorldPosition();
	}

	// chunkBox
	public get chunkBox() {
		if (this._chunkBox.isEmpty()) {
			this._chunkBox.setFromBufferAttribute(new THREE.BufferAttribute(this._instanceWorldPosition, 3));
		}

		return this._chunkBox;
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
	public updateLOD(cameraPosition: THREE.Vector3, isActiveChunk: boolean = true) {
		if (isActiveChunk) {
			for (let index = 0; index < this._bladeGrassCount; index++) {
				const indexPositionArray = index * 3;

				this._objectHelper.position.x = this._instanceWorldPosition[indexPositionArray] as number;
				this._objectHelper.position.y = this._instanceWorldPosition[indexPositionArray + 1] as number;
				this._objectHelper.position.z = this._instanceWorldPosition[indexPositionArray + 2] as number;

				const distance = this._objectHelper.position.distanceTo(cameraPosition);
				this._lodDistance.forEach((value, indexLOD) => {
					if (distance > value) this._newActiveLodLevel[index] = indexLOD;
				});
			}

			this._updatingChangedPositions();
		} else if ((!isActiveChunk && this._isActiveChunk) || (!isActiveChunk && this._isActiveChunk)) {
			for (let index = 0; index < this._oldActiveLodLevel.length; index++) {
				this._newActiveLodLevel[index] = this._lodInstancedMeshes.length - 1;
			}

			this._updatingChangedPositions();
		}

		this._isActiveChunk = isActiveChunk;
	}

	private _updatingChangedPositions() {
		for (let index = 0; index < this._oldActiveLodLevel.length; index++) {
			const addLodLevel = this._newActiveLodLevel[index] as number;
			const removeLodLevel = this._oldActiveLodLevel[index] as number;

			if (removeLodLevel != addLodLevel) {
				this._matrixHelper.elements[13] = POSITION_IN_SPACE;
				this._lodInstancedMeshes[removeLodLevel]?.setMatrixAt(index, this._matrixHelper);

				this._matrixHelper.fromArray(
					this._instanceMatrix.subarray(
						index * FLAT_MATRIX_4_LENGTH,
						index * FLAT_MATRIX_4_LENGTH + FLAT_MATRIX_4_LENGTH
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
		this._matrixHelper.elements[13] = POSITION_IN_SPACE;

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

	// position
	private _updateWorldPosition() {
		for (let index = 0; index < this._bladeGrassCount; index++) {
			const indexPositionArray = index * FLAT_VECTOR_3_LENGTH;
			// const indexMatrixArray = index * FLAT_MATRIX_4_SIZE;

			this._objectHelper.position.x = this._instanceWorldPosition[indexPositionArray] as number;
			this._objectHelper.position.y = this._instanceWorldPosition[indexPositionArray + 1] as number;
			this._objectHelper.position.z = this._instanceWorldPosition[indexPositionArray + 2] as number;
			this._objectHelper.position.add(this._chunkPosition.clone()).add(this._groupPosition.clone());
			// this._objectHelper.updateMatrix();

			this._instanceWorldPosition.set(this._objectHelper.position.toArray(), indexPositionArray);
			// this._instanceWorldMatrix.set(this._objectHelper.matrix.elements, indexMatrixArray);
		}
	}
}
