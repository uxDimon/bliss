import { mount } from "svelte";
import "./css/main.css";
import App from "./App.svelte";
// import * as THREE from "three";
// import { createdDevOrbitControls } from "@/utility/three/devOrbitControls";

window._rv_isDev = true;

const app = mount(App, {
	target: document.getElementById("app")!,
});

// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// const renderer = new THREE.WebGLRenderer();
// renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.setAnimationLoop(animate);
// document.body.appendChild(renderer.domElement);

// const devControls = createdDevOrbitControls(camera, renderer);

// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

// camera.position.z = 5;

// function animate() {
// 	// cube.rotation.x += 0.01;
// 	// cube.rotation.y += 0.01;

// 	if (devControls) devControls.update();

// 	renderer.render(scene, camera);
// }

export default app;
