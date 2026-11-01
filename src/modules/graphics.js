/**
 * @file graphics.js
 * 3D Rendering pipeline for Vibe Gaming Platform.
 * Renders assets/models/crystal 3d model.glb via Three.js with smooth floating,
 * dynamic glowing lights, interactive camera parallax, and an ambient canvas fallback.
 * Supports direct binary buffer parsing to ensure zero CORS errors on file:/// and http://.
 */

(function(global) {
  "use strict";

  const Constants = global.VibeConstants || {};
  const MODEL_PATH = Constants.MODEL_PATH || "assets/models/crystal 3d model.glb";

  class GraphicsPipeline {
    constructor(containerId = "hero-3d-canvas") {
      this.containerId = containerId;
      this.container = typeof containerId === "string"
        ? document.getElementById(containerId)
        : containerId;
      this.modelPath = MODEL_PATH;
      this.isSupported = this.checkWebGLSupport();
      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.model = null;
      this.particles = null;
      this.clock = null;
      this.animationFrameId = null;
      this.targetMouse = { x: 0, y: 0 };
      this.currentMouse = { x: 0, y: 0 };
      this.handleResize = this.onWindowResize.bind(this);
      this.handlePointerMove = this.onPointerMove.bind(this);
    }

    checkWebGLSupport() {
      try {
        const canvas = document.createElement("canvas");
        return Boolean(
          window.WebGLRenderingContext &&
          (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
        );
      } catch {
        return false;
      }
    }

    base64ToArrayBuffer(base64) {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    }

    async init() {
      if (!this.container) {
        this.container = document.getElementById(this.containerId);
      }
      if (!this.container) return false;

      // Check for Three.js availability
      if (this.isSupported && window.THREE) {
        try {
          await this.initThreeScene();
          return true;
        } catch (err) {
          console.warn("[GraphicsPipeline] Three.js init failed, activating canvas fallback:", err);
          this.initCanvasFallback();
          return true;
        }
      }

      this.initCanvasFallback();
      return true;
    }

    async initThreeScene() {
      const THREE = window.THREE;
      this.clock = new THREE.Clock();

      const width = this.container.clientWidth || 400;
      const height = this.container.clientHeight || 420;

      // 1. Scene
      this.scene = new THREE.Scene();

      // 2. Camera
      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      this.camera.position.set(0, 0, 4.6);

      // 3. Renderer with Antialiasing, Alpha transparency, and color management
      this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      if (this.renderer.outputEncoding !== undefined) {
        this.renderer.outputEncoding = THREE.sRGBEncoding;
      }
      this.renderer.domElement.className = "three-hero-canvas";
      this.renderer.domElement.setAttribute("aria-hidden", "true");
      this.container.innerHTML = "";
      this.container.appendChild(this.renderer.domElement);

      // 4. Studio Lighting & Crystalline Glow Accents
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
      this.scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 1.8);
      mainLight.position.set(4, 7, 5);
      this.scene.add(mainLight);

      const rimLight = new THREE.DirectionalLight(0xa582ff, 1.5);
      rimLight.position.set(-4, -2, -3);
      this.scene.add(rimLight);

      // Glowing point accents (cyan and violet/magenta highlights)
      const cyanGlow = new THREE.PointLight(0x00d2d3, 3.2, 10);
      cyanGlow.position.set(2.8, 2.2, 2.5);
      this.scene.add(cyanGlow);

      const purpleGlow = new THREE.PointLight(0x8e44ad, 3.5, 12);
      purpleGlow.position.set(-2.8, -1.2, 2.5);
      this.scene.add(purpleGlow);

      const topGlow = new THREE.PointLight(0xfeca57, 2.0, 8);
      topGlow.position.set(0, 3.2, 1);
      this.scene.add(topGlow);

      // 5. Floating Stardust Particles
      this.initParticleDust(THREE);

      // 6. Load crystal 3d model.glb (direct buffer or URL fetch)
      await this.loadCrystalModel(THREE);

      // 7. Event Listeners for parallax & resize
      window.addEventListener("resize", this.handleResize);
      window.addEventListener("pointermove", this.handlePointerMove, { passive: true });

      // 8. Start Animation Loop
      this.animate();
    }

    loadCrystalModel(THREE) {
      return new Promise((resolve) => {
        if (!THREE.GLTFLoader) {
          console.warn("[GraphicsPipeline] GLTFLoader not present, rendering procedural crystal");
          this.createProceduralCrystal(THREE);
          resolve();
          return;
        }

        const loader = new THREE.GLTFLoader();

        const onModelSuccess = (gltf) => {
          const root = gltf.scene || gltf.scenes[0];
          const box = new THREE.Box3().setFromObject(root);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());

          // Scale and center the model
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const targetScale = 2.65 / maxDim;
          root.scale.setScalar(targetScale);
          root.position.x = -center.x * targetScale;
          root.position.y = -center.y * targetScale;
          root.position.z = -center.z * targetScale;

          // Preserve authentic crystal textures with enhanced crystalline shine
          root.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.roughness = 0.16;
                child.material.metalness = 0.18;
                if (child.material.color) {
                  child.material.color.setHex(0xffffff);
                }
              }
            }
          });

          this.model = new THREE.Group();
          this.model.add(root);
          this.scene.add(this.model);
          resolve();
        };

        // Method 1: Instant parsing via embedded model data (Guarantees zero CORS errors on file:///)
        if (global.VIBE_CRYSTAL_MODEL_BASE64) {
          try {
            const buffer = this.base64ToArrayBuffer(global.VIBE_CRYSTAL_MODEL_BASE64);
            loader.parse(
              buffer,
              "",
              (gltf) => onModelSuccess(gltf),
              (parseErr) => {
                console.warn("[GraphicsPipeline] Buffer parse failed, trying URL:", parseErr);
                this.loadFromUrl(loader, onModelSuccess, resolve);
              }
            );
            return;
          } catch (b64Err) {
            console.warn("[GraphicsPipeline] Base64 decoding failed:", b64Err);
          }
        }

        // Method 2: Standard URL fetch (for web servers)
        this.loadFromUrl(loader, onModelSuccess, resolve);
      });
    }

    loadFromUrl(loader, onSuccess, resolve) {
      loader.load(
        encodeURI(this.modelPath),
        (gltf) => onSuccess(gltf),
        undefined,
        (error) => {
          console.warn("[GraphicsPipeline] GLTF URL load failed:", error);
          this.createProceduralCrystal(window.THREE);
          resolve();
        }
      );
    }

    createProceduralCrystal(THREE) {
      const geom = new THREE.OctahedronGeometry(1.3, 0);
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0x8a55ff,
        emissive: 0x2e146e,
        emissiveIntensity: 0.5,
        roughness: 0.1,
        metalness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        transmission: 0.7,
        opacity: 0.95,
        transparent: true,
        reflectivity: 0.95
      });
      this.model = new THREE.Mesh(geom, mat);
      this.scene.add(this.model);
    }

    initParticleDust(THREE) {
      const particleCount = 80;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 8;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      const pMaterial = new THREE.PointsMaterial({
        color: 0xd6c7ff,
        size: 0.06,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
      });

      this.particles = new THREE.Points(geometry, pMaterial);
      this.scene.add(this.particles);
    }

    onPointerMove(event) {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      this.targetMouse.x = x * 0.4;
      this.targetMouse.y = y * 0.3;
    }

    onWindowResize() {
      if (!this.container || !this.renderer || !this.camera) return;
      const width = this.container.clientWidth || 300;
      const height = this.container.clientHeight || 300;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }

    animate() {
      if (!this.renderer || !this.scene || !this.camera) return;
      this.animationFrameId = requestAnimationFrame(() => this.animate());

      const elapsed = this.clock ? this.clock.getElapsedTime() : Date.now() * 0.001;

      // 1. Smooth Camera Parallax (damping)
      this.currentMouse.x += (this.targetMouse.x - this.currentMouse.x) * 0.05;
      this.currentMouse.y += (this.targetMouse.y - this.currentMouse.y) * 0.05;
      this.camera.position.x = this.currentMouse.x;
      this.camera.position.y = this.currentMouse.y;
      this.camera.lookAt(0, 0, 0);

      // 2. Multi-axis Floating Crystal Animation
      if (this.model) {
        this.model.position.y = Math.sin(elapsed * 1.5) * 0.12;
        this.model.rotation.y += 0.008;
        this.model.rotation.x = Math.sin(elapsed * 0.75) * 0.08;
        this.model.rotation.z = Math.cos(elapsed * 1.05) * 0.04;
      }

      // 3. Floating particle motion
      if (this.particles) {
        this.particles.rotation.y = elapsed * 0.025;
        this.particles.rotation.x = elapsed * 0.012;
      }

      this.renderer.render(this.scene, this.camera);
    }

    initCanvasFallback() {
      if (!this.container) return;
      this.container.innerHTML = "";
      const canvas = document.createElement("canvas");
      canvas.className = "graphics-fallback-canvas";
      canvas.setAttribute("aria-hidden", "true");
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.display = "block";
      this.container.appendChild(canvas);

      const ctx = canvas.getContext("2d");
      let animationFrame;

      const renderFallback = () => {
        const w = (canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1));
        const h = (canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1));
        const time = Date.now() * 0.0015;

        ctx.clearRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2 + Math.sin(time * 2) * (h * 0.04);
        const radius = Math.min(w, h) * 0.28;

        const glow = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius * 1.8);
        glow.addColorStop(0, "rgba(164, 115, 255, 0.45)");
        glow.addColorStop(0.5, "rgba(99, 56, 219, 0.2)");
        glow.addColorStop(1, "rgba(22, 16, 60, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(time * 0.4);

        const vertices = 8;
        ctx.beginPath();
        for (let i = 0; i < vertices; i++) {
          const angle = (i / vertices) * Math.PI * 2;
          const r = radius * (i % 2 === 0 ? 1 : 0.65);
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();

        const grad = ctx.createLinearGradient(-radius, -radius, radius, radius);
        grad.addColorStop(0, "#c48bff");
        grad.addColorStop(0.5, "#784af2");
        grad.addColorStop(1, "#361b78");
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.lineWidth = 3;
        ctx.strokeStyle = "#eedcff";
        ctx.stroke();

        ctx.restore();

        animationFrame = requestAnimationFrame(renderFallback);
      };

      renderFallback();
      this.animationFrameId = animationFrame;
    }

    destroy() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      window.removeEventListener("resize", this.handleResize);
      window.removeEventListener("pointermove", this.handlePointerMove);
      if (this.renderer && this.renderer.domElement) {
        this.renderer.domElement.remove();
      }
    }
  }

  const VibeGraphics = { GraphicsPipeline };
  global.VibeGraphics = VibeGraphics;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = VibeGraphics;
  }
})(typeof window !== "undefined" ? window : globalThis);
