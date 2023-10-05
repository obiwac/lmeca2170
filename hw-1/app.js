// most of this is based off of MOOdle: https://obiw.ac/moodle

class Matrix {
	// matrices are all 4x4, and are initialized as the identity matrix
	// I won't comment on the code here all that much because it's pretty much just computations

	constructor(template) {
		// if we pass a template matrix, copy it
		// otherwise, initialize it to the 4x4 identity matrix

		if (template) {
			this.data = JSON.parse(JSON.stringify(template.data)) // I hate javascript 🙂
			return
		}

		this.data = [
			[1.0, 0.0, 0.0, 0.0],
			[0.0, 1.0, 0.0, 0.0],
			[0.0, 0.0, 1.0, 0.0],
			[0.0, 0.0, 0.0, 1.0],
		]
	}

	multiply(left) {
		const right = new Matrix(this)

		for (let i = 0; i < 4; i++) {
			for (let j = 0; j < 4; j++) {
				this.data[i][j] =
					left.data[0][j] * right.data[i][0] +
					left.data[1][j] * right.data[i][1] +
					left.data[2][j] * right.data[i][2] +
					left.data[3][j] * right.data[i][3]
			}
		}
	}

	scale(x, y, z) {
		for (let i = 0; i < 4; i++) {
			this.data[0][i] *= x
			this.data[1][i] *= y
			this.data[2][i] *= z
		}
	}

	translate(x, y, z) {
		for (let i = 0; i < 4; i++) {
			this.data[3][i] +=
				this.data[0][i] * x +
				this.data[1][i] * y +
				this.data[2][i] * z
		}
	}

	rotate(theta, x, y, z) {
		// theta represents the angle we want to rotate by
		// xyz represents the eigenvector of the matrix transformation of the rotation

		// normalize xyz

		const mag = Math.sqrt(x * x + y * y + z * z)

		x /= -mag
		y /= -mag
		z /= -mag

		const s = Math.sin(theta)
		const c = Math.cos(theta)
		const one_minus_c = 1 - c

		const xx = x * x, yy = y * y, zz = z * z
		const xy = x * y, yz = y * z, zx = z * x
		const xs = x * s, ys = y * s, zs = z * s

		const rotation = new Matrix()

		rotation.data[0][0] = (one_minus_c * xx) + c
		rotation.data[0][1] = (one_minus_c * xy) - zs
		rotation.data[0][2] = (one_minus_c * zx) + ys

		rotation.data[1][0] = (one_minus_c * xy) + zs
		rotation.data[1][1] = (one_minus_c * yy) + c
		rotation.data[1][2] = (one_minus_c * yz) - xs

		rotation.data[2][0] = (one_minus_c * zx) - ys
		rotation.data[2][1] = (one_minus_c * yz) + xs
		rotation.data[2][2] = (one_minus_c * zz) + c

		rotation.data[3][3] = 1

		rotation.multiply(this)
		this.data = rotation.data
	}

	rotate_2d(yaw, pitch) {
		this.rotate(yaw, 0, 1, 0)
		this.rotate(-pitch, Math.cos(yaw), 0, Math.sin(yaw))
	}

	frustum(left, right, bottom, top, near, far) {
		const dx = right - left
		const dy = top - bottom
		const dz = far - near

		// clear out matrix

		for (let i = 0; i < 4; i++) {
			for (let j = 0; j < 4; j++) {
				this.data[i][j] = 0
			}
		}

		this.data[0][0] = 2 * near / dx
		this.data[1][1] = 2 * near / dy

		this.data[2][0] = (right + left) / dx
		this.data[2][1] = (top + bottom) / dy
		this.data[2][2] = -(near + far)  / dz

		this.data[2][3] = -1
		this.data[3][2] = -2 * near * far / dz
	}

	perspective(fovy, aspect, near, far) {
		let y = Math.tan(fovy / 2) / 2
		let x = y / aspect

		this.frustum(-x * near, x * near, -y * near, y * near, near, far)
	}
}

var identity = new Matrix()

var line_color = [1.0, 0.0, 1.0]
var intersection_color = [1.0, 0.0, 0.0]
var default_color = [0.0, 0.0, 0.0]

var segments = []

function abs_min(x, y) {
	if (Math.abs(x) < Math.abs(y)) {
		return x;
	}

	return y;
}

