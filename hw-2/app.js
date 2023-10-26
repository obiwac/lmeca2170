// most of the boilerplate here is based off of MOOdle: https://obiw.ac/moodle

class Matrix {
	// matrices are all 4x4, and are initialized as the identity matrix
	// I won't comment on the code here all that much because it's pretty much just computations

	constructor(template) {
		// if we pass a template matrix, coprev_y it
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

var line_color = [0.0, 1.0, 0.0]
var intersection_color = [1.0, 0.0, 0.0]
var default_color = [0.0, 0.0, 0.0]

const Z_OFFSET = 5

function abs_min(x, y) {
	if (Math.abs(x) < Math.abs(y)) {
		return x
	}

	return y
}

function max(a, b){
	return (a >= b) ? a : b
}

function min(a, b){
	return (a <= b) ? a : b
}

// check if third point is on the first - second, segment.

function on_segment(x1, y1, x2, y2, x3, y3) {
	if(x3 <= max(x1, x2) && x3 >= min(x1, x2) && y3 <= max(y1, y2) && y3 >= min(y1, y2)) {
		return true
	}

	return false
}

function segment_intersection(xa1, ya1, xa2, ya2, xb1, yb1, xb2, yb2) {

	const slope_a = (ya2 - ya1) / (xa2 - xa1)
	const slope_b = (yb2 - yb1) / (xb2 - xb1)

	const offset_a = ya1 - (slope_a * xa1)
	const offset_b = yb1 - (slope_b * xb1)

	if(slope_a == slope_b) {
		alert("Degenerate case")
		return
	}

	const intersection_x = (offset_b - offset_a) / (slope_a - slope_b)
	const intersection_y = (slope_a * intersection_x) + offset_a

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

		gl.uniform1i(render_state.is_point_uniform, 1)
		gl.uniform3f(render_state.color_uniform, ...intersection_color)
		gl.uniformMatrix4fv(render_state.model_uniform, false, model_matrix.data.flat())

		const float_size = this.vertices.BYTES_PER_ELEMENT

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo)

		gl.enableVertexAttribArray(render_state.pos_attr)
		gl.vertexAttribPointer(render_state.pos_attr, 3, gl.FLOAT, gl.FALSE, float_size*3, float_size * 0)
		gl.drawElements(gl.GL_POINTS, this.indices.length, gl.UNSIGNED_INT, 0)

		gl.uniform1i(render_state.is_point_uniform, 0)
	}
}

class Lines {
	constructor(gl) {
		this.vertices = []
		this.indices = []
		this.segments = []

		this.gl = gl
	}

