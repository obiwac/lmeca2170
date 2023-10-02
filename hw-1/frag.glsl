#version 300 es

precision mediump float;
precision lowp int;

uniform float u_alpha;

in vec3 pos;
in vec3 normal;

in vec4 world_pos;
in float shading;
in float spec;

out vec4 frag_colour;

void main(void) {
	vec3 diffuse_colour = vec3(1.0, 0.0, 0.0) * shading;
	vec3 spec_colour = vec3(spec);

	frag_colour = vec4(diffuse_colour + spec_colour, u_alpha);
}
