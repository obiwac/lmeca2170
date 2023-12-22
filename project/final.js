import { Demo, TAU } from "./utils.js"
import { Nodes, Lines, Triangles } from "./render.js"
import { Shader } from "./shader.js"
import { Mat } from "./matrix.js"

const demo = new Demo("final-canvas")

let nodes, voronoi_lines, triangles

function update(node_data) {
	// nodes

	nodes = new Nodes(demo.gl, node_data)
	nodes.update_mesh()

	const {voronoi_lines: voronoi_lines_raw, delaunay_triangles, time_took} = nodes.fortune()
	document.getElementById("final-time").innerText = `Took ${time_took} ms for ${nodes.nodes.length} nodes`

	// voronoi lines

	voronoi_lines = new Lines(demo.gl, voronoi_lines_raw)
	voronoi_lines.update_mesh()

	// triangles

	triangles = new Triangles(demo.gl, delaunay_triangles)
	triangles.update_mesh()
}

update(nodeData)

const node_shader = new Shader(demo.gl, "node")
const voronoi_shader = new Shader(demo.gl, "voronoi")
const triangle_shader = new Shader(demo.gl, "tri")

demo.start(pos => {
	// projection stuff

	const proj_mat = new Mat()
	proj_mat.perspective(TAU / 6, demo.x_res / demo.y_res, .1, 200)

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
})

document.getElementById("final-randomize").onclick = () => {
	// nodes

	let random_nodes = []
	const scale = 20

	for (let i = 0; i < 5000; i++) {
		random_nodes.push([scale * (Math.random() - .5), scale * (Math.random() - .5)])
	}

	nodes = new Nodes(demo.gl, random_nodes)
	nodes.update_mesh()

	// voronoi lines

	const {voronoi_lines: voronoi_lines_raw, delaunay_triangles, time_took} = nodes.fortune()
	document.getElementById("final-time").innerText = `Took ${time_took} ms for ${nodes.nodes.length} nodes`

	voronoi_lines = new Lines(demo.gl, voronoi_lines_raw)
	voronoi_lines.update_mesh()

	// triangles

	triangles = new Triangles(demo.gl, delaunay_triangles)
	triangles.update_mesh()
}

const upload = document.getElementById("final-file")

upload.addEventListener("change", () => {
	const reader = new FileReader()

	reader.addEventListener("load", e => {
		update(e.target.result.match(/\[([^[\]]*)\]/g).map(x => JSON.parse(x)))
	})

	reader.readAsText(upload.files[0])
})