	add_line(x1, y1, x2, y2, pt) {
		for(let i = 0; pt && i < this.segments.length; i++) {
			let [a, b] = segment_intersection(this.segments[i][0], this.segments[i][1], this.segments[i][2], this.segments[i][3], x1, y1, x2, y2)

			if (on_segment(x1, y1, x2, y2, a, b) && on_segment(this.segments[i][0], this.segments[i][1], this.segments[i][2], this.segments[i][3], a, b)) {
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

		this.segments.push([x1, y1, x2, y2])
	}

	draw(gl, render_state, model_matrix) {
		if (this.vertices.length === 0) {
			return
		}

		gl.uniform3f(render_state.color_uniform, ...line_color)
		gl.uniformMatrix4fv(render_state.model_uniform, false, model_matrix.data.flat())

		const float_size = this.vertices.BYTES_PER_ELEMENT

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo)

		gl.enableVertexAttribArray(render_state.pos_attr)
		gl.vertexAttribPointer(render_state.pos_attr, 3, gl.FLOAT, gl.FALSE, float_size * 3, float_size * 0)

		gl.drawElements(gl.LINES, this.indices.length, gl.UNSIGNED_INT, 0)
	}
}

class Mesh {
	constructor(mesh_data) {
		mesh = {
			nodes: [],
			edges: [],
			faces: [],
		}

		const node_data = mesh_data.Nodes[0]
		const elem_data = mesh_data.Elements[1]

		for (let i = 0; i < node_data.Indices.length; i++) {
			const node = {
				id: node_data.Indices[i],
				pos: node_data.Coordinates[i],
			}

			mesh.nodes.push(node)
		}

		let node_pair_to_hedge = {}
		let half_edges = []

		for (let i = 0; i < 2; i++) {
			const face = {
				id: elem_data.Indices[i],
				incident_edge: -1,
			}

			const face_nodes = elem_data.NodalConnectivity[i]
			let current_idx = half_edges.length

			half_edges.push({
				face: face.id,
				oppo: -1,
				next: -1,
				orig: face_nodes[0],
			})

			half_edges.push({
				face: face.id,
				oppo: -1,
				next: -1,
				orig: face_nodes[1],
			})

			half_edges.push({
				face: face.id,
				oppo: -1,
				next: -1,
				orig: face_nodes[2],
			})

			// determine the connectivity of the half-edges
			for (let j = 0; j < 3; j++) {
				half_edges[current_idx+j].next = (current_idx+j+1) % 3

				const a = !Object.keys(node_pair_to_hedge).includes([face_nodes[j],face_nodes[(j+1)%3]].toString())
				const b = !Object.keys(node_pair_to_hedge).includes([face_nodes[(j+1)%3], face_nodes[j]].toString())

				if (a && b) {
					node_pair_to_hedge[[face_nodes[j],face_nodes[(j+1)%3]]] = current_idx+j
				} else {
					console.log("alexis arrete de faire de la merde")
					half_edges[current_idx+j].oppo = node_pair_to_hedge[[face_nodes[(j+1)%3], face_nodes[j]]]
					half_edges[node_pair_to_hedge[[face_nodes[(j+1)%3], face_nodes[j]]]].oppo = current_idx+j
				}
			}
		}
		console.log(node_pair_to_hedge)
		console.log(half_edges)
	}
}

class Model {
	constructor(gl, model) {
		this.lines = new Lines(gl)

		this.temp_vertices = []
		this.temp_indices = []

		// Litlte hack to unattach the mesh (have separates triangles)
		this.vertices = []
		this.indices = []

		this.triangles = []

		this.highlight_triangle = [-1, -1, -1]

		this.points = new Point(gl)

		const data_nodes = model["Nodes"][0]

		for (let i = 0; i < data_nodes["Coordinates"].length; i++) {
			let [x, y, z] = data_nodes["Coordinates"][i]

			this.temp_vertices.push(x)
			this.temp_vertices.push(y)
			this.temp_vertices.push(z)
		}

		const data_elements = model["Elements"]

		for (let i = 0; i < data_elements.length; i++){
			if (data_elements[i]["Type"] == 2){
				const node_connectivity = data_elements[i]["NodalConnectivity"]

				for (let j = 0; j < node_connectivity.length; j++) {
					let [a, b, c] = (node_connectivity[j])
					this.temp_indices.push(a)
					this.temp_indices.push(b)
					this.temp_indices.push(c)
				}

				break
			}
		}

		let current_idx = 0;
		//this is where whe unattach the mesh
		for (let i = 0; i < this.temp_indices.length; i+=3){
			let a = this.temp_indices[i]
			let b = this.temp_indices[i+1]
			let c = this.temp_indices[i+2]

			let v1 = [this.temp_vertices[a * 3 + 0], this.temp_vertices[a * 3 + 1], this.temp_vertices[a * 3 + 2]]
			let v2 = [this.temp_vertices[b * 3 + 0], this.temp_vertices[b * 3 + 1], this.temp_vertices[b * 3 + 2]]
			let v3 = [this.temp_vertices[c * 3 + 0], this.temp_vertices[c * 3 + 1], this.temp_vertices[c * 3 + 2]]

			this.points.add_point(v1[0], v1[1])
			this.points.add_point(v2[0], v2[1])
			this.points.add_point(v3[0], v3[1])

			this.vertices.push(...v1)
			this.vertices.push(...v2)
			this.vertices.push(...v3)

			this.indices.push(current_idx++)
			this.indices.push(current_idx++)
			this.indices.push(current_idx++)

		}

		for (let i = 0; i < this.indices.length; i+=3){
			this.triangles.push([
				[this.vertices[i * 3], this.vertices[(i * 3) + 1], this.vertices[(i * 3) + 2], i],
				[this.vertices[(i + 1 ) * 3], this.vertices[(i + 1) * 3 + 1], this.vertices[(i + 1 ) * 3 + 2], (i+1)],
				[this.vertices[(i + 2 ) * 3], this.vertices[((i + 2 ) * 3 + 1)], this.vertices[((i + 2 ) * 3 + 2)], (i+2)],
			])

			this.lines.add_line(this.vertices[i * 3], this.vertices[(i * 3) + 1], this.vertices[(i + 1 ) * 3], this.vertices[(i + 1) * 3 + 1], undefined)
			this.lines.add_line(this.vertices[(i + 1 ) * 3], this.vertices[(i + 1) * 3 + 1], this.vertices[((i + 2 ) * 3)], this.vertices[((i + 2 ) * 3 + 1)], undefined)
			this.lines.add_line(this.vertices[((i + 2 ) * 3)], this.vertices[((i + 2 ) * 3 + 1)], this.vertices[i * 3], this.vertices[(i * 3) + 1], undefined)
		}

		this.vbo = gl.createBuffer()
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW)

