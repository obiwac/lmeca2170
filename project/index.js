// a few constants up top

const TAU = 2 * Math.PI
const FLOAT32_SIZE = 4

// initialize WebGL context

const canvas = document.getElementById("canvas")

/** @type {WebGLRenderingContext | WebGL2RenderingContext} */
const gl = canvas.getContext("webgl2") || canvas.getContext("experimental-webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl")

if (!gl || (!(gl instanceof WebGLRenderingContext) && !(gl instanceof WebGL2RenderingContext))) {
	canvas.hidden = true
	throw Error("Browser doesn't support WebGL")
}

const x_res = gl.drawingBufferWidth
const y_res = gl.drawingBufferHeight

gl.viewport(0, 0, x_res, y_res)

// nodes

/*
let random_nodes = []
const scale = 10

for (let i = 0; i < 10000; i++) {
	random_nodes.push([scale * (Math.random() - .5), scale * (Math.random() - .5)])
}

const nodes = new Nodes(random_nodes)
*/

const nodes = new Nodes(nodeData)
nodes.update_mesh()

const node_shader = new Shader("node")
const {voronoi_lines: voronoi_lines_raw, delaunay_triangles} = nodes.fortune()

// voronoi lines

const voronoi_lines = new Lines(voronoi_lines_raw)
const voronoi_shader = new Shader("voronoi")
voronoi_lines.update_mesh()

// triangles

const triangles = new Triangles(delaunay_triangles)
const triangle_shader = new Shader("tri")
triangles.update_mesh()

// camera controls

let pos = [-.5, -.5, 0]
let target_pos = [-.5, -.5, -1]

function anim(x, target, multiplier) {
	if (multiplier > 1) {
		return target
	}

	return x + (target - x) * multiplier
}

function anim_vec(x, target, multiplier) {
	let vec = structuredClone(x)

	for (let i = 0; i < x.length; i++) {
		vec[i] = anim(x[i], target[i], multiplier)
	}

	return vec
}

canvas.addEventListener("mousemove", e => {
	e.preventDefault()

	if (e.buttons & 0b1) {
		target_pos[0] += e.movementX / 400 * -target_pos[2]
		target_pos[1] -= e.movementY / 400 * -target_pos[2]
	}
})

canvas.addEventListener("wheel", e => {
	e.preventDefault()

	// TODO make zooming follow a quadratic curve

	target_pos[2] -= e.deltaY / 800
	target_pos[2] = Math.min(target_pos[2], -.2)
})

// rendering

let prev = 0
let time = 0

/** @function
  * @param {number} now
  */
function render(now) {
	const dt = (now - prev) / 1000
	prev = now
	time += dt

	// update camera parameters

	pos = anim_vec(pos, target_pos, dt * 15)

	// clear screen (and other GL state stuff)

	gl.enable(gl.BLEND)
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

	gl.clearColor(0, 0, 0, 1)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	// projection stuff

	const proj_mat = new Mat()
	proj_mat.perspective(TAU / 6, x_res / y_res, .1, 200)

	const view_mat = new Mat()
	view_mat.translate(...pos)

	const vp_mat = new Mat(view_mat)
	vp_mat.multiply(proj_mat)

	const model_mat = new Mat()
	const mvp_mat = new Mat(model_mat)
	mvp_mat.multiply(vp_mat)

	// render triangles

	triangle_shader.use()
	triangle_shader.mvp(mvp_mat)

	triangles.draw()

	// render nodes

	node_shader.use()
	node_shader.mvp(mvp_mat)

	nodes.draw()

	// render voronoi lines

	voronoi_shader.use()
	voronoi_shader.mvp(mvp_mat)

	voronoi_lines.draw()

	// continue render loop

	requestAnimationFrame(render)
}

requestAnimationFrame(render)
