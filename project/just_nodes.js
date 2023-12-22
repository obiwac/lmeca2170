import { Demo, TAU } from "./utils.js"
import { Nodes } from "./render.js"
import { Shader } from "./shader.js"
import { Mat } from "./matrix.js"

const demo = new Demo("just-nodes-canvas")

// nodes

let nodes = new Nodes(demo.gl, nodeData)
nodes.update_mesh()
const node_shader = new Shader(demo.gl, "node")

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
})

document.getElementById("just-nodes-randomize").onclick = () => {
	let random_nodes = []
	const scale = 10

	for (let i = 0; i < 10000; i++) {
		random_nodes.push([scale * (Math.random() - .5), scale * (Math.random() - .5)])
	}

	nodes = new Nodes(demo.gl, random_nodes)
	nodes.update_mesh()
}
