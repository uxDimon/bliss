import { GrassChunk, type GrassChunkParams } from "@/modules/grass-murova/components/grass-chunk";
import * as THREE from "three";

interface GrassGroupParams {
	groupPosition?: THREE.Vector3;
	groupSize: THREE.Vector2;
	groupGrid: THREE.Vector2;

	chunkBladeGrassCount: GrassChunkParams["bladeGrassCount"];
	chunkLod: GrassChunkParams["lod"];
}

export default class GrassGroup {
	private _group = new THREE.Group();
	private _chunkList: GrassChunk[] = [];

	constructor(params: GrassGroupParams) {
		this._group.position.copy(params.groupPosition ?? new THREE.Vector3());

		const chunkSize = params.groupSize.clone().divide(params.groupGrid.clone());
		for (let y = 0; y < params.groupGrid.y; y++) {
			for (let x = 0; x < params.groupGrid.x; x++) {
				const chunk = new GrassChunk({
					groupPosition: params.groupPosition,
					chunkPosition: new THREE.Vector3(
						chunkSize.x / 2 + chunkSize.x * x - params.groupSize.x / 2,
						0,
						chunkSize.y / 2 + chunkSize.y * y - params.groupSize.y / 2
					),
					chunkSize,
					bladeGrassCount: params.chunkBladeGrassCount,
					lod: params.chunkLod,
				});

				this._chunkList.push(chunk);

				this._group.add(...chunk.lodInstancedMeshes);
			}
		}
	}

	public get group() {
		return this._group;
	}

	public get chunkList() {
		return this._chunkList;
	}
}