function max(a, b){
	return (a >= b) ? a : b;
}

function min(a, b){
	return (a <= b) ? a : b;
}

//check if third point is on the first - second, segment.
function on_segment(x1, y1, x2, y2, x3, y3) {
	if(x3 <= max(x1, x2) && x3 >= min(x1, x2) && y3 <= max(y1, y2) && y3 >= min(y1, y2)) {
		return true;
	}

	return false;
}

function segment_intersection(xa1, ya1, xa2, ya2, xb1, yb1, xb2, yb2) {

	const slope_a = (ya2 - ya1) / (xa2 - xa1)
	const slope_b = (yb2 - yb1) / (xb2 - xb1)

	const offset_a = ya1 - (slope_a * xa1)
	const offset_b = yb1 - (slope_b * xb1)

	if(slope_a == slope_b) {
		return // same
	}

	const intersection_x = (offset_b - offset_a) / (slope_a - slope_b);
	const intersection_y = (slope_a * intersection_x) + offset_a;

	return [intersection_x, intersection_y]
}

class Point {
	constructor(gl) {
		this.vertices = []
		this.indices = []
		this.gl = gl
	}

	add_point(x, y) {
		this.vertices.push(x)
		this.vertices.push(y)
		this.vertices.push(0)

		this.indices.push(this.indices.length)

		this.gl.deleteBuffer(this.vbo)
		this.gl.deleteBuffer(this.ibo)

		this.vbo = this.gl.createBuffer()
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo)
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW)

		this.ibo = this.gl.createBuffer()
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ibo)
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices), this.gl.STATIC_DRAW)
	}

	draw(gl, render_state, model_matrix) {
		if (this.vertices.length === 0) {
			return
		}

		gl.uniform3f(render_state.color_uniform, ...intersection_color)

		gl.uniformMatrix4fv(render_state.model_uniform, false, model_matrix.data.flat())

		let float_size = this.vertices.BYTES_PER_ELEMENT

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo)

		gl.enableVertexAttribArray(render_state.pos_attr)
		gl.vertexAttribPointer(render_state.pos_attr, 3, gl.FLOAT, gl.FALSE, float_size*3, float_size * 0)
		gl.drawElements(gl.GL_POINTS, this.indices.length, gl.UNSIGNED_INT, 0)
	}
}

class Lines {
	constructor(gl) {
		this.vertices = []
		this.indices = []

		this.gl = gl
		//this.add_line(0, 0, 1, 1)
	}

	add_line(x1, y1, x2, y2, pt) {

		for(let i = 0; i < segments.length; i++) {
			let a, b;
			[a, b] = segment_intersection(segments[i][0], segments[i][1], segments[i][2], segments[i][3], x1, y1, x2, y2);
			if(on_segment(x1, y1, x2, y2, a, b) && on_segment(segments[i][0], segments[i][1], segments[i][2], segments[i][3], a, b)) {
				pt.add_point(a, b)
			}
		}


		const index = this.vertices.length / 3

		this.vertices.push(x1)
		this.vertices.push(y1)
		this.vertices.push(0)

		this.vertices.push(x2)
		this.vertices.push(y2)
		this.vertices.push(0)

		this.indices.push(index)
		this.indices.push(index + 1)

		this.gl.deleteBuffer(this.vbo)
		this.gl.deleteBuffer(this.ibo)

		this.vbo = this.gl.createBuffer()
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo)
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW)

		this.ibo = this.gl.createBuffer()
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ibo)
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices), this.gl.STATIC_DRAW)

		segments.push([x1, y1, x2, y2])

	}

	draw(gl, render_state, model_matrix) {
		if (this.vertices.length === 0) {
			return
		}
		gl.uniform3f(render_state.color_uniform, ...line_color)

		gl.uniformMatrix4fv(render_state.model_uniform, false, model_matrix.data.flat())

		let float_size = this.vertices.BYTES_PER_ELEMENT

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo)

		gl.enableVertexAttribArray(render_state.pos_attr)
		gl.vertexAttribPointer(render_state.pos_attr, 3, gl.FLOAT, gl.FALSE, float_size * 3, float_size * 0)

		gl.drawElements(gl.LINES, this.indices.length, gl.UNSIGNED_INT, 0)
	}
}

class Model {
	// this class handles the buffer creation and rendering of models

