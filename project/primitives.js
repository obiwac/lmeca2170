class Node {
	/** @function
	  * @param {number} x
	  * @param {number} y
	  */
	constructor(x, y) {
		this.x = x
		this.y = y
	}
}

// TODO make this a HalfEdge thingy

class Edge {
	/** @function
	  * @param {Node} start
	  * @param {Node} end
	  */
	constructor(start, end) {
		this.start = start
		this.end = end
	}
}

class Triangle {
	/** @function
	  * @param {Node} a
	  * @param {Node} b
	  * @param {Node} c
	  */
	constructor(a, b, c) {
		this.a = a
		this.b = b
		this.c = c
	}
}