		this.ibo = gl.createBuffer()
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo)
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW)
	}

	get_triangle_from_point(x, y) {
		for (let i = 0; i < this.triangles.length; i++) {
			let area =  ((this.triangles[i][1][1] - this.triangles[i][2][1]) * (this.triangles[i][0][0] - this.triangles[i][2][0]) + (this.triangles[i][2][0] - this.triangles[i][1][0]) * (this.triangles[i][0][1] - this.triangles[i][2][1]))
			let bary_a = ((this.triangles[i][1][1] - this.triangles[i][2][1]) * (x - this.triangles[i][2][0]) + (this.triangles[i][2][0] - this.triangles[i][1][0]) * (y - this.triangles[i][2][1])) / area
			let bary_b = ((this.triangles[i][2][1] - this.triangles[i][0][1]) * (x - this.triangles[i][2][0]) + (this.triangles[i][0][0] - this.triangles[i][2][0]) * (y - this.triangles[i][2][1])) / area
			let bary_c = 1 - bary_a - bary_b;

			if (bary_a >= 0 && bary_b >= 0 && bary_c >= 0) {
				return [this.triangles[i][0][3], this.triangles[i][1][3], this.triangles[i][2][3]]
			}
		}

		return -1
	}

	draw(gl, render_state, model_matrix) {
		gl.uniform3f(render_state.color_uniform, 0, 0, 0)
		gl.uniform3f(render_state.vertex_indices_uniform, ...this.highlight_triangle)

		gl.uniformMatrix4fv(render_state.model_uniform, false, model_matrix.data.flat())

		const float_size = this.vertices.BYTES_PER_ELEMENT

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo)

		gl.enableVertexAttribArray(render_state.pos_attr)
		gl.vertexAttribPointer(render_state.pos_attr, 3, gl.FLOAT, gl.FALSE, float_size * 3, float_size * 0)

		gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0)

		this.lines.draw(gl, render_state, model_matrix)
		this.points.draw(gl, render_state, model_matrix)
	}
}

const TAU = Math.PI * 2

var mx = 0
var my = 0

var target_mx = 0
var target_my = 0

var ripple_origin = [0, 0]
var ripple_time = 0
var alpha = 1
var part = 1

var target_zoom = 1
var zoom = 1

var target_px = 0
var px = 0

var target_py = 0
var py = 0

var translating = false

function toggle_parts() {
	const button = document.getElementById("switch")

	if (part === 1) {
		part = 2
		button.innerHTML = "Switch to part 1"
	}

	else if (part === 2) {
		part = 1
		button.innerHTML = "Switch to part 2"
	}
}

function anim(x, target, multiplier) {
	if (multiplier > 1) {
		return target
	}

	else {
		return x + (target - x) * multiplier
	}
}

class Geonum {
	// actual rendering code
	// Geonum does all the WebGL setup and handles the main loop/cows

