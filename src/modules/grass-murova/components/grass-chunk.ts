import * as THREE from "three";

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

	private readonly _positionHelper = new THREE.Object3D();
	private readonly _bladeGrassCount: number;
	private _lodInstancedMeshes: THREE.InstancedMesh[];

	private _instanceMatrixArray: Float32Array<ArrayBuffer>;
	private _instancePositionArray: Float32Array<ArrayBuffer>;
	private _instancedLODArray: Int8Array<ArrayBuffer>;
	private _LODDistance: number[];

	constructor(prams: GrassChunkParams) {
		this._chunkPosition = prams.chunkPosition;
		this._chunkSize = prams.chunkSize;
		this._bladeGrassCount = prams.bladeGrassCount ?? 1000;
		const { matrixArray, positionArray } = this._createInstancedArray();
		this._instanceMatrixArray = matrixArray;
		this._instancePositionArray = positionArray;
		this._instancedLODArray = new Int8Array(this._bladeGrassCount);
		this._LODDistance = prams.lod.map((item) => item.distance);
		this._lodInstancedMeshes = this._createdInstancedMeshes(prams.lod);
	}

	private _createInstancedArray() {
		const size = this._chunkSize.clone();

		const flatMatrixSize = 16;
		const floatVector3Length = 3;

		const matrixArray = new Float32Array(this._bladeGrassCount * flatMatrixSize);
		const positionArray = new Float32Array(this._bladeGrassCount * floatVector3Length);

		for (let index = 0; index < this._bladeGrassCount; index++) {
			this._positionHelper.position.set(
				THREE.MathUtils.randFloat(-size.x, size.x),
				0,
				THREE.MathUtils.randFloat(-size.y, size.y)
			);

			this._positionHelper.rotation.y = THREE.MathUtils.randFloat(0, Math.PI * 2);
			// this._positionHelper.scale.set(1, 1, 1);

			this._positionHelper.updateMatrix();

			matrixArray.set(this._positionHelper.matrix.elements, index * flatMatrixSize);
			positionArray.set(this._positionHelper.position.toArray(), index * floatVector3Length);
		}

		return { matrixArray, positionArray };
	}

	private _createdInstancedMeshes(lod: GrassChunkParams["lod"]) {
		return lod.map((Item) => {
			const instancedGrass = new THREE.InstancedMesh(Item.geometry, Item.material, this._bladeGrassCount);
			instancedGrass.instanceMatrix.array = this._instanceMatrixArray.slice();
			// instancedGrass.instanceMatrix.needsUpdate = true;
			instancedGrass.position.copy(this._chunkPosition);

			return instancedGrass;
		});
	}

	public updateLOD(cameraPosition: THREE.Vector3) {
		performance.mark("lodUpdate");
		const instanceLODArray = new Int8Array(this._bladeGrassCount);
		for (let index = 0; index < this._bladeGrassCount; index++) {
			const indexPositionArray = index * 3;

			this._positionHelper.position.x = this._instancePositionArray[indexPositionArray] as number;
			this._positionHelper.position.y = this._instancePositionArray[indexPositionArray + 1] as number;
			this._positionHelper.position.z = this._instancePositionArray[indexPositionArray + 2] as number;

			const distance = this._positionHelper.position.distanceTo(cameraPosition);
			this._LODDistance.forEach((value, indexLOD) => {
				if (distance > value) instanceLODArray[index] = indexLOD;
			});
		}

		for (let index = 0; index < this._instancedLODArray.length; index++) {
			const addLodLevel = instanceLODArray[index] as number;
			const removeLodLevel = this._instancedLODArray[index] as number;

			if (removeLodLevel != addLodLevel) {
				const matrix = new THREE.Matrix4();
				matrix.elements[13] = 10000;
				this._lodInstancedMeshes[removeLodLevel]?.setMatrixAt(index, matrix);

				matrix.fromArray(this._instanceMatrixArray.subarray(index * 16, index * 16 + 16));
				this._lodInstancedMeshes[addLodLevel]?.setMatrixAt(index, matrix);
				this._instancedLODArray[index] = addLodLevel;
			}
		}

		this._lodInstancedMeshes.forEach((mesh) => {
			mesh.instanceMatrix.needsUpdate = true;
		});

		performance.mark("lodUpdateEnd");
		performance.measure("Update LOD", "lodUpdate", "lodUpdateEnd");
	}

	get lodInstancedMeshes() {
		return this._lodInstancedMeshes;
	}
}
