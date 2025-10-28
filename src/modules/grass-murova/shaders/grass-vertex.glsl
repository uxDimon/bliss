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

#include <begin_vertex>

mat4 instanceMatrix = instanceMatrix;
vec4 instancePosition = instanceMatrix * vec4(position, 1.0);

transformed.x += instancePosition.y * (sin(time + random + position.y) * 0.1);
transformed.z += instancePosition.y * (cos(time + random + position.y) * 0.05);
