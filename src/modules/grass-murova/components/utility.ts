import * as THREE from "three";
import type { SimplexNoise } from "three/examples/jsm/Addons.js";

/**
 * Генерирует текстуру нормалей (normalMap) для цилиндрической поверхности.
 *
 * @param width Ширина текстуры.
 * @param height Высота текстуры.
 * @param radius Радиус цилиндра (по умолчанию 1).
 * @param axis Ось цилиндра: "x" или "y" (по умолчанию "x").
 * @param noise Добавить шум (по умолчанию false).
 * @returns Текстура нормалей как THREE.DataTexture.
 */
export const generateCylinderNormalMap = (
	width: number,
	height: number,
	radius: number = 1,
	axis: "x" | "y" = "x",
	noise?: boolean
): THREE.DataTexture => {
	const size = width * height;
	const data = new Uint8Array(size * 4); // RGBA для эффективности

	for (let v = 0; v < height; v++) {
		// v для "высоты" по Y
		for (let u = 0; u < width; u++) {
			// u для "ширины" по X
			const i = (v * width + u) * 4;
			const uvX = u / (width - 1); // 0..1
			const uvY = v / (height - 1);

			let x = uvX * 2 - 1; // -1..1 по X
			let y = uvY * 2 - 1; // -1..1 по Y

			// Для оси 'y': свап x/y для цилиндра вдоль X
			if (axis === "y") {
				[x, y] = [y, x]; // Поворот эффекта
			}

			const distSq = x * x; // Только по радиальной оси (для цилиндра)

			let nx = 0,
				ny = 0,
				nz = 1; // Default flat
			if (distSq <= 1) {
				// Внутри радиуса: цилиндрическая нормаль
				nz = Math.sqrt(radius * radius - distSq);
				nx = x / radius; // Радиальная компонента
				if (noise) nx += Math.random() * 0.6;
				ny = 0; // Нет по Y для цилиндра вдоль Y
				const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
				nx /= length;
				ny /= length;
				nz /= length; // Нормализация для точности
			}

			// Конверт в 0..255 (normal * 0.5 + 0.5)
			data[i] = (nx * 0.5 + 0.5) * 255;
			data[i + 1] = (ny * 0.5 + 0.5) * 255;
			data[i + 2] = (nz * 0.5 + 0.5) * 255;
			data[i + 3] = 255; // Alpha
		}
	}

	const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
	texture.needsUpdate = true;
	texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping; // Нет повторений по краям
	texture.magFilter = texture.minFilter = THREE.LinearFilter; // Smooth интерполяция для нормалей

	return texture;
};

export const createdGradientTexture = (colorStart: THREE.Color, colorEnd: THREE.Color, width: number = 256) => {
	// 1. Параметры
	const height = 1; // Для линейного градиента достаточно 1 пикселя в высоту
	const size = width * height;
	const data = new Uint8Array(4 * size); // RGBA (4 канала)
	const tempColor = new THREE.Color();

	// 2. Заполнение массива данными
	for (let i = 0; i < size; i++) {
		const stride = i * 4;
		const t = i / (size - 1); // Коэффициент смешивания от 0 до 1

		// Интерполяция цветов
		tempColor.copy(colorStart).lerp(colorEnd, t);

		data[stride] = tempColor.r * 255; // R
		data[stride + 1] = tempColor.g * 255; // G
		data[stride + 2] = tempColor.b * 255; // B
		data[stride + 3] = 255; // A (непрозрачность)
	}

	// 3. Создание DataTexture
	const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
	texture.needsUpdate = true; // Обязательно для инициализации

	return texture;
};

export const getYSimplex = (simplex: SimplexNoise, x: number, z: number) => {
	return simplex.noise(x / 150, z / 150) * 15;
};
