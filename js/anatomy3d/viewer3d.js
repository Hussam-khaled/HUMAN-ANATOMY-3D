import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { SettingsService } from "../core/settings.js";
import { buildPrototypeHumanModel } from "./prototypeModel.js";

export class AnatomyViewer3D {
  constructor(containerEl, callbacks = {}) {
    this.containerEl = containerEl;
    this.onStatsUpdate = callbacks.onStatsUpdate || null;
    this.onSelectPart = callbacks.onSelectPart || null;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.animationFrameId = null;
    this.resizeObserver = null;

    this.activeModelRoot = null;
    this.prototypeLayers = null;
    this.isCustomModel = false;
    this.autoRotate = false;

    // Phase 4 Interactive State
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.pointerDownPos = { x: 0, y: 0 };
    this.selectedMesh = null;
    this.originalEmissive = null;
    this.explodeFactor = 0;
    this.modelCenter = new THREE.Vector3(0, 1.0, 0);

    this._onPointerDown = (e) => this.handlePointerDown(e);
    this._onPointerUp = (e) => this.handlePointerUp(e);
  }

  init() {
    const width = this.containerEl.clientWidth || 320;
    const height = this.containerEl.clientHeight || 420;
    const quality = SettingsService.getGraphicsQuality();

    this.scene = new THREE.Scene();

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
    this.scene.add(new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 1.15));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
    keyLight.position.set(2.5, 4.0, 3.5);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x2dd4bf, 0.65);
    rimLight.position.set(-2.5, 2.0, -3.0);
    this.scene.add(rimLight);

    const grid = new THREE.GridHelper(2.2, 14, 0x2dd4bf, 0x1e293b);
    grid.position.y = 0.0;
    grid.material.opacity = 0.35;
    grid.material.transparent = true;
    this.scene.add(grid);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.enablePan = true;
    this.controls.minDistance = 0.45;
    this.controls.maxDistance = 6.0;
    this.controls.target.set(0, 1.0, 0);
    this.controls.update();

    // Bind pointer events for Raycasting (Tap to Select)
    this.renderer.domElement.addEventListener("pointerdown", this._onPointerDown);
    this.renderer.domElement.addEventListener("pointerup", this._onPointerUp);

    this.loadPrototypeModel();

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.containerEl);

    this.animate();
  }

  loadPrototypeModel() {
    this.clearSelection();
    this.clearCurrentModel();

    const { root, layers } = buildPrototypeHumanModel();
    this.activeModelRoot = root;
    this.prototypeLayers = layers;
    this.isCustomModel = false;
    this.explodeFactor = 0;

    this.scene.add(root);
    this.cacheMeshExplodeData();
    this.resetCamera();
    this.emitModelStats("Prototype (6 Layers)");
  }

  async loadLocalGltfFile(file) {
    if (!file) return;

    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
    loader.setDRACOLoader(dracoLoader);

    const objectUrl = URL.createObjectURL(file);

    try {
      const gltf = await loader.loadAsync(objectUrl);
      this.clearSelection();
      this.clearCurrentModel();

      const model = gltf.scene;
      this.normalizeModelTransform(model);

      this.activeModelRoot = model;
      this.prototypeLayers = null;
      this.isCustomModel = true;
      this.explodeFactor = 0;

      this.scene.add(model);
      this.cacheMeshExplodeData();
      this.resetCamera();
      this.emitModelStats(file.name);
    } finally {
      dracoLoader.dispose();
      URL.revokeObjectURL(objectUrl);
    }
  }

  normalizeModelTransform(model) {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 1.75 / maxDim;
    model.scale.setScalar(scale);

    const scaledBox = new THREE.Box3().setFromObject(model);
    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);

    model.position.x -= scaledCenter.x;
    model.position.z -= scaledCenter.z;
    model.position.y -= scaledBox.min.y;
  }

  cacheMeshExplodeData() {
    if (!this.activeModelRoot) return;
    const box = new THREE.Box3().setFromObject(this.activeModelRoot);
    box.getCenter(this.modelCenter);

    this.activeModelRoot.traverse((obj) => {
      if (obj.isMesh) {
        obj.userData.originalPosition = obj.position.clone();
        const meshBox = new THREE.Box3().setFromObject(obj);
        const meshCenter = new THREE.Vector3();
        meshBox.getCenter(meshCenter);

        const dir = meshCenter.sub(this.modelCenter);
        if (dir.lengthSq() < 0.0001) dir.set(0, 1, 0);
        obj.userData.explodeDir = dir.normalize();
      }
    });
  }

  handlePointerDown(event) {
    this.pointerDownPos = { x: event.clientX, y: event.clientY };
  }

  handlePointerUp(event) {
    // Ignore drag gestures (camera rotation)
    const dx = event.clientX - this.pointerDownPos.x;
    const dy = event.clientY - this.pointerDownPos.y;
    if (Math.hypot(dx, dy) > 8) return;

    this.pickObjectAt(event.clientX, event.clientY);
  }

  pickObjectAt(clientX, clientY) {
    if (!this.activeModelRoot || !this.renderer || !this.camera) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    const selectableMeshes = [];
    this.activeModelRoot.traverse((obj) => {
      if (obj.isMesh && obj.visible) {
        // Check parent visibility too
        let parentVisible = true;
        let p = obj.parent;
        while (p) {
          if (!p.visible) {
            parentVisible = false;
            break;
          }
          p = p.parent;
        }
        if (parentVisible) selectableMeshes.push(obj);
      }
    });

    const hits = this.raycaster.intersectObjects(selectableMeshes, false);
    if (hits.length > 0) {
      // Prefer non-skin hits if user taps through translucent skin
      const nonSkinHit = hits.find((h) => h.object.userData.layer !== "skin");
      this.selectMesh((nonSkinHit || hits[0]).object);
    } else {
      this.clearSelection();
    }
  }

  selectMesh(mesh) {
    if (this.selectedMesh === mesh) return;
    this.clearSelection();

    this.selectedMesh = mesh;
    if (mesh.material && mesh.material.emissive) {
      // Clone material on first highlight so shared materials don't all glow
      if (!mesh.userData._hasUniqueMaterial) {
        mesh.material = mesh.material.clone();
        mesh.userData._hasUniqueMaterial = true;
      }
      this.originalEmissive = mesh.material.emissive.clone();
      mesh.material.emissive.setHex(0x14b8a6);
      mesh.material.emissiveIntensity = 0.65;
    }

    if (this.onSelectPart) {
      this.onSelectPart({
        organId: mesh.userData.organId || mesh.name || "mesh",
        nameAr: mesh.userData.nameAr || mesh.name || "جزء تشريحي",
        nameEn: mesh.userData.nameEn || mesh.name || "Anatomical Part",
        layer: mesh.userData.layer || "custom",
        systemId: mesh.userData.systemId || "custom"
      });
    }
  }

  clearSelection() {
    if (this.selectedMesh && this.selectedMesh.material && this.selectedMesh.material.emissive && this.originalEmissive) {
      this.selectedMesh.material.emissive.copy(this.originalEmissive);
      this.selectedMesh.material.emissiveIntensity = 1;
    }
    this.selectedMesh = null;
    this.originalEmissive = null;

    if (this.onSelectPart) {
      this.onSelectPart(null);
    }
  }

  setLayerVisibility(layerKey, isVisible) {
    if (!this.prototypeLayers || !this.prototypeLayers[layerKey]) return;
    this.prototypeLayers[layerKey].visible = isVisible;
    if (!isVisible && this.selectedMesh && this.selectedMesh.userData.layer === layerKey) {
      this.clearSelection();
    }
  }

  isolateSelected() {
    if (!this.selectedMesh || !this.activeModelRoot) return;
    const target = this.selectedMesh;
    this.activeModelRoot.traverse((obj) => {
      if (obj.isMesh) {
        obj.visible = obj === target;
      }
    });
  }

  hideSelected() {
    if (!this.selectedMesh) return;
    this.selectedMesh.visible = false;
    this.clearSelection();
  }

  showAllParts() {
    if (!this.activeModelRoot) return;
    if (this.prototypeLayers) {
      Object.values(this.prototypeLayers).forEach((group) => {
        group.visible = true;
      });
    }
    this.activeModelRoot.traverse((obj) => {
      if (obj.isMesh) obj.visible = true;
    });
  }

  setExplodeFactor(factor) {
    this.explodeFactor = Math.max(0, Math.min(1, factor));
    if (!this.activeModelRoot) return;

    const maxDistance = 0.45;
    this.activeModelRoot.traverse((obj) => {
      if (obj.isMesh && obj.userData.originalPosition && obj.userData.explodeDir) {
        const offset = obj.userData.explodeDir.clone().multiplyScalar(this.explodeFactor * maxDistance);
        obj.position.copy(obj.userData.originalPosition).add(offset);
      }
    });
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
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.removeEventListener("pointerdown", this._onPointerDown);
      this.renderer.domElement.removeEventListener("pointerup", this._onPointerUp);
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
