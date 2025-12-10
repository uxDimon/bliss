import { FLAT_MATRIX_4_LENGTH, FLAT_VECTOR_3_LENGTH } from "@/utility/three/constants";
import * as THREE from "three";

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

type LodCounts = Record<number, number>;

export class GrassChunk {
	private readonly _chunkPosition: THREE.Vector3;
	private readonly _groupPosition: THREE.Vector3;

	private readonly _objectHelper = new THREE.Object3D();
	private readonly _matrixHelper = new THREE.Matrix4();
	private readonly _bladeGrassCount: number;
	private _lodInstancedMeshes: THREE.InstancedMesh[];

	private _instanceMatrix: Float32Array<ArrayBuffer>;
	private _instanceWorldPosition: Float32Array<ArrayBuffer>;
	private _activeLodLevel: Uint8Array<ArrayBuffer>;
	private _lodCounts: LodCounts;
	private _lodDistance: number[];

	private _chunkBox: THREE.Box3 = new THREE.Box3();

	private _isActiveChunk: boolean = true;

	constructor(prams: GrassChunkParams) {
		this._chunkPosition = prams.chunkPosition;
		this._groupPosition = prams.groupPosition ?? new THREE.Vector3();
		this._instanceMatrix = prams.matrixArray;
		this._instanceWorldPosition = prams.positionArray;
		this._bladeGrassCount = prams.matrixArray.length / FLAT_MATRIX_4_LENGTH;
		this._activeLodLevel = new Uint8Array(this._bladeGrassCount);
		this._lodCounts = prams.lod.reduce<LodCounts>((acc, _item, index) => {
			acc[index] = 0;
			return acc;
		}, {});
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
		return lod.map((item) => {
			const instancedGrass = new THREE.InstancedMesh(item.geometry, item.material, this._bladeGrassCount);
			instancedGrass.instanceMatrix.array = this._instanceMatrix.slice();
			instancedGrass.position.copy(this._chunkPosition);
			instancedGrass.frustumCulled = false;
			instancedGrass.name = `distance: ${item.distance}`;

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
					if (distance > value) this._activeLodLevel[index] = indexLOD;
				});
			}

			this._updatingChangedPositions();
		} else if ((!isActiveChunk && this._isActiveChunk) || (!isActiveChunk && this._isActiveChunk)) {
			for (let index = 0; index < this._activeLodLevel.length; index++) {
				this._activeLodLevel[index] = this._lodInstancedMeshes.length - 1;
			}

			this._updatingChangedPositions();
		}

		this._isActiveChunk = isActiveChunk;
	}

	private _updatingChangedPositions() {
		Object.keys(this._lodCounts).forEach((key) => {
			this._lodCounts[key as unknown as number] = 0;
		});

		this._lodCounts = this._activeLodLevel.reduce((acc, item, index) => {
			this._matrixHelper.fromArray(
				this._instanceMatrix.subarray(
					index * FLAT_MATRIX_4_LENGTH,
					index * FLAT_MATRIX_4_LENGTH + FLAT_MATRIX_4_LENGTH
				)
			);
			this._lodInstancedMeshes[item]?.setMatrixAt(acc[item]!, this._matrixHelper);

			++acc[item]!;
			return acc;
		}, this._lodCounts);

		this._lodInstancedMeshes.forEach((mesh, index) => {
			mesh.count = this._lodCounts[index] as number;
			mesh.instanceMatrix.needsUpdate = true;
		});
	}

	// position
	private _updateWorldPosition() {
		for (let C = 0; C < this._bladeGrassCount; C++) {
			const indexPositionArray = C * FLAT_VECTOR_3_LENGTH;
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
