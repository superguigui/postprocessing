import {
	AnimationMixer,
	CubeTextureLoader,
	LoadingManager,
	PerspectiveCamera,
	Raycaster,
	Scene,
	sRGBEncoding,
	TextureLoader,
	Vector2,
	VSMShadowMap,
	WebGLRenderer
} from "three";

import {
	BlendFunction,
	OutlineEffect,
	OverrideMaterialManager,
	EffectComposer,
	EffectPass,
	KernelSize,
	RenderPass
} from "postprocessing";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Pane } from "tweakpane";
import { ControlMode, SpatialControls } from "spatial-controls";
import { calculateVerticalFoV, FPSMeter } from "../utils";
import * as Shapes from "../objects/Shapes";

function load() {

	const assets = new Map();
	const loadingManager = new LoadingManager();
	const gltfLoader = new GLTFLoader(loadingManager);
	const textureLoader = new TextureLoader(loadingManager);
	const cubeTextureLoader = new CubeTextureLoader(loadingManager);

	const path = document.baseURI + "img/textures/skies/sunset/";
	const format = ".png";
	const urls = [
		path + "px" + format, path + "nx" + format,
		path + "py" + format, path + "ny" + format,
		path + "pz" + format, path + "nz" + format
	];

	return new Promise((resolve, reject) => {

		loadingManager.onLoad = () => resolve(assets);
		loadingManager.onError = (url) => reject(new Error(`Failed to load ${url}`));

		gltfLoader.load(`${document.baseURI}models/rigged-simple/RiggedSimple.gltf`, (gltf) => {

			gltf.scene.traverse((object) => {

				if(object.isMesh) {

					object.castShadow = object.receiveShadow = true;

				}

			});

			assets.set("rigged-simple", gltf);

		});

		textureLoader.load(`${document.baseURI}img/textures/pattern.png`, (t) => {

			t.encoding = sRGBEncoding;
			assets.set("pattern", t);

		});

		cubeTextureLoader.load(urls, (t) => {

			t.encoding = sRGBEncoding;
			assets.set("sky", t);

		});

	});

}

