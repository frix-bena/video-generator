/**
 * @deprecated Three3DRenderEngine has been deprecated and disabled in favor of real AI Video Diffusion (.MP4) pipeline.
 * The preview viewport now strictly mounts the HTML5 <video> player with authentic video diffusion frames.
 */
import * as THREE from 'three';
import { SceneSegment, CaptionStyle, AspectRatio, Render3DMode, CameraTrajectory } from '../types/cinegen';

export class Three3DRenderEngine {
  private containerCanvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  
  // 2D Canvas context for Broadcast Lower Thirds & Subtitles Overlay
  private overlayCanvas: HTMLCanvasElement;
  private overlayCtx: CanvasRenderingContext2D | null;

  // 3D Scene Groups & Caches
  private currentThemeKey: string = '';
  private currentSceneGroup: THREE.Group | null = null;
  private particleSystem: THREE.Points | null = null;
  private particleVelocities: Float32Array | null = null;

  // Interactive Orbit Controls state
  private isInteractiveMode: boolean = false;
  private isMouseDown: boolean = false;
  private mousePrevX: number = 0;
  private mousePrevY: number = 0;
  private orbitSpherical: THREE.Spherical = new THREE.Spherical(12, Math.PI / 3, Math.PI / 4);
  private orbitTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private onMouseDownHandler: ((e: MouseEvent) => void) | null = null;
  private onMouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private onMouseUpHandler: (() => void) | null = null;
  private onWheelHandler: ((e: WheelEvent) => void) | null = null;

  // Lighting references
  private ambientLight: THREE.AmbientLight;
  private mainDirLight: THREE.DirectionalLight;
  private pointLight1: THREE.PointLight;
  private pointLight2: THREE.PointLight;
  private hemisphereLight: THREE.HemisphereLight;

  // Shaders / Materials override cache
  private renderMode: Render3DMode = 'cinematic_pbr';
  private customUniforms: Record<string, THREE.IUniform> = {};

  constructor(canvas: HTMLCanvasElement) {
    this.containerCanvas = canvas;
    const width = canvas.width || 1280;
    const height = canvas.height || 720;

    // 1. Initialize WebGL Three.js Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.containerCanvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true, // required for captureStream & recording
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // 2. Initialize 3D Scene & Perspective Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05070f);
    this.scene.fog = new THREE.FogExp2(0x05070f, 0.025);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 4, 12);
    this.camera.lookAt(0, 0, 0);

    // 3. Setup Cinematic Lights
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    this.hemisphereLight = new THREE.HemisphereLight(0x6366f1, 0x0f172a, 0.5);
    this.scene.add(this.hemisphereLight);

    this.mainDirLight = new THREE.DirectionalLight(0xffecd2, 2.2);
    this.mainDirLight.position.set(15, 25, 15);
    this.mainDirLight.castShadow = true;
    this.mainDirLight.shadow.mapSize.width = 2048;
    this.mainDirLight.shadow.mapSize.height = 2048;
    this.mainDirLight.shadow.camera.near = 0.5;
    this.mainDirLight.shadow.camera.far = 80;
    this.mainDirLight.shadow.bias = -0.0005;
    this.scene.add(this.mainDirLight);

    this.pointLight1 = new THREE.PointLight(0xf59e0b, 3, 25);
    this.pointLight1.position.set(3, 4, 3);
    this.scene.add(this.pointLight1);

    this.pointLight2 = new THREE.PointLight(0x06b6d4, 2, 25);
    this.pointLight2.position.set(-4, 2, -3);
    this.scene.add(this.pointLight2);

    // 4. Create offscreen 2D canvas for crisp overlays & captions
    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.width = width;
    this.overlayCanvas.height = height;
    this.overlayCtx = this.overlayCanvas.getContext('2d');

