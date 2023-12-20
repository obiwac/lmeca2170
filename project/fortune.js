// TODO DON'T MAKE THIS GLOBAL STATE
const events = {
	"site": 0,
	"circle": 1,
}

class Fortune{
	constructor() {
		this.arc_count = 0
		this.circle_count = 0

		this.BOUNDING_WIDTH = 100

		this.TODO_voronoi_lines = []

		this.queue = new PriorityQueue()
		this.beachline = new BeachTree()

	}

	/** @type: Line[] */
	get_y(p, x, directrix) {
		const dp = 2 * (p.y - directrix)
		const a1 = 1 / dp
		const b1 = -2 * p.x / dp
		const c1 = directrix + dp / 4 + p.x * p.x / dp

		return a1 * x * x + b1 * x + c1
	}

	//* https://blog.ivank.net/fortunes-algorithm-and-implementation.html
	/** @function
	 * @param {BreakPoint} edge1 - The first edge
	 * @param {BreakPoint} edge2 - The second edge
	 * @returns {Node} - The intersection of the two edges
	 */
	edge_intersection(edge1, edge2) {
		const dx = edge2.start.x - edge1.start.x
		const dy = edge2.start.y - edge1.start.y

		const det = ((edge2.direction.x * edge1.direction.y) - (edge2.direction.y * edge1.direction.x))

		if (det == 0) {
			return null
		}

		const u = (dy * edge2.direction.x - dx * edge2.direction.y) / det
		const v = (dy * edge1.direction.x - dx * edge1.direction.y) / det

		if (u < 0.0 || v < 0.0) {
			return null
		}

		if (u <= Number.EPSILON && v <= Number.EPSILON) {
			return null
		}

		// Only keep to 8 decimal places to avoid "floating point errors" like 0.020000000000000004 > 0.02

		return new Node(parseFloat((edge1.start.x + edge1.direction.x*u).toPrecision(8)) ,parseFloat((edge1.start.y + edge1.direction.y*u).toPrecision(8)))
	}

	/** @function
	 * @param {BeachNode} arc - The arc to check for circle event
	 */
	search_for_circle_event(arc) {
		let edge_left 	= this.beachline.get_first_parent_on_left(arc)
		let edge_right  = this.beachline.get_first_parent_on_right(arc)

		if (edge_left == null || edge_right == null ) {
			return null
		}

		const intersection = this.edge_intersection(edge_left, edge_right)

		if (intersection == null || intersection == false) {
			return
		}

		let centre_offset_x = arc.site.x - intersection.x
		let centre_offset_y = arc.site.y - intersection.y

		centre_offset_x = parseFloat(centre_offset_x).toPrecision(12)
		centre_offset_y = parseFloat(centre_offset_y).toPrecision(12)

		const dist = Math.sqrt(centre_offset_x * centre_offset_x + centre_offset_y * centre_offset_y)
		const intersection_y = intersection.y - dist

		if (intersection_y  >= arc.site.y) {
			return null
		}

		const circle_event = new CircleEvent(intersection, arc, intersection_y, this.circle_count)
		arc.circle_event = circle_event

		this.queue.enqueue([circle_event, events.circle])
		this.circle_count += 1
	}

	/** @function
	 * @param {number} x1
	 * @param {number} y1
	 * @param {number} x2
	 * @param {number} y2
	 */
	add_line(x1, y1, x2, y2) {
		this.TODO_voronoi_lines.push(new Line(x1, y1, x2, y2))
	}

	add_remaining_line(current_node) {
		if (current_node.is_leaf) {
			return
		}

		if (current_node.left != null) {
			this.add_remaining_line(current_node.left)
		}

		if (current_node.right != null) {
			this.add_remaining_line(current_node.right)
		}

		let max_x_coord = null

		if (current_node.direction.x > 0) {
			max_x_coord = Math.max(current_node.start.x + this.BOUNDING_WIDTH, this.BOUNDING_WIDTH)
		}

		else {
			max_x_coord = Math.min(current_node.start.x - this.BOUNDING_WIDTH, 0)
		}

		this.add_line(current_node.start.x, current_node.start.y, max_x_coord, max_x_coord * current_node.slope + current_node.offset)
	}