window.addEventListener("load", () => load().then((assets) => {

	// Renderer

	const renderer = new WebGLRenderer({
		powerPreference: "high-performance",
		antialias: false,
		stencil: false,
		depth: false
	});

	renderer.debug.checkShaderErrors = (window.location.hostname === "localhost");
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.outputEncoding = sRGBEncoding;
	renderer.setClearColor(0x000000, 0);
	renderer.physicallyCorrectLights = true;
	renderer.shadowMap.type = VSMShadowMap;
	renderer.shadowMap.autoUpdate = false;
	renderer.shadowMap.needsUpdate = true;
	renderer.shadowMap.enabled = true;

	const container = document.querySelector(".viewport");
	container.append(renderer.domElement);

	// Camera & Controls

	const camera = new PerspectiveCamera();
	const controls = new SpatialControls(camera.position, camera.quaternion, renderer.domElement);
	const settings = controls.settings;
	settings.general.setMode(ControlMode.THIRD_PERSON);
	settings.rotation.setSensitivity(2.2);
	settings.rotation.setDamping(0.05);
	settings.zoom.setDamping(0.1);
	settings.translation.setEnabled(false);
	controls.setPosition(2, 2, 10);

	// Scene, Lights, Objects

	const scene = new Scene();
	scene.background = assets.get("sky");
	scene.add(Shapes.createLights());
	const actors = Shapes.createActors();
	scene.add(actors);

	const riggedSimple = assets.get("rigged-simple");
	riggedSimple.scene.scale.multiplyScalar(0.2);
	actors.add(riggedSimple.scene);

	const animationMixer = new AnimationMixer(riggedSimple.scene);
	const action = animationMixer.clipAction(riggedSimple.animations[0]);
	this.animationMixer = animationMixer;
	action.play();

	const step = 2.0 * Math.PI / actors.children.length;
	const radius = 3.0;
	let angle = 3.5;

	for(const mesh of actors.children) {

		// Arrange the objects in a circle.
		mesh.position.set(radius * Math.cos(angle), 0, radius * Math.sin(angle));
		angle += step;

	}

	// Post Processing

	OverrideMaterialManager.workaroundEnabled = true;

	const context = renderer.getContext();
	const composer = new EffectComposer(renderer, {
		multisampling: Math.min(4, context.getParameter(context.MAX_SAMPLES))
	});

	const outlineEffect = new OutlineEffect(scene, camera, {
		blendFunction: BlendFunction.SCREEN,
		patternScale: 40,
		visibleEdgeColor: 0xffffff,
		hiddenEdgeColor: 0x22090a,
		height: 480,
		blur: false,
		xRay: true
	});

	outlineEffect.selection.add(actors.children[0]);

	composer.addPass(new RenderPass(scene, camera));
	composer.addPass(new EffectPass(camera, outlineEffect));

	// Object Picking

	const ndc = new Vector2();
	const raycaster = new Raycaster();
	renderer.domElement.addEventListener("pointerdown", (event) => {

		const clientRect = container.getBoundingClientRect();
		const clientX = event.clientX - clientRect.left;
		const clientY = event.clientY - clientRect.top;
		ndc.x = (clientX / container.clientWidth) * 2.0 - 1.0;
		ndc.y = -(clientY / container.clientHeight) * 2.0 + 1.0;
		raycaster.setFromCamera(ndc, camera);
		const intersects = raycaster.intersectObjects(scene.children, true);

		if(intersects.length > 0) {

			outlineEffect.selection.toggle(intersects[0].object);

		}

	});

	// Settings

	const fpsMeter = new FPSMeter();
	const pane = new Pane({ container: container.querySelector(".tp") });
	pane.addMonitor(fpsMeter, "fps", { label: "FPS" });

	const params = {
		"resolution": outlineEffect.resolution.height,
		"blur": outlineEffect.blurPass.enabled,
		"kernel size": outlineEffect.blurPass.kernelSize,
		"use pattern": false,
		"pattern scale": outlineEffect.patternScale,
		"pulse speed": outlineEffect.pulseSpeed,
		"edge strength": outlineEffect.edgeStrength,
		"visible edge": outlineEffect.visibleEdgeColor.getHex(),
		"hidden edge": outlineEffect.hiddenEdgeColor.getHex(),
		"x-ray": outlineEffect.xRay,
		"opacity": outlineEffect.blendMode.getOpacity(),
		"blend mode": outlineEffect.blendMode.getBlendFunction()
	};

	function reducer(a, b) {

		a[b] = b;
		return a;

	}

	const folder = pane.addFolder({ title: "Settings" });
	folder.addInput(params, "resolution", { options: [360, 480, 720, 1080].reduce(reducer, {}) })
		.on("change", (e) => outlineEffect.resolution.preferredHeight = e.value);
	folder.addInput(params, "kernel size", { options: KernelSize })
		.on("change", (e) => outlineEffect.blurPass.kernelSize = e.value);
	folder.addInput(params, "blur").on("change", (e) => outlineEffect.blurPass.enabled = e.value);
	folder.addInput(params, "use pattern")
		.on("change", (e) => outlineEffect.patternTexture = (e.value ? assets.get("pattern") : null));
	folder.addInput(params, "pattern scale", { min: 20, max: 100, step: 0.1 })
		.on("change", (e) => outlineEffect.patternScale = e.value);
	folder.addInput(params, "edge strength", { min: 0, max: 10, step: 0.01 })
		.on("change", (e) => outlineEffect.edgeStrength = e.value);
	folder.addInput(params, "pulse speed", { min: 0, max: 2, step: 0.01 })
		.on("change", (e) => outlineEffect.pulseSpeed = e.value);
	folder.addInput(params, "visible edge", { view: "color" })
		.on("change", (e) => outlineEffect.visibleEdgeColor.setHex(e.value));
	folder.addInput(params, "hidden edge", { view: "color" })
		.on("change", (e) => outlineEffect.hiddenEdgeColor.setHex(e.value));
	folder.addInput(params, "x-ray").on("change", (e) => outlineEffect.xRay = e.value);

	folder.addInput(params, "opacity", { min: 0, max: 1, step: 0.01 })
		.on("change", (e) => outlineEffect.blendMode.setOpacity(e.value));
	folder.addInput(params, "blend mode", { options: BlendFunction })
		.on("change", (e) => outlineEffect.blendMode.setBlendFunction(e.value));

	// Resize Handler

	function onResize() {

		const width = container.clientWidth, height = container.clientHeight;
		camera.aspect = width / height;
		camera.fov = calculateVerticalFoV(90, Math.max(camera.aspect, 16 / 9));
		camera.updateProjectionMatrix();
		composer.setSize(width, height);

	}

	window.addEventListener("resize", onResize);
	onResize();

	// Render Loop

	let t0 = 0;

	requestAnimationFrame(function render(timestamp) {

		const deltaTime = timestamp - t0;
		t0 = timestamp;

		fpsMeter.update(timestamp);
		controls.update(timestamp);
		animationMixer.update(deltaTime * 1e-3);
		composer.render();
		requestAnimationFrame(render);

	});

}));
