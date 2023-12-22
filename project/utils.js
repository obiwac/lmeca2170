export const TAU = 2 * Math.PI
export const FLOAT32_SIZE = 4

export function anim(x, target, multiplier) {
	if (multiplier > 1) {
		return target
	}

	return x + (target - x) * multiplier
}

export function anim_vec(x, target, multiplier) {
	let vec = structuredClone(x)

	for (let i = 0; i < x.length; i++) {
		vec[i] = anim(x[i], target[i], multiplier)
	}

	return vec
}

export class Demo {
	/** @constructor
	  * @param {string} id
	  * @param {function} add
	  */
	constructor(id, add) {
		// initialize WebGL context

		this.canvas = document.getElementById(id)

		/** @type {WebGLRenderingContext | WebGL2RenderingContext} */
		this.gl = this.canvas.getContext("webgl2") || this.canvas.getContext("experimental-webgl2") || this.canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl")

		if (!this.gl || (!(this.gl instanceof WebGLRenderingContext) && !(this.gl instanceof WebGL2RenderingContext))) {
			this.canvas.hidden = true
			throw Error("Browser doesn't support WebGL")
		}

		this.x_res = this.gl.drawingBufferWidth
		this.y_res = this.gl.drawingBufferHeight

		this.gl.viewport(0, 0, this.x_res, this.y_res)

		// camera controls

		this.pos = [0, 0, 0]
		this.target_pos = [0, 0, -1]

		const find_world_pos = e => {
			const rect = this.canvas.getBoundingClientRect()

			const cx = rect.left + this.canvas.clientWidth / 2
			const cy = rect.top + this.canvas.clientHeight / 2

			const mx = (e.clientX - cx) / this.canvas.clientWidth
			const my = (e.clientY - cy) / this.canvas.clientHeight

			const factor = 1 / Math.tan(TAU / 12) * 1.1 // XXX idk why it's 10% more

			const x = -mx * factor * this.pos[2] - this.pos[0]
			const y = my * this.y_res / this.x_res * factor * this.pos[2] - this.pos[1]

			return [x, y]
		}

		this.canvas.addEventListener("click", e => {
			const shift = e.getModifierState("Shift")
			e.preventDefault()

			if (e.button === 0) {
				if (shift) {
					const [x, y] = find_world_pos(e)
					add(x, y)
				}
			}
		})

		this.canvas.addEventListener("mousemove", e => {
			const shift = e.getModifierState("Shift")
			e.preventDefault()

			if (e.buttons & 0b1) {
				if (shift) {
					const [x, y] = find_world_pos(e)
					console.log(x, y)
				}

				else {
					this.target_pos[0] += e.movementX / 400 * -this.target_pos[2]
					this.target_pos[1] -= e.movementY / 400 * -this.target_pos[2]
				}
			}
		})

		this.canvas.addEventListener("wheel", e => {
			e.preventDefault()

			// TODO make zooming follow a quadratic curve

			this.target_pos[2] -= e.deltaY / 800
			this.target_pos[2] = Math.min(this.target_pos[2], -.2)
		})

		// rendering

		this.prev = 0
	}

	/** @function
	  * @param {function} render
	  */
	start(render_cb) {
		const render = now => {
			const dt = (now - this.prev) / 1000
			this.prev = now

			// update camera parameters

			this.pos = anim_vec(this.pos, this.target_pos, dt * 15)

			// clear screen (and other GL state stuff)

			this.gl.enable(this.gl.BLEND)
			this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)

			this.gl.clearColor(0, 0, 0, 1)
			this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

			render_cb(this.pos)

			requestAnimationFrame(render)
		}

		requestAnimationFrame(render)
	}
}
