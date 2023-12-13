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
