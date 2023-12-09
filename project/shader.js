class Shader {
	constructor(id) {
		const vert_id = `${id}-vert`
		const frag_id = `${id}-frag`

		const vert_shader = gl.createShader(gl.VERTEX_SHADER)
		const frag_shader = gl.createShader(gl.FRAGMENT_SHADER)

		gl.shaderSource(vert_shader, document.getElementById(vert_id).innerHTML)
		gl.shaderSource(frag_shader, document.getElementById(frag_id).innerHTML)

		gl.compileShader(vert_shader)
		gl.compileShader(frag_shader)

		this.program = gl.createProgram()

		gl.attachShader(this.program, vert_shader)
		gl.attachShader(this.program, frag_shader)

		gl.linkProgram(this.program)

		// MDN detaches the shaders first with 'gl.detachShader'
		// I'm not really sure what purpose this serves

		gl.deleteShader(vert_shader)
		gl.deleteShader(frag_shader)

		if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
			const log = gl.getProgramInfoLog(this.program)
			const vert_compilation_log = gl.getShaderInfoLog(vert_shader);
			const frag_compilation_log = gl.getShaderInfoLog(frag_shader);

			console.error(vert_compilation_log)
			console.error(frag_compilation_log)
			console.error(log)
		}

		// common uniforms

		this.mvp_uniform = gl.getUniformLocation(this.program, "mvp_matrix")
		this.anim_uniform = gl.getUniformLocation(this.program, "anim")
	}

	use() {
		gl.useProgram(this.program)
		cur_shader = this
	}

	/** @function
	  * @param {Mat} mat
	  */
	mvp(mat) {
		gl.uniformMatrix4fv(this.mvp_uniform, false, mat.data.flat())
	}

	/** @function
	  * @param {number} x
	  */
	anim(x) {
		gl.uniform1f(this.anim_uniform, x)
	}
}
