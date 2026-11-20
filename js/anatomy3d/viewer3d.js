import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { SettingsService } from "../core/settings.js";
import { buildPrototypeHumanModel } from "./prototypeModel.js";

export class AnatomyViewer3D {
  constructor(containerEl, onStatsUpdate) {
    this.containerEl = containerEl;
    this.onStatsUpdate = onStatsUpdate;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.animationFrameId = null;
    this.resizeObserver = null;

    this.activeModelRoot = null;
    this.prototypeLayers = null;
    this.isCustomModel = false;
    this.skinVisible = true;
    this.autoRotate = false;
  }

  init() {
    const width = this.containerEl.clientWidth || 320;
    const height = this.containerEl.clientHeight || 420;
    const quality = SettingsService.getGraphicsQuality();

    this.scene = new THREE.Scene();

    // Camera positioned to frame full human standing height (~1.8 units)
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.05, 50);
    this.camera.position.set(0, 1.15, 2.55);

    this.renderer = new THREE.WebGLRenderer({
      antialias: quality !== "low",
      alpha: true,
      powerPreference: quality === "low" ? "low-power" : "default"
    });

    const maxDpr = quality === "high" ? 2 : quality === "medium" ? 1.5 : 1;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    this.renderer.setSize(width, height);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.containerEl.innerHTML = "";
    this.containerEl.appendChild(this.renderer.domElement);

    // Medical Studio Lighting
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 1.15);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
    keyLight.position.set(2.5, 4.0, 3.5);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x2dd4bf, 0.65);
    rimLight.position.set(-2.5, 2.0, -3.0);
    this.scene.add(rimLight);

    // Subtle reference grid at feet level
    const grid = new THREE.GridHelper(2.2, 14, 0x2dd4bf, 0x1e293b);
    grid.position.y = 0.0;
    grid.material.opacity = 0.35;
    grid.material.transparent = true;
    this.scene.add(grid);

    // Touch & Mouse OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.enablePan = true;
    this.controls.minDistance = 0.55;
    this.controls.maxDistance = 6.0;
    this.controls.target.set(0, 1.0, 0);
    this.controls.update();

    // Load built-in 6-layer prototype by default
    this.loadPrototypeModel();

    // Responsive Resize Observer
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.containerEl);

    this.animate();
  }

  loadPrototypeModel() {
    this.clearCurrentModel();
    const { root, layers } = buildPrototypeHumanModel();
    this.activeModelRoot = root;
    this.prototypeLayers = layers;
    this.isCustomModel = false;
    this.skinVisible = true;

    this.scene.add(root);
    this.resetCamera();
    this.emitModelStats("Prototype (6 Layers)");
  }

  async loadLocalGltfFile(file) {
    if (!file) return;

    const loader = new GLTFLoader();
    const objectUrl = URL.createObjectURL(file);

    try {
      const gltf = await loader.loadAsync(objectUrl);
      this.clearCurrentModel();

      const model = gltf.scene;
      this.normalizeModelTransform(model);

      this.activeModelRoot = model;
      this.prototypeLayers = null;
      this.isCustomModel = true;

      this.scene.add(model);
      this.resetCamera();
      this.emitModelStats(file.name);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  normalizeModelTransform(model) {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const targetHeight = 1.75;
    const scale = targetHeight / maxDim;

    model.scale.setScalar(scale);

    // Recalculate box after scaling to rest model feet cleanly at y = 0
    const scaledBox = new THREE.Box3().setFromObject(model);
    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);

    model.position.x -= scaledCenter.x;
    model.position.z -= scaledCenter.z;
    model.position.y -= scaledBox.min.y;
  }

  toggleSkinLayer() {
    if (!this.prototypeLayers || !this.prototypeLayers.skin) return false;
    this.skinVisible = !this.skinVisible;
    this.prototypeLayers.skin.visible = this.skinVisible;
    return this.skinVisible;
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    if (this.controls) {
      this.controls.autoRotate = this.autoRotate;
      this.controls.autoRotateSpeed = 1.4;
    }
    return this.autoRotate;
  }

  resetCamera() {
    if (!this.camera || !this.controls) return;
    this.camera.position.set(0, 1.15, 2.55);
    this.controls.target.set(0, 0.95, 0);
    this.controls.update();
  }

  emitModelStats(label) {
    if (!this.onStatsUpdate || !this.activeModelRoot) return;
    let meshCount = 0;
    this.activeModelRoot.traverse((obj) => {
      if (obj.isMesh) meshCount++;
    });
    this.onStatsUpdate({ label, meshCount, isCustomModel: this.isCustomModel });
  }

  clearCurrentModel() {
    if (!this.activeModelRoot) return;
    this.scene.remove(this.activeModelRoot);
    this.activeModelRoot.traverse((obj) => {
      if (obj.isMesh) {
        if (obj.geometry) obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else if (obj.material) {
          obj.material.dispose();
        }
      }
    });
    this.activeModelRoot = null;
    this.prototypeLayers = null;
  }

  handleResize() {
    if (!this.containerEl || !this.camera || !this.renderer) return;
    const width = this.containerEl.clientWidth;
    const height = this.containerEl.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    if (this.controls) this.controls.update();
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.clearCurrentModel();
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
  }
}