	constructor(gl, model) {
		// gl:    instance of WebGLRenderingContext
		// model: the model we wanna load (these are simple JS objects)

		this.model = model

		// create vertex buffer

		this.vbo = gl.createBuffer()
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
		gl.bufferData(gl.ARRAY_BUFFER, this.model.vertices, gl.STATIC_DRAW)

		// create index buffer

		this.ibo = gl.createBuffer()
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo)
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.model.indices, gl.STATIC_DRAW)
	}

	draw(gl, render_state, model_matrix) {
		// gl:           instance of WebGLRenderingContext
		// render_state: the render_state object
		// model_matrix: the model matrix to use to transform the model

		// pass the model matrix of our model (so that's like its own translation/rotation/scale) to the model uniform

		gl.uniformMatrix4fv(render_state.model_uniform, false, model_matrix.data.flat())

		// set buffers up for drawing
		// the attribute layout here is as follows (in total, we use 8 32-bit floats per attribute so 32 bytes total):
		// 0: 3 32-bit floats at offset 0 for the vertex positions
		// 1: 2 32-bit floats at offset 12 for the texture coordinates
		// 2: 3 32-bit floats at offset 20 for the normal vectors

		let float_size = this.model.vertices.BYTES_PER_ELEMENT

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo)

		gl.enableVertexAttribArray(render_state.pos_attr)
		gl.enableVertexAttribArray(render_state.normal_attr)

		gl.vertexAttribPointer(render_state.pos_attr,    3, gl.FLOAT, gl.FALSE, float_size * 6, float_size * 0)
		gl.vertexAttribPointer(render_state.normal_attr, 3, gl.FLOAT, gl.FALSE, float_size * 6, float_size * 3)

		// finally, actually draw the model
		// we draw the back face followed by the front face, so we blend the fragments of both together
		// this is actually why we don't need depth testing, as our balloon is convex and, aside from front/back which we're anyway controlling, there are no overlapping fragments

		gl.cullFace(gl.FRONT)
		gl.drawElements(gl.TRIANGLES, this.model.indices.length, gl.UNSIGNED_SHORT, 0)

		gl.cullFace(gl.BACK)
		gl.drawElements(gl.TRIANGLES, this.model.indices.length, gl.UNSIGNED_SHORT, 0)
	}
}

const TAU = Math.PI * 2
const z_offset = 5;

var mx = 0
var my = 0

var target_mx = 0
var target_my = 0

var ripple_origin = [0, 0]
var ripple_time = 0
var alpha = 1


class Geonum {
	// actual rendering code
	// Geonum does all the WebGL setup and handles the main loop/cows

	constructor() {
		// WebGL setup
		// this is all quite boilerplate-y stuff

		const canvas = document.getElementById("canvas")
		this.gl = canvas.getContext("webgl2") || canvas.getContext("experimental-webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

		if (!this.gl || (!(this.gl instanceof WebGLRenderingContext) && !(this.gl instanceof WebGL2RenderingContext))) {
			canvas.hidden = true
			return
		}

		let px = 0
		let py = 0
		let has_prev = false

		// MARKER

		this.points = new Point(this.gl)
		this.lines = new Lines(this.gl)

		window.addEventListener("mousemove", event => {
			const rect = canvas.getBoundingClientRect()

			const cx = rect.left + canvas.clientWidth  / 2
			const cy = rect.top + canvas.clientHeight / 2

			target_mx = (event.clientX - cx) / canvas.clientWidth
			target_my = (event.clientY - cy) / canvas.clientHeight
		}, false)

		window.addEventListener("click", () => {
			// XXX a bunch of these magic values can be found in the vertex shader
			//     they're hardcoded out of laziness
			if (has_prev) {
				has_prev = false;
				this.lines.add_line(px*z_offset, py*z_offset, target_mx*z_offset, -target_my*z_offset, this.points)
			}

			else {
				has_prev = true
				px = target_mx
				py = -target_my
			}
		}, false)

		window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", event => {
			alpha = event.matches ? 0.8 : 1
		})

		this.x_res = this.gl.drawingBufferWidth
		this.y_res = this.gl.drawingBufferHeight

		this.gl.viewport(0, 0, this.x_res, this.y_res)

		this.gl.disable(this.gl.DEPTH_TEST)
		this.gl.enable(this.gl.CULL_FACE)