    // 5. Attach event listeners for Interactive 3D Orbiting
    this.setupInteractivity();
  }

  /**
   * Enables or toggles interactive 3D Orbit inspection
   */
  public setInteractiveMode(enabled: boolean) {
    this.isInteractiveMode = enabled;
    if (enabled) {
      this.orbitSpherical.setFromVector3(this.camera.position.clone().sub(this.orbitTarget));
    }
  }

  public getInteractiveMode(): boolean {
    return this.isInteractiveMode;
  }

  public setRenderMode(mode: Render3DMode) {
    this.renderMode = mode;
    this.applyRenderModeOverride();
  }

  public getRenderMode(): Render3DMode {
    return this.renderMode;
  }

  /**
   * Main Render Call per video playback frame
   */
  public renderFrame(
    segment: SceneSegment | undefined,
    currentTimeInSegment: number,
    globalTime: number,
    options: {
      captionStyle: CaptionStyle;
      aspectRatio: AspectRatio;
      brightnessAdjustment?: number;
      showLowerThirds?: boolean;
      render3DMode?: Render3DMode;
    }
  ) {
    if (options.render3DMode && options.render3DMode !== this.renderMode) {
      this.renderMode = options.render3DMode;
      this.applyRenderModeOverride();
    }

    const width = this.containerCanvas.width;
    const height = this.containerCanvas.height;
    if (this.camera.aspect !== width / height) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height, false);
      this.overlayCanvas.width = width;
      this.overlayCanvas.height = height;
    }

    if (!segment) {
      this.renderer.clear();
      return;
    }

    const duration = segment.duration || 1;
    const progress = Math.min(Math.max(currentTimeInSegment / duration, 0), 1);

    // 1. Ensure 3D Scene is loaded and animated for current theme
    this.ensureSceneTheme(segment);
    this.animate3DScene(segment, progress, globalTime);

    // 2. Compute Cinematic 3D Camera Trajectory (unless user in interactive mode)
    if (!this.isInteractiveMode) {
      this.updateCinematicCamera(segment, progress, globalTime);
    } else {
      this.updateInteractiveCamera();
    }

    // 3. Update 3D Atmospheric Particles
    this.updateParticles(globalTime);

    // 4. Adjust dynamic lighting brightness
    const brightDelta = (options.brightnessAdjustment || 0) / 50;
    this.renderer.toneMappingExposure = 1.15 + brightDelta * 0.5;

    // 5. Render 3D WebGL Scene
    this.renderer.render(this.scene, this.camera);

    // 6. Draw 2D Overlay (Lower-thirds, Subtitles, Aspect Ratio Matte) onto top layer
    this.renderOverlays(segment, currentTimeInSegment, progress, options);
  }

  /**
   * Build or switch 3D Environment based on scene theme
   */
  private ensureSceneTheme(segment: SceneSegment) {
    const theme = segment.visualTheme || 'coffee_origin';
    const sceneKey = `${theme}_scene_${segment.index}`;

    if (this.currentThemeKey === sceneKey && this.currentSceneGroup) {
      return;
    }

    this.currentThemeKey = sceneKey;

    // Clear previous dynamic group
    if (this.currentSceneGroup) {
      this.scene.remove(this.currentSceneGroup);
      this.disposeHierarchy(this.currentSceneGroup);
      this.currentSceneGroup = null;
    }
    if (this.particleSystem) {
      this.scene.remove(this.particleSystem);
      this.particleSystem.geometry.dispose();
      (this.particleSystem.material as THREE.Material).dispose();
      this.particleSystem = null;
    }

    // Create new Scene Group
    this.currentSceneGroup = new THREE.Group();
    this.scene.add(this.currentSceneGroup);

    // Setup Lighting Environment
    this.configureLightingForTheme(theme, segment);

    // Build Realistic 3D Models
    if (theme.includes('coffee') || theme.includes('origin') || theme.includes('harvest') || theme.includes('espresso')) {
      this.build3DCoffeeScene(segment, this.currentSceneGroup);
    } else if (theme.includes('titan') || theme.includes('scifi') || theme.includes('space') || theme.includes('mars')) {
      this.build3DSpaceTitanScene(segment, this.currentSceneGroup);
    } else if (theme.includes('quantum') || theme.includes('cyber') || theme.includes('tech')) {
      this.build3DQuantumCyberScene(segment, this.currentSceneGroup);
    } else if (theme.includes('deepsea') || theme.includes('ocean') || theme.includes('abyss')) {
      this.build3DDeepSeaScene(segment, this.currentSceneGroup);
    } else if (theme.includes('city') || theme.includes('megacity') || theme.includes('tokyo')) {
      this.build3DCyberpunkCityScene(segment, this.currentSceneGroup);
    } else if (theme.includes('pyramid') || theme.includes('ancient') || theme.includes('desert') || theme.includes('history')) {
      this.build3DAncientPyramidScene(segment, this.currentSceneGroup);
    } else {
      this.build3DCustomProceduralScene(segment, this.currentSceneGroup);
    }

    // Build 3D Atmospheric Particle System
    this.build3DAtmosphericParticles(segment);

    // Apply active render mode
    this.applyRenderModeOverride();
  }

  /**
   * Configures Directional, Point, Ambient & Fog according to theme
   */
  private configureLightingForTheme(theme: string, segment: SceneSegment) {
    if (theme.includes('coffee')) {
      this.scene.background = new THREE.Color(0x0f0b08);
      this.scene.fog = new THREE.FogExp2(0x0f0b08, 0.02);
      this.ambientLight.color.setHex(0xffdfba);
      this.ambientLight.intensity = 0.8;
      this.hemisphereLight.color.setHex(0xd97706);
      this.hemisphereLight.groundColor.setHex(0x1e1b4b);
      this.mainDirLight.color.setHex(0xffedd5);
      this.mainDirLight.position.set(8, 14, 10);
      this.pointLight1.color.setHex(0xf59e0b);
      this.pointLight1.position.set(0, 3, 2);
      this.pointLight2.color.setHex(0xb45309);
      this.pointLight2.position.set(-4, 1, -2);
    } else if (theme.includes('titan') || theme.includes('scifi')) {
      this.scene.background = new THREE.Color(0x04060e);
      this.scene.fog = new THREE.FogExp2(0x08091a, 0.015);
      this.ambientLight.color.setHex(0x38bdf8);
      this.ambientLight.intensity = 0.5;
      this.hemisphereLight.color.setHex(0xf59e0b);
      this.hemisphereLight.groundColor.setHex(0x020617);
      this.mainDirLight.color.setHex(0xfef08a);
      this.mainDirLight.position.set(20, 15, 20);
      this.pointLight1.color.setHex(0x06b6d4);
      this.pointLight1.position.set(0, 5, 0);
      this.pointLight2.color.setHex(0xf97316);
      this.pointLight2.position.set(8, 2, -6);
    } else if (theme.includes('quantum') || theme.includes('tech')) {
      this.scene.background = new THREE.Color(0x02040a);
      this.scene.fog = new THREE.FogExp2(0x02040a, 0.025);
      this.ambientLight.color.setHex(0x818cf8);
      this.ambientLight.intensity = 0.6;
      this.hemisphereLight.color.setHex(0x06b6d4);
      this.hemisphereLight.groundColor.setHex(0x000000);
      this.mainDirLight.color.setHex(0xfde047);
      this.mainDirLight.position.set(5, 12, 5);
      this.pointLight1.color.setHex(0x06b6d4);
      this.pointLight1.position.set(0, 2, 0);
      this.pointLight2.color.setHex(0xa855f7);
      this.pointLight2.position.set(0, -2, 0);
    } else if (theme.includes('deepsea') || theme.includes('ocean')) {
      this.scene.background = new THREE.Color(0x010914);
      this.scene.fog = new THREE.FogExp2(0x010e24, 0.035);
      this.ambientLight.color.setHex(0x0284c7);
      this.ambientLight.intensity = 0.4;
      this.hemisphereLight.color.setHex(0x06b6d4);
      this.hemisphereLight.groundColor.setHex(0x000000);
      this.mainDirLight.color.setHex(0x38bdf8);
      this.mainDirLight.position.set(0, 20, 0);
      this.pointLight1.color.setHex(0x22d3ee);
      this.pointLight1.position.set(2, 2, 2);
      this.pointLight2.color.setHex(0xf43f5e);
      this.pointLight2.position.set(-2, 1, -2);
    } else {
      this.scene.background = new THREE.Color(0x05070e);
      this.scene.fog = new THREE.FogExp2(0x05070e, 0.02);
      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 0.7;
      this.hemisphereLight.color.setHex(0x6366f1);
      this.hemisphereLight.groundColor.setHex(0x090d16);
      this.mainDirLight.color.setHex(0xffedd5);
      this.mainDirLight.position.set(12, 18, 12);
      this.pointLight1.color.setHex(0x6366f1);
      this.pointLight1.position.set(3, 4, 3);
      this.pointLight2.color.setHex(0xf59e0b);
      this.pointLight2.position.set(-3, 2, -3);
    }
  }

  // ==========================================
  // 3D SCENE BUILDERS (Realistic Geometry & PBR)
  // ==========================================

  /**
   * 1. 3D COFFEE & GASTRONOMY DOCUMENTARY
   */
  private build3DCoffeeScene(segment: SceneSegment, group: THREE.Group) {
    const idx = segment.index;

    if (idx === 0 || idx === 5 || idx === 6) {
      // Scene A: Macro 3D Espresso Extraction & Floating Roasted Beans
      // 1. Sleek Matte Black Ceramic Plate / Table Top
      const tableGeo = new THREE.CylinderGeometry(8, 8, 0.4, 48);
      const tableMat = new THREE.MeshStandardMaterial({
        color: 0x11131a,
        roughness: 0.25,
        metalness: 0.1,
      });
      const tableMesh = new THREE.Mesh(tableGeo, tableMat);
      tableMesh.position.y = -2;
      tableMesh.receiveShadow = true;
      group.add(tableMesh);

      // 2. Artisan Glass Cup with Thick Base & Rim
      const cupGroup = new THREE.Group();
      cupGroup.name = 'hero_cup';

      // Outer Glass Body
      const cupOuterGeo = new THREE.CylinderGeometry(2.4, 1.6, 3.2, 32, 1, true);
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.9,
        opacity: 1,
        transparent: true,
        roughness: 0.05,
        ior: 1.52,
        reflectivity: 0.9,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      });
      const cupOuter = new THREE.Mesh(cupOuterGeo, glassMat);
      cupOuter.position.y = -0.4;
      cupOuter.castShadow = true;
      cupGroup.add(cupOuter);

      // Glass Base
      const baseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.4, 32);
      const cupBase = new THREE.Mesh(baseGeo, glassMat);
      cupBase.position.y = -2;
      cupGroup.add(cupBase);

      // 3. Golden Crema Liquid Layer
      const liquidGeo = new THREE.CylinderGeometry(2.2, 1.5, 2.4, 32);
      const liquidMat = new THREE.MeshStandardMaterial({
        color: 0x3d1d08,
        roughness: 0.3,
        metalness: 0.05,
      });
      const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
      liquidMesh.position.y = -0.7;
      cupGroup.add(liquidMesh);

      // Crema Top Froth Foam with Golden Swirl
      const cremaGeo = new THREE.CircleGeometry(2.18, 32);
      const cremaMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.6,
        emissive: 0x78350f,
        emissiveIntensity: 0.3,
      });
      const cremaMesh = new THREE.Mesh(cremaGeo, cremaMat);
      cremaMesh.rotation.x = -Math.PI / 2;
      cremaMesh.position.y = 0.5;
      cremaMesh.name = 'crema_surface';
      cupGroup.add(cremaMesh);

      // Pouring Stream from above
      const streamGeo = new THREE.CylinderGeometry(0.12, 0.08, 6, 16);
      const streamMat = new THREE.MeshStandardMaterial({
        color: 0x92400e,
        roughness: 0.1,
        emissive: 0xb45309,
        emissiveIntensity: 0.4,
      });
      const streamMesh = new THREE.Mesh(streamGeo, streamMat);
      streamMesh.position.set(0, 3.5, 0);
      streamMesh.name = 'pour_stream';
      cupGroup.add(streamMesh);

      group.add(cupGroup);

      // 4. Floating 3D Roasted Coffee Beans (Zero-G slow drift)
      const beansGroup = new THREE.Group();
      beansGroup.name = 'floating_beans';

      const beanGeo = new THREE.SphereGeometry(0.4, 16, 12);
      beanGeo.scale(1.4, 0.9, 0.7); // Coffee bean oval shape
      const beanMat = new THREE.MeshStandardMaterial({
        color: 0x2e1408,
        roughness: 0.35,
        metalness: 0.1,
      });

      for (let b = 0; b < 16; b++) {
        const bean = new THREE.Mesh(beanGeo, beanMat);
        const radius = 2.5 + Math.random() * 4;
        const angle = (b / 16) * Math.PI * 2 + Math.random() * 0.5;
        const y = -1 + Math.random() * 4;
        bean.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
        bean.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        bean.castShadow = true;
        bean.userData = {
          rotSpeed: { x: (Math.random() - 0.5) * 0.02, y: (Math.random() - 0.5) * 0.02, z: (Math.random() - 0.5) * 0.02 },
          floatSpeed: Math.random() * 0.02 + 0.01,
          baseY: y,
        };
        beansGroup.add(bean);
      }
      group.add(beansGroup);

    } else if (idx === 1 || idx === 4 || idx === 7) {
      // Scene B: 3D Ethiopian Highlands Mountain Plantation
      // 1. Procedural Mountain Terrain with Heightmap
      const terrainGeo = new THREE.PlaneGeometry(50, 50, 48, 48);
      const posAttr = terrainGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const z = Math.sin(x * 0.15) * 2.5 + Math.cos(y * 0.18) * 2.0 + Math.sin(x * 0.3 + y * 0.2) * 1.2;
        posAttr.setZ(i, z);
      }
      terrainGeo.computeVertexNormals();

      const terrainMat = new THREE.MeshStandardMaterial({
        color: 0x064e3b, // emerald highland foliage
        roughness: 0.85,
        flatShading: true,
      });
      const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
      terrainMesh.rotation.x = -Math.PI / 2;
      terrainMesh.position.y = -3;
      terrainMesh.receiveShadow = true;
      group.add(terrainMesh);

      // 2. Coffee Trees & Ripe Red Cherries
      const treeGroup = new THREE.Group();
      treeGroup.name = 'highland_trees';

      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
      const foliageMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.6 });
      const cherryMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.2, emissive: 0x7f1d1d, emissiveIntensity: 0.2 });

      for (let t = 0; t < 24; t++) {
        const tree = new THREE.Group();
        const tx = (Math.random() - 0.5) * 30;
        const tz = (Math.random() - 0.5) * 30;
        const ty = Math.sin(tx * 0.15) * 2.5 + Math.cos(-tz * 0.18) * 2.0 - 3;

        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, 2.5, 8);
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1.25;
        tree.add(trunk);

        // Canopy Cone Layers
        const coneGeo1 = new THREE.ConeGeometry(1.6, 2.2, 8);
        const cone1 = new THREE.Mesh(coneGeo1, foliageMat);
        cone1.position.y = 2.8;
        tree.add(cone1);

        const coneGeo2 = new THREE.ConeGeometry(1.2, 1.8, 8);
        const cone2 = new THREE.Mesh(coneGeo2, foliageMat);
        cone2.position.y = 3.8;
        tree.add(cone2);

        // Scattered Red Cherries
        for (let c = 0; c < 5; c++) {
          const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), cherryMat);
          cherry.position.set(
            (Math.random() - 0.5) * 1.5,
            2.2 + Math.random() * 1.5,
            (Math.random() - 0.5) * 1.5
          );
          tree.add(cherry);
        }

        tree.position.set(tx, ty, tz);
        treeGroup.add(tree);
      }
      group.add(treeGroup);

      // Volumetric Morning Sun disc
      const sunGeo = new THREE.SphereGeometry(4, 32, 16);
      const sunMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const sunMesh = new THREE.Mesh(sunGeo, sunMat);
      sunMesh.position.set(-25, 12, -30);
      group.add(sunMesh);

    } else {
      // Scene C: 17th Century London Penny University / Historical Tavern
      // Wooden floor & antique timber room
      const roomGeo = new THREE.BoxGeometry(24, 12, 24);
      const roomMat = new THREE.MeshStandardMaterial({
        color: 0x27170a,
        roughness: 0.8,
        side: THREE.BackSide,
      });
      const roomMesh = new THREE.Mesh(roomGeo, roomMat);
      roomMesh.position.y = 4;
      group.add(roomMesh);

      // Heavy Oak Tavern Table
      const tableGeo = new THREE.BoxGeometry(10, 0.6, 6);
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d210b, roughness: 0.7 });
      const table = new THREE.Mesh(tableGeo, woodMat);
      table.position.set(0, 0, 0);
      table.castShadow = true;
      table.receiveShadow = true;
      group.add(table);

      // Brass Oil Lantern with Glowing Flame
      const lanternGroup = new THREE.Group();
      lanternGroup.name = 'brass_lantern';

      const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.2 });
      const lanternBase = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 0.4, 16), brassMat);
      lanternBase.position.y = 0.5;
      lanternGroup.add(lanternBase);

      const glassCylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.7, 1.8, 16, 1, true),
        new THREE.MeshPhysicalMaterial({ transmission: 0.8, roughness: 0.1, transparent: true })
      );
      glassCylinder.position.y = 1.4;
      lanternGroup.add(glassCylinder);

      const flameGeo = new THREE.ConeGeometry(0.2, 0.6, 8);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.y = 1.2;
      flame.name = 'candle_flame';
      lanternGroup.add(flame);

      lanternGroup.position.set(-2, 0.3, 0);
      group.add(lanternGroup);

      // Vintage Parchment & Copper Roaster
      const roasterGeo = new THREE.CylinderGeometry(1.2, 1.4, 1.6, 24);
      const copperMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9, roughness: 0.25 });
      const roaster = new THREE.Mesh(roasterGeo, copperMat);
      roaster.position.set(2, 1.1, 0.5);
      roaster.castShadow = true;
      group.add(roaster);
    }
  }

  /**
   * 2. 3D DEEP SPACE & TITAN COLONY SCI-FI
   */
  private build3DSpaceTitanScene(segment: SceneSegment, group: THREE.Group) {
    const idx = segment.index;

    // A. Giant Saturn with Translucent Rings in upper background
    const saturnGroup = new THREE.Group();
    saturnGroup.position.set(18, 12, -25);

    const saturnSphere = new THREE.Mesh(
      new THREE.SphereGeometry(6, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0xfde68a,
        roughness: 0.7,
        metalness: 0.1,
      })
    );
    saturnGroup.add(saturnSphere);

    // Rings Geometry
    const ringGeo = new THREE.RingGeometry(8, 14, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xfcd34d,
      roughness: 0.6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const rings = new THREE.Mesh(ringGeo, ringMat);
    rings.rotation.x = Math.PI / 3;
    saturnGroup.add(rings);

    group.add(saturnGroup);

    if (idx === 0 || idx === 1) {
      // Scene A: High Orbit Interstellar Spacecraft / Descent module
      const craftGroup = new THREE.Group();
      craftGroup.name = 'hero_spaceship';

      // Main Hull
      const hullGeo = new THREE.ConeGeometry(1.8, 6, 8);
      const hullMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.85,
        roughness: 0.2,
      });
      const hull = new THREE.Mesh(hullGeo, hullMat);
      hull.rotation.x = Math.PI / 2;
      craftGroup.add(hull);

      // Solar & Radiator Panels
      const panelGeo = new THREE.BoxGeometry(8, 0.08, 2);
      const panelMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x0369a1,
        emissiveIntensity: 0.4,
      });
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.z = -1;
      craftGroup.add(panel);

      // Ion Thruster Cones with glowing cyan exhaust
      const thrusterMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
      for (let t = -1; t <= 1; t += 2) {
        const thrustCone = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.2, 12), thrusterMat);
        thrustCone.rotation.x = -Math.PI / 2;
        thrustCone.position.set(t * 0.8, 0, -3.2);
        craftGroup.add(thrustCone);
      }

      craftGroup.position.set(0, 0, 0);
      group.add(craftGroup);

    } else {
      // Scene B: Titan Surface, Methane Sea & Geodesic Habitat Dome
      // Terrain Dunes
      const terrainGeo = new THREE.PlaneGeometry(60, 60, 40, 40);
      const posAttr = terrainGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        posAttr.setZ(i, Math.sin(x * 0.1) * 2 + Math.cos(y * 0.12) * 1.5);
      }
      terrainGeo.computeVertexNormals();

      const terrainMat = new THREE.MeshStandardMaterial({
        color: 0x451a03, // dark orange/amber hydrocarbon sands
        roughness: 0.9,
        metalness: 0.1,
      });
      const terrain = new THREE.Mesh(terrainGeo, terrainMat);
      terrain.rotation.x = -Math.PI / 2;
      terrain.position.y = -3;
      group.add(terrain);

      // Liquid Methane Ocean Mirror Plane
      const seaGeo = new THREE.PlaneGeometry(60, 30);
      const seaMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.05,
        metalness: 0.9,
      });
      const sea = new THREE.Mesh(seaGeo, seaMat);
      sea.rotation.x = -Math.PI / 2;
      sea.position.set(0, -2.2, 15);
      group.add(sea);

      // Geodesic Colony Habitat Dome
      const domeGeo = new THREE.IcosahedronGeometry(5, 2);
      const domeWireMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        wireframe: true,
        emissive: 0x0891b2,
        emissiveIntensity: 0.6,
      });
      const domeWire = new THREE.Mesh(domeGeo, domeWireMat);
      domeWire.position.set(-4, 0.5, -4);
      group.add(domeWire);

      const domeGlassMat = new THREE.MeshPhysicalMaterial({
        color: 0x0891b2,
        transmission: 0.7,
        transparent: true,
        roughness: 0.1,
      });
      const domeGlass = new THREE.Mesh(domeGeo, domeGlassMat);
      domeGlass.position.set(-4, 0.5, -4);
      group.add(domeGlass);
    }
  }

  /**
   * 3. 3D QUANTUM COMPUTING & CYBERPUNK TECH
   */
  private build3DQuantumCyberScene(segment: SceneSegment, group: THREE.Group) {
    // 1. Golden Quantum Dilution Chandelier
    const chandelierGroup = new THREE.Group();
    chandelierGroup.name = 'quantum_chandelier';

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.15,
    });
    const silverMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.2,
    });

    // 5 Tiers of Golden Discs
    const tierRadii = [3.5, 2.8, 2.2, 1.6, 1.0];
    tierRadii.forEach((r, i) => {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.2, 32), goldMat);
      disc.position.y = 4 - i * 1.6;
      chandelierGroup.add(disc);

      // Connecting Coaxial Cryogenic Cables
      for (let c = 0; c < 8; c++) {
        const angle = (c / 8) * Math.PI * 2;
        const cableGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8);
        const cable = new THREE.Mesh(cableGeo, silverMat);
        cable.position.set(Math.cos(angle) * (r * 0.8), 4 - i * 1.6 - 0.8, Math.sin(angle) * (r * 0.8));
        chandelierGroup.add(cable);
      }
    });

    // Central Qubit Quantum Core (Glowing Pulsating Core)
    const coreGeo = new THREE.OctahedronGeometry(0.8, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x22d3ee,
      emissiveIntensity: 1.2,
      wireframe: false,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = -3.2;
    core.name = 'qubit_core';
    chandelierGroup.add(core);

    group.add(chandelierGroup);

    // 2. Cyberpunk Cleanroom Grid Floor
    const gridHelper = new THREE.GridHelper(30, 30, 0x06b6d4, 0x312e81);
    gridHelper.position.y = -4.5;
    group.add(gridHelper);
  }

  /**
   * 4. 3D DEEP SEA & OCEANIC ABYSS
   */
  private build3DDeepSeaScene(segment: SceneSegment, group: THREE.Group) {
    // 1. Rocky Volcanic Seabed & Hydrothermal Vents
    const seabedGeo = new THREE.PlaneGeometry(40, 40, 32, 32);
    const posAttr = seabedGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      posAttr.setZ(i, Math.sin(x * 0.2) * 1.5 + Math.cos(y * 0.25) * 1.2);
    }
    seabedGeo.computeVertexNormals();

    const seabedMat = new THREE.MeshStandardMaterial({
      color: 0x091428,
      roughness: 0.95,
      metalness: 0.1,
    });
    const seabed = new THREE.Mesh(seabedGeo, seabedMat);
    seabed.rotation.x = -Math.PI / 2;
    seabed.position.y = -4;
    group.add(seabed);

    // 2. Bioluminescent Jellyfish
    const jellyGroup = new THREE.Group();
    jellyGroup.name = 'bioluminescent_jellyfish';

    for (let j = 0; j < 5; j++) {
      const singleJelly = new THREE.Group();
      
      // Umbrella Bell
      const bellGeo = new THREE.SphereGeometry(1.2, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const bellMat = new THREE.MeshPhysicalMaterial({
        color: j % 2 === 0 ? 0x06b6d4 : 0xf43f5e,
        emissive: j % 2 === 0 ? 0x0891b2 : 0xe11d48,
        emissiveIntensity: 0.8,
        transmission: 0.8,
        transparent: true,
        roughness: 0.1,
      });
      const bell = new THREE.Mesh(bellGeo, bellMat);
      bell.rotation.x = Math.PI;
      singleJelly.add(bell);

      // Trailing Tentacles
      for (let t = 0; t < 6; t++) {
        const tentacleGeo = new THREE.CylinderGeometry(0.02, 0.01, 3, 6);
        const tentacleMat = new THREE.MeshBasicMaterial({ color: j % 2 === 0 ? 0x67e8f9 : 0xfda4af });
        const tentacle = new THREE.Mesh(tentacleGeo, tentacleMat);
        const a = (t / 6) * Math.PI * 2;
        tentacle.position.set(Math.cos(a) * 0.8, -1.5, Math.sin(a) * 0.8);
        singleJelly.add(tentacle);
      }

      const jx = (j - 2) * 4;
      const jy = (j % 3) * 2;
      const jz = ((j * 3) % 7) - 3;
      singleJelly.position.set(jx, jy, jz);
      singleJelly.userData = { baseY: jy, phase: j };
      jellyGroup.add(singleJelly);
    }
    group.add(jellyGroup);
  }

  /**
   * 5. 3D CYBERPUNK MEGACITY & AERIAL FLIGHT
   */
  private build3DCyberpunkCityScene(segment: SceneSegment, group: THREE.Group) {
    const cityGroup = new THREE.Group();
    cityGroup.name = 'cyberpunk_city';

    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.8,
    });
    const neonMats = [
      new THREE.MeshBasicMaterial({ color: 0x06b6d4 }),
      new THREE.MeshBasicMaterial({ color: 0xf43f5e }),
      new THREE.MeshBasicMaterial({ color: 0xa855f7 }),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24 }),
    ];

    // Grid of 48 Skyscrapers
    for (let bx = -4; bx <= 4; bx++) {
      for (let bz = -3; bz <= 3; bz++) {
        if (Math.abs(bx) === 0 && Math.abs(bz) <= 1) continue; // Central flight highway canyon

        const height = 6 + Math.random() * 12;
        const bWidth = 2 + Math.random() * 1.5;
        const bGeo = new THREE.BoxGeometry(bWidth, height, bWidth);
        const building = new THREE.Mesh(bGeo, buildingMat);
        building.position.set(bx * 4.5, height / 2 - 5, bz * 4.5);
        building.castShadow = true;
        cityGroup.add(building);

        // Rooftop Neon Strip / Billboard
        const neonGeo = new THREE.BoxGeometry(bWidth * 0.9, 0.3, bWidth * 0.9);
        const neon = new THREE.Mesh(neonGeo, neonMats[Math.floor(Math.random() * neonMats.length)]);
        neon.position.set(bx * 4.5, height - 4.8, bz * 4.5);
        cityGroup.add(neon);
      }
    }

    // Flying Aero-Vehicles with Light Trails
    for (let v = 0; v < 6; v++) {
      const car = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.3, 1.8),
        new THREE.MeshBasicMaterial({ color: v % 2 === 0 ? 0x38bdf8 : 0xf43f5e })
      );
      car.position.set((v % 2 === 0 ? 1 : -1) * 1.8, 1 + v * 1.2, (v * 5) % 20 - 10);
      car.name = `aerocar_${v}`;
      cityGroup.add(car);
    }

    group.add(cityGroup);
  }

  /**
   * 6. 3D ANCIENT PYRAMIDS & DESERT MONUMENTS
   */
  private build3DAncientPyramidScene(segment: SceneSegment, group: THREE.Group) {
    // 1. Vast Desert Sand Dunes
    const sandGeo = new THREE.PlaneGeometry(60, 60, 48, 48);
    const posAttr = sandGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      posAttr.setZ(i, Math.sin(x * 0.12) * 2 + Math.cos(y * 0.15) * 1.5);
    }
    sandGeo.computeVertexNormals();

    const sandMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // golden sandstone
      roughness: 0.9,
    });
    const sand = new THREE.Mesh(sandGeo, sandMat);
    sand.rotation.x = -Math.PI / 2;
    sand.position.y = -3;
    group.add(sand);

    // 2. The Great Pyramid
    const pyrGeo = new THREE.ConeGeometry(10, 10, 4);
    const pyrMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.8,
      flatShading: true,
    });
    const pyramid = new THREE.Mesh(pyrGeo, pyrMat);
    pyramid.rotation.y = Math.PI / 4;
    pyramid.position.set(0, 2, -6);
    pyramid.castShadow = true;
    group.add(pyramid);

    // Golden Pyramidion (Polished Capstone)
    const capGeo = new THREE.ConeGeometry(2, 2, 4);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.3,
    });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.rotation.y = Math.PI / 4;
    cap.position.set(0, 6, -6);
    group.add(cap);
  }

  /**
   * 7. 3D DYNAMIC PROCEDURAL SYNTHESIZER (For any arbitrary user prompt)
   */
  private build3DCustomProceduralScene(segment: SceneSegment, group: THREE.Group) {
    // Elegant Multi-Dimensional Cinematic Geometry Assembly
    const heroGroup = new THREE.Group();
    heroGroup.name = 'hero_procedural_object';

    // Outer Gyroscope Rings
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x4f46e5,
      emissiveIntensity: 0.3,
    });

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.15, 16, 64), ringMat);
    ring1.name = 'gyro_ring_1';
    heroGroup.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.12, 16, 64), ringMat);
    ring2.name = 'gyro_ring_2';
    heroGroup.add(ring2);

    // Hero Central Core
    const coreMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.8, 1),
      new THREE.MeshPhysicalMaterial({
        color: 0xa855f7,
        transmission: 0.6,
        roughness: 0.1,
        metalness: 0.2,
        clearcoat: 1.0,
      })
    );
    coreMesh.name = 'hero_core';
    heroGroup.add(coreMesh);

    group.add(heroGroup);

    // Dynamic Floating Data Monoliths
    for (let m = 0; m < 8; m++) {
      const angle = (m / 8) * Math.PI * 2;
      const monolith = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 3.5, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.8, roughness: 0.2 })
      );
      monolith.position.set(Math.cos(angle) * 7, 0, Math.sin(angle) * 7);
      monolith.lookAt(0, 0, 0);
      group.add(monolith);
    }
  }

  /**
   * Builds 3D Volumetric / Particle Atmosphere in Three.js
   */
  private build3DAtmosphericParticles(segment: SceneSegment) {
    const pConfig = segment.particles3D || { type: 'dust', count: 400, color: '#f59e0b', speed: 1, size: 0.08 };
    const count = pConfig.count || 400;

    const positions = new Float32Array(count * 3);
    this.particleVelocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;

      this.particleVelocities[i * 3] = (Math.random() - 0.5) * 0.02 * pConfig.speed;
      this.particleVelocities[i * 3 + 1] = (Math.random() * 0.03 + 0.01) * pConfig.speed;
      this.particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02 * pConfig.speed;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const pColor = new THREE.Color(pConfig.color || 0xffeedd);
    const mat = new THREE.PointsMaterial({
      color: pColor,
      size: pConfig.size || 0.12,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    this.particleSystem = new THREE.Points(geo, mat);
    this.scene.add(this.particleSystem);
  }

  /**
   * Realtime 3D Scene Animation updates (Beans spinning, steam rising, fluid ripples)
   */
  private animate3DScene(segment: SceneSegment, progress: number, globalTime: number) {
    if (!this.currentSceneGroup) return;

    // 1. Floating Coffee Beans Rotation & Bobbing
    const beans = this.currentSceneGroup.getObjectByName('floating_beans');
    if (beans) {
      beans.children.forEach((bean) => {
        const u = bean.userData;
        if (u.rotSpeed) {
          bean.rotation.x += u.rotSpeed.x;
          bean.rotation.y += u.rotSpeed.y;
          bean.rotation.z += u.rotSpeed.z;
        }
        bean.position.y = u.baseY + Math.sin(globalTime * 2 + bean.position.x) * 0.3;
      });
    }

    // 2. Quantum Qubit Core Pulsing & Chandelier Gyro
    const qubitCore = this.currentSceneGroup.getObjectByName('qubit_core');
    if (qubitCore) {
      qubitCore.rotation.x += 0.02;
      qubitCore.rotation.y += 0.03;
      const s = 1 + Math.sin(globalTime * 4) * 0.15;
      qubitCore.scale.set(s, s, s);
    }

    // 3. Bioluminescent Jellyfish Pulsing & Swimming
    const jellyfish = this.currentSceneGroup.getObjectByName('bioluminescent_jellyfish');
    if (jellyfish) {
      jellyfish.children.forEach((jelly) => {
        const u = jelly.userData;
        const pulse = Math.sin(globalTime * 3 + u.phase);
        jelly.scale.set(1 + pulse * 0.1, 1 - pulse * 0.1, 1 + pulse * 0.1);
        jelly.position.y = u.baseY + Math.sin(globalTime * 1.2 + u.phase) * 0.6;
      });
    }

    // 4. Procedural Gyroscope Rings
    const r1 = this.currentSceneGroup.getObjectByName('gyro_ring_1');
    const r2 = this.currentSceneGroup.getObjectByName('gyro_ring_2');
    if (r1) r1.rotation.x = globalTime * 0.6;
    if (r2) r2.rotation.y = globalTime * 0.8;

    // 5. Hero Spacecraft gentle banking
    const craft = this.currentSceneGroup.getObjectByName('hero_spaceship');
    if (craft) {
      craft.position.y = Math.sin(globalTime * 1.5) * 0.3;
      craft.rotation.z = Math.sin(globalTime * 0.8) * 0.15;
    }
  }

  /**
   * Updates 3D Particles in Three.js
   */
  private updateParticles(globalTime: number) {
    if (!this.particleSystem || !this.particleVelocities) return;

    const posAttr = this.particleSystem.geometry.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;
    const count = array.length / 3;

    for (let i = 0; i < count; i++) {
      array[i * 3] += this.particleVelocities[i * 3];
      array[i * 3 + 1] += this.particleVelocities[i * 3 + 1];
      array[i * 3 + 2] += this.particleVelocities[i * 3 + 2];

      // Wrap around bounds
      if (array[i * 3 + 1] > 12) array[i * 3 + 1] = -8;
      if (array[i * 3] > 16) array[i * 3] = -16;
      if (array[i * 3] < -16) array[i * 3] = 16;
      if (array[i * 3 + 2] > 16) array[i * 3 + 2] = -16;
      if (array[i * 3 + 2] < -16) array[i * 3 + 2] = 16;
    }

    posAttr.needsUpdate = true;
  }

  /**
   * Smooth Cinematic 3D Camera Path Interpolation
   */
  private updateCinematicCamera(segment: SceneSegment, progress: number, globalTime: number) {
    const trajectory: CameraTrajectory = segment.camera3D?.trajectory || 
      (segment.cameraMovement.toLowerCase().includes('orbit') ? 'orbit_360' :
       segment.cameraMovement.toLowerCase().includes('drone') || segment.cameraMovement.toLowerCase().includes('aerial') ? 'drone_flyover' :
       segment.cameraMovement.toLowerCase().includes('crane') ? 'crane_rise' :
       'macro_push');

    const smoothProgress = progress * progress * (3 - 2 * progress); // smoothstep ease-in-out

    if (trajectory === 'orbit_360') {
      const radius = 8.5 - progress * 1.5;
      const angle = progress * Math.PI * 0.8 + 0.2;
      const height = 3.5 + Math.sin(progress * Math.PI) * 1.5;
      this.camera.position.set(Math.sin(angle) * radius, height, Math.cos(angle) * radius);
      this.camera.lookAt(0, 0.2, 0);

    } else if (trajectory === 'macro_push') {
      // Smooth close-up dolly push
      const startDist = 9.0;
      const endDist = 3.8;
      const currentDist = startDist - smoothProgress * (startDist - endDist);
      const angle = 0.4 + smoothProgress * 0.3;
      this.camera.position.set(Math.sin(angle) * currentDist, 2.2 - smoothProgress * 0.8, Math.cos(angle) * currentDist);
      this.camera.lookAt(0, -0.2, 0);

    } else if (trajectory === 'drone_flyover') {
      const forwardZ = 16 - progress * 24;
      const altY = 7.5 - Math.sin(progress * Math.PI) * 2;
      this.camera.position.set(Math.sin(progress * 2) * 3, altY, forwardZ);
      this.camera.lookAt(0, 0, forwardZ - 10);

    } else if (trajectory === 'crane_rise') {
      const startY = 0.5;
      const endY = 9.0;
      const curY = startY + smoothProgress * (endY - startY);
      this.camera.position.set(6, curY, 10 - smoothProgress * 2);
      this.camera.lookAt(0, 1, 0);

    } else {
      // Dutch Pan / Cinematic Dolly
      const curX = -8 + smoothProgress * 16;
      this.camera.position.set(curX, 3.5, 9);
      this.camera.lookAt(curX * 0.3, 0, 0);
    }
  }

  /**
   * Applies Render Mode override (PBR vs Wireframe vs Depth Map vs Clay)
   */
  private applyRenderModeOverride() {
    if (!this.currentSceneGroup) return;

    this.currentSceneGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (this.renderMode === 'wireframe') {
          child.material.wireframe = true;
        } else if (this.renderMode === 'clay_model') {
          child.material.wireframe = false;
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.setHex(0xe2e8f0);
            child.material.roughness = 0.9;
            child.material.metalness = 0.0;
          }
        } else {
          child.material.wireframe = false;
        }
      }
    });
  }

  // ==========================================
  // INTERACTIVE 3D ORBIT & INSPECTOR CONTROLS
  // ==========================================

  private setupInteractivity() {
    const canvas = this.containerCanvas;

    this.onMouseDownHandler = (e: MouseEvent) => {
      if (!this.isInteractiveMode) return;
      this.isMouseDown = true;
      this.mousePrevX = e.clientX;
      this.mousePrevY = e.clientY;
    };

    this.onMouseMoveHandler = (e: MouseEvent) => {
      if (!this.isInteractiveMode || !this.isMouseDown) return;
      const deltaX = e.clientX - this.mousePrevX;
      const deltaY = e.clientY - this.mousePrevY;
      this.mousePrevX = e.clientX;
      this.mousePrevY = e.clientY;

      this.orbitSpherical.theta -= deltaX * 0.006;
      this.orbitSpherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.orbitSpherical.phi - deltaY * 0.006));
    };

    this.onMouseUpHandler = () => {
      this.isMouseDown = false;
    };

    this.onWheelHandler = (e: WheelEvent) => {
      if (!this.isInteractiveMode) return;
      e.preventDefault();
      this.orbitSpherical.radius = Math.max(2, Math.min(40, this.orbitSpherical.radius + e.deltaY * 0.015));
    };

    canvas.addEventListener('mousedown', this.onMouseDownHandler);
    window.addEventListener('mousemove', this.onMouseMoveHandler);
    window.addEventListener('mouseup', this.onMouseUpHandler);
    canvas.addEventListener('wheel', this.onWheelHandler, { passive: false });
  }

  private updateInteractiveCamera() {
    const offset = new THREE.Vector3().setFromSpherical(this.orbitSpherical);
    this.camera.position.copy(this.orbitTarget).add(offset);
    this.camera.lookAt(this.orbitTarget);
  }

  // ==========================================
  // 2D OVERLAYS (Broadcast Lower-Thirds & Captions)
  // ==========================================

  private renderOverlays(
    segment: SceneSegment,
    currentTimeInSegment: number,
    progress: number,
    options: {
      captionStyle: CaptionStyle;
      aspectRatio: AspectRatio;
      showLowerThirds?: boolean;
    }
  ) {
    const ctx = this.overlayCtx;
    if (!ctx) return;

    const width = this.overlayCanvas.width;
    const height = this.overlayCanvas.height;

    // Clear 2D buffer
    ctx.clearRect(0, 0, width, height);

    // 1. Film Vignette & Anamorphic Edge Glow
    this.drawCinematicVignette(ctx, width, height);

    // 2. Broadcast Lower-Third Overlay (1.5s to 9.5s)
    if (options.showLowerThirds !== false && currentTimeInSegment >= 1.5 && currentTimeInSegment <= 9.5 && segment.lowerThirdText) {
      this.drawLowerThird(ctx, segment.lowerThirdText, segment.title, currentTimeInSegment - 1.5, width, height);
    }

    // 3. Captions & Subtitles
    if (options.captionStyle !== 'off') {
      this.drawCaptions(ctx, segment.narration, progress, options.captionStyle, width, height);
    }

    // 4. Aspect Ratio Pillarbox / Letterbox
    this.drawAspectGuides(ctx, options.aspectRatio, width, height);
  }

  private drawCinematicVignette(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    const vignette = ctx.createRadialGradient(
      width / 2, height / 2, width * 0.35,
      width / 2, height / 2, width * 0.75
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  private drawLowerThird(
    ctx: CanvasRenderingContext2D,
    text: string,
    title: string,
    elapsed: number,
    width: number,
    height: number
  ) {
    ctx.save();
    const alpha = Math.min(elapsed / 0.6, 1);
    const slide = Math.min(elapsed / 0.8, 1);
    const xPos = 40 * slide;
    const yPos = height - 130;

    ctx.globalAlpha = alpha;

    // Glass pill background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.roundRect(xPos, yPos, 480, 68, 12);
    ctx.fill();
    ctx.stroke();

    // Accent line
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.roundRect(xPos, yPos, 6, 68, [12, 0, 0, 12]);
    ctx.fill();

    // Text labels
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 15px "Outfit", sans-serif';
    ctx.fillText(title.toUpperCase(), xPos + 22, yPos + 26);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText(text, xPos + 22, yPos + 48);

    ctx.restore();
  }

  private drawCaptions(
    ctx: CanvasRenderingContext2D,
    narration: string,
    progress: number,
    style: CaptionStyle,
    width: number,
    height: number
  ) {
    ctx.save();
    const words = narration.split(' ');
    if (words.length === 0) return;

    const activeIndex = Math.min(Math.floor(progress * words.length), words.length - 1);
    const chunkWindow = 7;
    const startIdx = Math.max(0, Math.floor(activeIndex / chunkWindow) * chunkWindow);
    const visibleWords = words.slice(startIdx, startIdx + chunkWindow);
    const captionY = height - 70;

    if (style === 'mrbeast') {
      ctx.font = '900 26px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      const phrase = visibleWords.join(' ');
      let totalWidth = ctx.measureText(phrase).width;
      let startX = (width - totalWidth) / 2;

      visibleWords.forEach((w, i) => {
        const globalWordIdx = startIdx + i;
        const isActive = globalWordIdx === activeIndex;
        const wWidth = ctx.measureText(w + ' ').width;

        ctx.fillStyle = isActive ? '#fbbf24' : '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.strokeText(w, startX + wWidth / 2, captionY);
        ctx.fillText(w, startX + wWidth / 2, captionY);

        startX += wWidth;
      });
    } else if (style === 'documentary') {
      ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      const phrase = visibleWords.join(' ');
      const textWidth = ctx.measureText(phrase).width;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.roundRect((width - textWidth - 36) / 2, captionY - 26, textWidth + 36, 38, 8);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.fillText(phrase, width / 2, captionY);
    } else if (style === 'neon') {
      ctx.font = '700 22px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      const phrase = visibleWords.join(' ');
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#22d3ee';
      ctx.fillText(phrase, width / 2, captionY);
    } else if (style === 'netflix') {
      ctx.font = '600 21px "Inter", sans-serif';
      ctx.textAlign = 'center';
      const phrase = visibleWords.join(' ');
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.fillStyle = '#fbbf24';
      ctx.strokeText(phrase, width / 2, captionY);
      ctx.fillText(phrase, width / 2, captionY);
    }

    ctx.restore();
  }

  private drawAspectGuides(ctx: CanvasRenderingContext2D, aspectRatio: AspectRatio, width: number, height: number) {
    if (aspectRatio === '16:9') return;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';

    if (aspectRatio === '9:16') {
      const targetWidth = height * (9 / 16);
      const sideMargin = (width - targetWidth) / 2;
      ctx.fillRect(0, 0, sideMargin, height);
      ctx.fillRect(width - sideMargin, 0, sideMargin, height);
    } else if (aspectRatio === '1:1') {
      const sideMargin = (width - height) / 2;
      ctx.fillRect(0, 0, sideMargin, height);
      ctx.fillRect(width - sideMargin, 0, sideMargin, height);
    }
    ctx.restore();
  }

  private disposeHierarchy(obj: THREE.Object3D) {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }

  public dispose() {
    try {
      if (this.onMouseDownHandler) {
        this.containerCanvas.removeEventListener('mousedown', this.onMouseDownHandler);
      }
      if (this.onMouseMoveHandler) {
        window.removeEventListener('mousemove', this.onMouseMoveHandler);
      }
      if (this.onMouseUpHandler) {
        window.removeEventListener('mouseup', this.onMouseUpHandler);
      }
      if (this.onWheelHandler) {
        this.containerCanvas.removeEventListener('wheel', this.onWheelHandler);
      }

      if (this.currentSceneGroup) {
        this.disposeHierarchy(this.currentSceneGroup);
        this.scene.remove(this.currentSceneGroup);
        this.currentSceneGroup = null;
      }

      if (this.particleSystem) {
        this.particleSystem.geometry.dispose();
        if (Array.isArray(this.particleSystem.material)) {
          this.particleSystem.material.forEach((m) => m.dispose());
        } else {
          (this.particleSystem.material as THREE.Material).dispose();
        }
        this.scene.remove(this.particleSystem);
        this.particleSystem = null;
      }

      this.renderer.dispose();
    } catch (err) {
      console.warn('[Three3DRenderEngine] Error during dispose:', err);
    }
  }
}
