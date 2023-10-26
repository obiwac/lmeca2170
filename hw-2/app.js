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

		for (let i = 0; i < elem_data.Indices.length; i++) {
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

		this.mesh = new Mesh(mesh)

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

		
		//this.mesh.draw(this.gl, this.render_state, model_matrix)
		

		requestAnimationFrame((now) => this.render(now))
	}
}

// create a new instance of Geonum when the page loads

var geonum

window.addEventListener("load", () => {
	geonum = new Geonum()
}, false)
