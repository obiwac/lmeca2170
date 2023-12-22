import { Node } from "./primitives.js"

// AVL Beach Tree implementation
// internal nodes are BreakPoint's and leaves are Arc's
// see: https://www.programiz.com/dsa/avl-tree
// see: https://blog.ivank.net/fortunes-algorithm-and-implementation.html

export class CircleEvent {
	constructor(site, arc, y, radius, id) {
		this.point = site
		this.y = y
		this.arc = arc
		this.radius = radius
		this.id = id
		this.valid = true
	}

	/** @function compare the circle event with other circle to see if they are equal
	  * @param {CircleEvent} other - the circle event to compare with
	  * @returns {boolean} true if the nodes are equal, false otherwise
	  */
	compare(other) {
		if (other == null) {
			return false
		}

		return this.id == other.id
	}
}

export class BeachNode {
	constructor(site, id) {
		this.site = site

		this.left = null
		this.right = null

		this.parent = null
		this.circle_event = null

		this.is_leaf = true
		this.id = id

		this.height = 1
	}

	/** @function set the left child of the current node to node
	  * @param {BeachNode} node
	  */
	set_left(node) {
		this.left = node
		this.is_leaf = false

		if (node != null) {
			node.parent = this
		}
	}

	/** @function set the right child of the current node to node
	  * @param {BeachNode} node
	  */
	set_right(node) {
		this.right = node
		this.is_leaf = false

		if (node != null) {
			node.parent = this
		}
	}

	/** @function set the parent node of the current node to node
	  * @param {BeachNode} node the parent node
	  */
	set_parent(node) {
		if (node.parent == null) {
			// can happen if node is the root of the tree

			this.parent = null
			return
		}

		if (node.parent.left.compare(node)) {
			node.parent.set_left(this)
		}

		else {
			node.parent.set_right(this)
		}
	}

	/** @function compare the current node with other node to see if they are equal
	  * @param {BeachNode} other - the node to compare with
	  * @returns {boolean} true if the nodes are equal, false otherwise
	  */
	compare(other) {
		if (other == null) {
			return false
		}

		let first_condition = false

		if (this.site != null) {
			first_condition = this.site.compare(other.site)
		}

		else if (other.site == null) {
			first_condition = true
		}

		return first_condition && this.id.toString() == other.id.toString()
	}

	/** @function update the height of the node for AVL
	 */
	update_height() {
		let left_height = 0
		let right_height = 0

		if (this.left != null) {
			left_height = this.left.height
		}

		if (this.right != null) {
			right_height = this.right.height
		}

		node.height = Math.max(left_height, right_height) + 1
	}
}

export class BreakPoint extends BeachNode {
	constructor(start, left_site, right_site) {
		super(null, null)

		this.start = start
		this.slope = (left_site.x - right_site.x) / (right_site.y - left_site.y)

		this.offset = start.y - this.slope * start.x
		this.direction = new Node(right_site.y - left_site.y, left_site.x - right_site.x)
	}

	set_id(id_left, id_right) {
		this.id = [id_left, id_right]
	}
}

export class BeachTree {
	constructor() {
		this.root = null
	}

	/** @function return the parent that has node to its left
	  * @param {Node} node - the node to find the parent of
	  * @returns {BeachNode} the parent
	  */
	get_first_parent_on_left(node) {
		let current_node = node

		while (current_node.parent != null && current_node.parent.left.compare(current_node)) {
			current_node = current_node.parent
		}

		return current_node.parent
	}

	/** @function return the parent that has node to its right
	  * @param {Node} node - the node to find the parent of
	  * @returns {BeachNode} the parent
	  */
	get_first_parent_on_right(node) {
		let current_node = node

		while (current_node.parent != null && current_node.parent.right.compare(current_node)) {
			current_node = current_node.parent
		}

		return current_node.parent
	}

	get_first_leaf_on_left(node) {
		if (node == null) {
			return null
		}

		if (node.left == null) {
			return null
		}

		let current_node = node.left

		while (current_node.is_leaf == false) {
			current_node = current_node.right
		}

		return current_node
	}

	get_first_leaf_on_right(node) {
		if (node == null) {
			return null
		}

		if (node.right == null) {
			return null
		}

		let current_node = node.right

		while (current_node.is_leaf == false) {
			current_node = current_node.left
		}

		return current_node
	}

	/** @function
	  * @returns {number} x - x coordinate of the intersection of the two parabolas
	  */
	get_x_of_edge(node, directrix) {
		const left = this.get_first_leaf_on_left(node)
		const right = this.get_first_leaf_on_right(node)

		const p = left.site
		const r = right.site

		let dp = 2 * (p.y - directrix)
		const a1 = 1 / dp
		const b1 = -2 * p.x / dp
		const c1 = directrix + dp / 4 + p.x * p.x / dp

		dp = 2 * (r.y - directrix)
		const a2 = 1 / dp
		const b2 = -2 * r.x / dp
		const c2 = directrix + dp / 4 + r.x * r.x / dp

		const a = a1 - a2
		const b = b1 - b2
		const c = c1 - c2

		const disc = b * b - 4 * a * c
		const x1 = (-b + Math.sqrt(disc)) / (2 * a)
		const x2 = (-b - Math.sqrt(disc)) / (2 * a)

		if (p.y < r.y) {
			return Math.max(x1, x2)
		}

		else {
			return Math.min(x1, x2)
		}
	}

	/** @function
	  * @param {Node} site - the site to find the arc above
	  * @returns {BeachNode} the arc above the site
	  */
	find_arc_above(site) {
		let current_node = this.root

		while (current_node.is_leaf == false) {
			const x = this.get_x_of_edge(current_node, site.y)

			if (x > site.x) {
				current_node = current_node.left
			}

			else {
				current_node = current_node.right
			}
		}

		return current_node
	}
}
