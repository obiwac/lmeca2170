class IncompleteEdge {
	constructor(p1, p2, startx) {
		this.slope = (p1.y - p2.y) / (p1.x - p2.x)

		this.end = null
		this.start = null
	}
}

function get_y(p, x, directrix) {
	const dp = 2 * (p.y - directrix)
	const a1 = 1 / dp
	const b1 = -2 * p.x / dp
	const c1 = directrix + dp / 4 + p.x * p.x / dp

	return a1 * x * x + b1 * x + c1
}

/** @function
  * @param {Node[]} nodes
  * @returns {Triangle[]}
  */
function fortune(nodes) {
	const events = {
		"site": 0,
		"circle": 1,
		"parabola": 2,
		"skip": 3,
	}

	let queue = []

	for (const node of nodes) {
		queue.push([node, events.site])
	}

	let head = queue.length - 1

	queue.sort((a, b) => a[0].y - b[0].y)
	const beachline = new BeachTree()

	while (head >= 0) {
		current_event = queue[head--]

		if (current_event[1] == events.site) {
			if(beachline.root == null) {
				beachline.root = new BeachNode(current_event[0])
				continue
			}

			// On cherche l'arc qui est au dessus du point

			const above_arc = beachline.find_arc_above(current_event[0])
			console.log("above arc", above_arc.site)

			const left_arc = new BeachNode(above_arc.site)
			const middle_arc = new BeachNode(current_event[0])
			const right_arc = new BeachNode(above_arc.site)

			const start_point = new Node(current_event[0], get_y(current_event[0], above_arc.site.x, current_event[0].y))

			const edge_left = new Edge(start_point, above_arc.site, current_event[0])
			const edge_right = new Edge(start_point, current_event[0], above_arc.site)

			edge_left.set_parent(above_arc)
			edge_left.set_left(left_arc)
			edge_left.set_right(edge_right)

			edge_right.set_left(middle_arc)
			edge_right.set_right(right_arc)

			// Check if the root was the above arc, this souls occurs only once because after all arcs are leafs.
			if (beachline.root == above_arc) {
				console.log("L'arc au dessu est le root")
				beachline.root = edge_left
			}
		}

		else if (current_event.type == events.circle) {
			// TODO
		}
	}

	return []
}