	constructor() {
		// WebGL setup
		// this is all quite boilerplate-y stuff

		const canvas = document.getElementById("canvas")
		this.gl = canvas.getContext("webgl2") || canvas.getContext("experimental-webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl")

		if (!this.gl || (!(this.gl instanceof WebGLRenderingContext) && !(this.gl instanceof WebGL2RenderingContext))) {
			canvas.hidden = true
			return
		}

		let prev_x = 0
		let prev_y = 0
		let has_prev = false

		// MARKER

		this.points = new Point(this.gl)
		this.lines = new Lines(this.gl)
		this.mesh = new Model(this.gl, mesh)
		this.truc = new Mesh(mesh)

		zoom = 1
		px = 0
		py = 0

		canvas.addEventListener("mousemove", event => {
			const rect = canvas.getBoundingClientRect()

			const cx = rect.left + canvas.clientWidth  / 2
			const cy = rect.top + canvas.clientHeight / 2

			target_mx = (event.clientX - cx) / canvas.clientWidth
			target_my = (event.clientY - cy) / canvas.clientHeight

			if (translating) {
				target_px += event.movementX / 150 * zoom
				target_py -= event.movementY / 150 * zoom
			}
		}, false)

		canvas.addEventListener("click", event => {
			const shift = event.getModifierState("Shift")

			if (has_prev && !shift && part === 1) {
				has_prev = false
				this.lines.add_line(prev_x * Z_OFFSET * zoom - target_px, prev_y * Z_OFFSET * zoom - target_py, target_mx * Z_OFFSET * zoom - target_px, -target_my * Z_OFFSET * zoom - target_py, this.points)
			} else if (!shift && part === 2) {
				const world_x = target_mx * Z_OFFSET * zoom - target_px
				const world_y = -target_my * Z_OFFSET * zoom - target_py
				const indicies = this.mesh.get_triangle_from_point(world_x, world_y)
				if(indicies !== -1) {
					this.mesh.highlight_triangle = indicies
				}
			}
			else {
				has_prev = !shift
				prev_x = target_mx
				prev_y = -target_my
			}
		}, false)

		canvas.addEventListener("mousedown", event => {
			if (event.getModifierState("Shift")) {
				translating = true
			}
		})

		canvas.addEventListener("mouseup", () => {
			translating = false
		})

		canvas.addEventListener("wheel", event => {
			target_zoom += event.deltaY / 500
		})

		window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", event => {
			alpha = event.matches ? 0.8 : 1
		})

		this.x_res = this.gl.drawingBufferWidth
		this.y_res = this.gl.drawingBufferHeight

		this.gl.viewport(0, 0, this.x_res, this.y_res)

		this.gl.enable(this.gl.POINT_SMOOTH)
		this.gl.lineWidth(3)
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
			let vert_compilation_log = this.gl.getShaderInfoLog(vert_shader);
			let frag_compilation_log = this.gl.getShaderInfoLog(frag_shader);

			console.error(vert_compilation_log)
			console.error(frag_compilation_log)
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

			ripple_origin_uniform: this.gl.getUniformLocation(this.program, "u_ripple_origin"),
			ripple_time_uniform:   this.gl.getUniformLocation(this.program, "u_ripple_time"),

			alpha_uniform:         this.gl.getUniformLocation(this.program, "u_alpha"),
			color_uniform:         this.gl.getUniformLocation(this.program, "u_color"),
			vertex_indices_uniform:this.gl.getUniformLocation(this.program, "u_indices"),
			is_point_uniform:      this.gl.getUniformLocation(this.program, "u_is_point"),
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

		view_matrix.translate(0, 0, -Z_OFFSET)
		//view_matrix.rotate_2d(time, 0)

		const vp_matrix = new Matrix(view_matrix)
		vp_matrix.multiply(proj_matrix)

		// model matrix

		target_zoom = Math.max(target_zoom, 0.3)
		zoom = anim(zoom, Math.pow(target_zoom, 2), dt * 20)

		px = anim(px, target_px, dt * 15)
		py = anim(py, target_py, dt * 15)

		const model_matrix = new Matrix(identity)

		model_matrix.scale(1 / zoom, 1 / zoom, 1)
		model_matrix.translate(px, py, 0)

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
		this.gl.uniform3f(this.render_state.vertex_indices_uniform, -1, -1, -1)

		if (part === 1) {
			this.lines.draw(this.gl, this.render_state, model_matrix)
			this.points.draw(this.gl, this.render_state, model_matrix)
		}

		else {
			this.mesh.draw(this.gl, this.render_state, model_matrix)
		}

		requestAnimationFrame((now) => this.render(now))
	}
}

// create a new instance of Geonum when the page loads

var geonum

window.addEventListener("load", () => {
	geonum = new Geonum()
}, false)
