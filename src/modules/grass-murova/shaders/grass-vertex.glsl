// uniform float time;
// attribute float random;
// void main() {
// 	mat4 instanceMatrix = instanceMatrix;
// 	vec4 instancePosition = instanceMatrix * vec4(position, 1.0);

// 	float wind = sin(time + random * 100.0) * 0.2;
// 	float windStrength = instancePosition.y * wind;
// 	instancePosition.x += windStrength;

// 	instancePosition.z += instancePosition.y * (cos(time + random * 100.0) * 0.2);

// 	gl_Position = projectionMatrix * modelViewMatrix * instancePosition;
// }

// ---

// #include <begin_vertex>

// mat4 instanceMatrix = instanceMatrix;
// vec4 instancePosition = instanceMatrix * vec4(position, 1.0);

// transformed.x += instancePosition.y * (sin(time + random + position.y) * 0.1);
// transformed.z += instancePosition.y * (cos(time + random + position.y) * 0.05);

// ---

#include <begin_vertex>

mat4 instanceMatrix = instanceMatrix;
vec4 instancePosition = instanceMatrix * vec4(position, 1.0);

// Извлекаем компоненты ротации (cos и sin) из instanceMatrix
float cosTheta = instanceMatrix[0][0];
float sinTheta = instanceMatrix[0][2];

// Нормализуем глобальное направление ветра
vec3 normWindDir = normalize(windDirection);

// Вычисляем амплитуды (основная по sin, вторая по cos для бокового движения)
float sinAmplitude = (time * (windStrength * 8.5) + random + position.y) * 0.2;
float mainAmplitude = sin(sinAmplitude) * windStrength;
float sideAmplitude = cos(sinAmplitude) * (windStrength * 0.3);  // Меньшая сила для бокового (0.5 — коэффициент, настройте)

// Перпендикулярное направление в XZ-плоскости (для бокового колебания; уберите, если не нужно)
vec3 perpDir = vec3(-normWindDir.z, 0.0, normWindDir.x);

// Глобальные смещения (основное + боковое)
vec3 worldOffset = instancePosition.y * (mainAmplitude * normWindDir + sideAmplitude * perpDir);

// Преобразуем глобальное смещение в локальное (используя ротацию по Y)
vec3 localOffset;
localOffset.x = cosTheta * worldOffset.x + sinTheta * worldOffset.z;
localOffset.y = 0.0;
localOffset.z = - sinTheta * worldOffset.x + cosTheta * worldOffset.z;

// Применяем локальное смещение
transformed += localOffset;
