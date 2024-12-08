import { WebGLUtility, ShaderProgram } from "../../lib/webgl.js";
import { Pane } from "../../lib/tweakpane-4.0.0.min.js";

window.addEventListener(
	"DOMContentLoaded",
	async () => {
		const app = new WebGLApp();
		window.addEventListener("resize", app.resize, false);
		app.init("webgl-canvas");
		await app.load();
		app.setup();
		app.render();
	},
	false,
);

class WebGLApp {
	constructor() {
		this.canvas = null;
		this.gl = null;
		this.running = false;

		this.resize = this.resize.bind(this);
		this.render = this.render.bind(this);

		this.uPointSize = 1.0;
		this.uMouse = [0.0, 0.0];
		this.startTime = Date.now();
		this.mousePositions = [];
		this.maxTrailLength = 20;
		this.trailDuration = 0.1;

		const pane = new Pane();
		pane
			.addBlade({
				view: "slider",
				label: "point-size",
				min: 0.0,
				max: 2.0,
				value: this.uPointSize,
			})
			.on("change", (v) => {
				this.uPointSize = v.value;
			});

		window.addEventListener(
			"pointermove",
			(mouseEvent) => {
				const x = (mouseEvent.pageX / window.innerWidth) * 2.0 - 1.0;
				const y = -((mouseEvent.pageY / window.innerHeight) * 2.0 - 1.0);

				const signedX = x;
				const signedY = y;

				this.mousePositions.push({
					pos: [signedX, signedY],
					time: Date.now() * 0.001,
				});

				if (this.mousePositions.length > this.maxTrailLength) {
					this.mousePositions.shift();
				}

				this.uMouse[0] = signedX;
				this.uMouse[1] = signedY;
			},
			false,
		);
	}
	async load() {
		const vs = await WebGLUtility.loadFile("./main.vert");
		const fs = await WebGLUtility.loadFile("./main.frag");
		this.shaderProgram = new ShaderProgram(this.gl, {
			vertexShaderSource: vs,
			fragmentShaderSource: fs,
			attribute: ["position", "color", "size"],
			stride: [3, 4, 1],
			uniform: ["pointScale", "mouse", "mousePositions", "mousePositionsCount"],
			type: ["uniform1f", "uniform2fv", "uniform2fv", "uniform1i"],
		});
	}

	setup() {
		this.setupGeometry();
		this.resize();
		this.gl.clearColor(0, 0, 0.2, 0.2);
		this.running = true;
	}

	setupGeometry() {
		this.position = [];
		this.color = [];
		this.pointSize = [];

		const COUNT = 200;

		for (let i = 0; i < COUNT; ++i) {
			const x = i / (COUNT - 1);
			const signedX = x * 2.0 - 1.0;
			for (let j = 0; j < COUNT; ++j) {
				const y = j / (COUNT - 1);
				const signedY = y * 2.0 - 1.0;

				this.position.push(signedX, signedY, 0.0);
				this.color.push(0, 0, 0.5, 0.6);
				this.pointSize.push(1.0);
			}
		}

		this.vbo = [
			WebGLUtility.createVbo(this.gl, this.position),
			WebGLUtility.createVbo(this.gl, this.color),
			WebGLUtility.createVbo(this.gl, this.pointSize),
		];
	}

	render() {
		const gl = this.gl;
		if (this.running === true) {
			requestAnimationFrame(this.render);
		}

		const currentTime = Date.now() * 0.001;

		this.mousePositions = this.mousePositions.filter(
			(pos) => currentTime - pos.time < this.trailDuration,
		);

		const flatMousePositions = this.mousePositions.reduce((arr, pos) => {
			arr.push(pos.pos[0], pos.pos[1]);
			return arr;
		}, []);

		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT);

		this.shaderProgram.use();
		this.shaderProgram.setAttribute(this.vbo);
		this.shaderProgram.setUniform([
			this.uPointSize,
			this.uMouse,
			flatMousePositions,
			this.mousePositions.length,
		]);

		gl.drawArrays(gl.POINTS, 0, this.position.length / 3);
	}

	resize() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.setupGeometry();
	}

	init(canvas, option = {}) {
		if (canvas instanceof HTMLCanvasElement === true) {
			this.canvas = canvas;
		} else if (Object.prototype.toString.call(canvas) === "[object String]") {
			const c = document.querySelector(`#${canvas}`);
			if (c instanceof HTMLCanvasElement === true) {
				this.canvas = c;
			}
		}
		if (this.canvas == null) {
			throw new Error("invalid argument");
		}
		this.gl = this.canvas.getContext("webgl", option);
		if (this.gl == null) {
			throw new Error("webgl not supported");
		}
	}
}