		this.gl.enable(this.gl.BLEND)
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)

		// load shader program
		// again, nothing interesting to comment on, this is all basically boilerplate

		const vert_shader = this.gl.createShader(this.gl.VERTEX_SHADER)
		const frag_shader = this.gl.createShader(this.gl.FRAGMENT_SHADER)

		this.gl.shaderSource(vert_shader, document.getElementById("vert-shader").innerHTML)
		this.gl.shaderSource(frag_shader, document.getElementById("frag-shader").innerHTML)

		this.gl.compileShader(vert_shader)
		this.gl.compileShader(frag_shader)

		this.program = this.gl.createProgram()

		this.gl.attachShader(this.program, vert_shader)
		this.gl.attachShader(this.program, frag_shader)

		this.gl.linkProgram(this.program)

		// MDN detaches the shaders first with 'gl.detachShader'
		// I'm not really sure what purpose this serves

		this.gl.deleteShader(vert_shader)
		this.gl.deleteShader(frag_shader)

		if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
			const log = this.gl.getProgramInfoLog(this.program)

			console.error(log)
			canvas.hidden = true
		}

		// get attribute & uniform locations from program
		// we have to do this for attributes too, because WebGL 1.0 limits us to older shader models

		this.render_state = {
			pos_attr:              0, // this.gl.getAttribLocation(this.program, "a_pos"),
			normal_attr:           1, // this.gl.getAttribLocation(this.program, "a_normal"),

			model_uniform:         this.gl.getUniformLocation(this.program, "u_model"),
			vp_uniform:            this.gl.getUniformLocation(this.program, "u_vp"),
			sunlight_uniform:      this.gl.getUniformLocation(this.program, "u_sunlight"),

			ripple_origin_uniform: this.gl.getUniformLocation(this.program, "u_ripple_origin"),
			ripple_time_uniform:   this.gl.getUniformLocation(this.program, "u_ripple_time"),

			alpha_uniform:         this.gl.getUniformLocation(this.program, "u_alpha"),

			color_uniform:		   this.gl.getUniformLocation(this.program, "u_color"),
		}

		// loop

		this.target_fov = TAU / 4
		this.fov = TAU / 5

		this.prev = 0
		requestAnimationFrame((now) => this.render(now))
	}

	render(now) {
		// timing

		const dt = (now - this.prev) / 1000
		this.prev = now

		const time = now / 1000
		ripple_time += dt

		// create matrices

		let multiplier = dt * 5

		if (multiplier > 1) {
			this.fov = this.target_fov
		}

		else {
			this.fov += (this.target_fov - this.fov) * multiplier
		}

		multiplier = dt * 15

		if (multiplier > 1) {
			mx = target_mx
			my = target_my
		}

		else {
			mx += (target_mx - mx) * multiplier
			my += (target_my - my) * multiplier
		}

		const proj_matrix = new Matrix()
		proj_matrix.perspective(this.fov, this.y_res / this.x_res, 2, 20)

		const view_matrix = new Matrix()

		view_matrix.translate(0, 0, -z_offset)
		//view_matrix.rotate_2d(0, -0.3)

		const vp_matrix = new Matrix(view_matrix)
		vp_matrix.multiply(proj_matrix)

		// model matrix

		const model_matrix = new Matrix(identity)

		// actually render

		this.gl.clearColor(0.0, 0.0, 0.0, 0.0)
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

		this.gl.useProgram(this.program)
		this.gl.uniformMatrix4fv(this.render_state.vp_uniform, false, vp_matrix.data.flat())
		this.gl.uniform3f(this.render_state.sunlight_uniform, mx, -my, 0.5)

		this.gl.uniform3f(this.render_state.ripple_origin_uniform, ...ripple_origin, 0.5)
		this.gl.uniform1f(this.render_state.ripple_time_uniform, ripple_time)
		this.gl.uniform1f(this.render_state.alpha_uniform, alpha)
		this.gl.uniform3f(this.render_state.color_uniform, ...default_color)

		this.lines.draw(this.gl, this.render_state, model_matrix)
		this.points.draw(this.gl, this.render_state, model_matrix)

		requestAnimationFrame((now) => this.render(now))
	}
}

// create a new instance of Geonum when the page loads

var geonum

window.addEventListener("load", () => {
	geonum = new Geonum()
}, false)
