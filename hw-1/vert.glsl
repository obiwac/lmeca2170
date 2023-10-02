#version 300 es

precision mediump float;

layout(location = 0) in vec3 a_pos;
layout(location = 1) in vec3 a_normal;

uniform mat4 u_model;
uniform mat4 u_vp;
uniform vec3 u_sunlight;

uniform vec3 u_ripple_origin;
uniform float u_ripple_time;

out vec3 pos;
out vec3 normal;

out vec4 world_pos;
out float shading;
out float spec;

#define TAU 6.28318

void main(void) {
	pos = a_pos;
	normal = a_normal;

	// lighting

	vec3 adjusted_normal = (u_model * vec4(normal, 1.0)).xyz;

	vec3 normalized_normal = normalize(adjusted_normal);
	vec3 normalized_sunlight = normalize(u_sunlight);

	float product = dot(normalized_normal, normalized_sunlight);
	float diffuse = 0.5 + 0.6 * product;

	float ambient = 0.3;

	shading = max(ambient, diffuse);
	spec = pow(max(product, 0.0), 32.0);

	// ripple

	vec3 normalized_ripple = normalize(u_ripple_origin);
	float phase = dot(normalized_normal, normalized_ripple) * 3.0;

	float theta = u_ripple_time * 6.0 + phase - TAU / 2.0;
	float disp = theta < TAU / 2.0 && theta > 0.0 ? sin(theta) : 0.0;

	pos += normal * disp * disp * 0.15;

	// output position

	world_pos = u_model * vec4(pos, 1.0);
	gl_Position = u_vp * world_pos;
}
