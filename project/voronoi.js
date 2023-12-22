import { Demo, TAU } from "./utils.js"
import { Nodes, Lines } from "./render.js"
import { Shader } from "./shader.js"
import { Mat } from "./matrix.js"

let nodes, voronoi_lines

function update() {
	nodes.update_mesh()

	const {voronoi_lines: voronoi_lines_raw, time_took} = nodes.fortune()
	document.getElementById("voronoi-time").innerText = `Took ${time_took} ms for ${nodes.nodes.length} nodes`

	voronoi_lines = new Lines(demo.gl, voronoi_lines_raw)
	voronoi_lines.update_mesh()
}

function update_all(node_data) {
	nodes = new Nodes(demo.gl, node_data)
	update()
}

const demo = new Demo("voronoi-canvas", (x, y) => {
	nodes.add(x, y)
	update()
})

update_all(nodeData)

const node_shader = new Shader(demo.gl, "node")
const voronoi_shader = new Shader(demo.gl, "voronoi")

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

	// render nodes

	node_shader.use()
	node_shader.mvp(mvp_mat)

	nodes.draw()

	// render voronoi lines
	// XXX rendering multiple times as a hack to make it look brighter without having to change the shader

	voronoi_shader.use()
	voronoi_shader.mvp(mvp_mat)

	voronoi_lines.draw()
	voronoi_lines.draw()
})

document.getElementById("voronoi-randomize").onclick = () => {
	let random_nodes = []
	const scale = 20

	for (let i = 0; i < 5000; i++) {
		random_nodes.push([scale * (Math.random() - .5), scale * (Math.random() - .5)])
	}

	update_all(random_nodes)
}

const upload = document.getElementById("voronoi-file")

upload.addEventListener("change", () => {
	const reader = new FileReader()

	reader.addEventListener("load", e => {
		update_all(e.target.result.match(/\[([^[\]]*)\]/g).map(x => JSON.parse(x)))
	})

	reader.readAsText(upload.files[0])
})