	/** @function
	 * @param {Node[]} nodes
	 * @returns {Edge[]}
	 */
	get_edges(nodes) {
		for (const node of nodes) {
			this.queue.enqueue([node, events.site])
		}

		let current_event = null

		while (this.queue.length > 0) {
			current_event = this.queue.dequeue()

			if (current_event[1] === events.site) {
				if (this.beachline.root == null) {
					this.beachline.root = new BeachNode(current_event[0], this.arc_count)
					this.arc_count++

					continue
				}

				// search for the arc above the current event

				const above_arc = this.beachline.find_arc_above(current_event[0])

				if (above_arc.circle_event != null) {
					above_arc.circle_event.is_valid = false
				}

				const left_arc 		= new BeachNode(above_arc.site, this.arc_count)
				const middle_arc 	= new BeachNode(current_event[0], this.arc_count)
				const right_arc 	= new BeachNode(above_arc.site, this.arc_count)

				// same id because they are the same parabola

				left_arc.id = above_arc.id
				right_arc.id = above_arc.id

				const start_point = new Node(current_event[0].x, this.get_y(above_arc.site, current_event[0].x, current_event[0].y))

				const edge_left = new BreakPoint(start_point, above_arc.site, current_event[0])
				const edge_right = new BreakPoint(start_point, current_event[0], above_arc.site)

				edge_left.set_parent(above_arc)
				edge_left.set_left(left_arc)
				edge_left.set_right(edge_right)
				edge_left.set_id(above_arc.id, this.arc_count)

				edge_right.set_left(middle_arc)
				edge_right.set_right(right_arc)
				edge_right.set_id(this.arc_count, above_arc.id)

				// Check if the root was the above arc, this souls occurs only once because after all arcs are leafs.
				if (this.beachline.root.compare(above_arc)) {
					this.beachline.root = edge_left
				}

				this.search_for_circle_event(left_arc)
				this.search_for_circle_event(right_arc)
				this.arc_count++ // Only once for the "new" arc other arcs aren't new they are just split
			}

			else if (current_event[1] === events.circle) {
				if (current_event[0].is_valid == false) {
					continue
				}

				let current_arc = current_event[0].arc

				let left_edge  = this.beachline.get_first_parent_on_left(current_arc)
				let right_edge = this.beachline.get_first_parent_on_right(current_arc)

				let left_arc  = this.beachline.get_first_leaf_on_left(left_edge)
				let right_arc = this.beachline.get_first_leaf_on_right(right_edge)

				// Remove all events that are related to the arcs that are going to be deleted

				if (left_arc.circle_event != null) {
					left_arc.circle_event.is_valid = false
					left_arc.circle_event = null
				}

				if (right_arc.circle_event != null) {
					right_arc.circle_event.is_valid = false
					right_arc.circle_event = null
				}

				if (left_arc.site.compare(right_arc.site)) {
					continue
				}

				let higher_edge = null
				let current_node = current_arc

				while (current_node.parent != null) {
					current_node = current_node.parent
					if (current_node.compare(left_edge)) {
						higher_edge = left_edge
					}

					if (current_node.compare(right_edge)) {
						higher_edge = right_edge
					}
				}

				if (higher_edge == null) {
					continue
				}

				// Add a new breakpoint at intersection point which will be the bisector of the two arcs
				let new_edge = new BreakPoint(current_event[0].point, left_arc.site, right_arc.site)
				new_edge.set_id(left_arc.id, right_arc.id)

				// Create our "complete edges" (here it is lines for debugging)
				this.add_line(current_event[0].point.x, current_event[0].point.y, left_edge.start.x, left_edge.start.y)
				this.add_line(right_edge.start.x, right_edge.start.y, current_event[0].point.x, current_event[0].point.y)

				new_edge.set_parent(higher_edge)
				new_edge.set_left(higher_edge.left)
				new_edge.set_right(higher_edge.right)

				// Reorganize the tree
				let remaining_line = null

				if (current_arc.parent.left.compare(current_arc)){
					remaining_line = current_arc.parent.right
				}

				else {
					remaining_line = current_arc.parent.left
				}

				remaining_line.set_parent(current_arc.parent)

				if (this.beachline.root.compare(left_edge) || this.beachline.root.compare(right_edge)) {
					this.beachline.root = new_edge
				}

				left_edge   = null
				current_arc = null
				right_edge  = null

				this.search_for_circle_event(left_arc)
				this.search_for_circle_event(right_arc)
			}
		}

		// Traverse the tree to get the remaining "unfinished" edges
		this.add_remaining_line(this.beachline.root)

		return {
			voronoi_lines: this.TODO_voronoi_lines,
			edges: [],
			delaunay_triangles: [],
		}
	}
}