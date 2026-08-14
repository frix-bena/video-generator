import { Project, SceneSegment, CameraTrajectory, VideoVariation, AspectRatio } from '../types/cinegen';
import { COFFEE_PROJECT } from '../data/defaultProjects';
import { CoverPageService } from './coverPageService';

export interface GenerationProgress {
  stage: 'script' | 'storyboard' | 'generating' | 'variety' | 'done';
  percent: number;
  message: string;
  currentScene?: number;
  totalScenes?: number;
}

export class AiGeneratorService {
  /**
   * Intelligently expands and enriches user prompts with cinematic 3D cues
   */
  static enhancePrompt(rawPrompt: string): string {
    const p = rawPrompt.trim();
    if (!p) return 'Make an epic cinematic 3D documentary with macro PBR textures, atmospheric volumetric lighting, and dramatic camera trajectories.';

    const enhancements = [
      'shot on 35mm anamorphic prime lenses with cinematic depth of field',
      'photorealistic PBR materials with dynamic volumetric atmospheric lighting',
      'sweeping 3D spline camera trajectories from macro close-ups to aerial drone pans',
      'synchronized broadcast narration, immersive soundscapes, and color-graded broadcast master',
    ];

    if (p.toLowerCase().includes('3d') || p.toLowerCase().includes('cinematic')) {
      return `${p}, photorealistic AI video diffusion, dynamic cinematic camera motion, broadcast-grade color LUTs`;
    }

    return `Produce an epic realistic cinematic video about ${p}, ${enhancements.join(', ')}`;
  }

  /**
   * Generates a variety of 4 distinct candidate video directions from a single prompt
   */
  static async generateVideoVariations(
    prompt: string,
    options: { duration: number; aspectRatio: AspectRatio; is3D?: boolean },
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<{ variations: VideoVariation[]; selectedProject: Project }> {
    // Progress notification
    onProgress?.({
      stage: 'variety',
      percent: 20,
      message: 'Deconstructing prompt into 4 distinct directorial aesthetic treatments...',
    });
    await new Promise((r) => setTimeout(r, 450));

    onProgress?.({
      stage: 'variety',
      percent: 50,
      message: 'Synthesizing candidate 3D camera trajectories, lighting shaders, and color palettes...',
    });
    await new Promise((r) => setTimeout(r, 550));

    onProgress?.({
      stage: 'variety',
      percent: 85,
      message: 'Compiling high-definition candidate video previews & voice sync tracks...',
    });
    await new Promise((r) => setTimeout(r, 450));

    // Base project derived from prompt
    const baseProject = await this.generateProjectFromPrompt(prompt, () => {});
    baseProject.targetDurationSec = options.duration;
    baseProject.aspectRatio = options.aspectRatio;
    baseProject.is3D = options.is3D !== false;

    // Variation 1: Director's Cinematic Masterpiece (Epic / Anamorphic / Golden Hour)
    const var1Project: Project = {
      ...baseProject,
      id: `var-cinematic-${Date.now()}`,
      title: `${baseProject.title} [Director's Cut]`,
      tone: 'Cinematic 3D Blockbuster • Majestic, Epic, Anamorphic Primes',
      colorGrade: 'Kodak 2383 Golden Amber & Deep Contrast LUT',
      musicStyle: 'Hans Zimmer Style Hybrid Orchestral & Deep Brass',
      captionStyle: 'documentary',
      selectedVoiceId: 'voice-attenborough',
      render3DMode: 'cinematic_pbr',
      segments: baseProject.segments.map((s, i) => ({
        ...s,
        camera3D: {
          trajectory: (i % 2 === 0 ? 'orbit_360' : 'crane_rise') as CameraTrajectory,
          fov: 42,
          startPos: [8, 4, 8],
          endPos: [-8, 4, 8],
          lookAt: [0, 0, 0],
          lensPreset: '50mm Anamorphic Prime f/1.2',
        },
        lighting3D: {
          environment: 'golden_hour',
          keyLightColor: '#fde047',
          fillLightColor: '#78350f',
          rimLightColor: '#38bdf8',
          ambientIntensity: 0.75,
          directionalIntensity: 2.5,
          volumetricFog: true,
          fogColor: '#1a0d05',
          fogDensity: 0.015,
        },
        particles3D: {
          type: 'dust',
          count: 500,
          color: '#fef08a',
          speed: 0.7,
          size: 0.1,
        },
      })),
    };

    // Variation 2: Dynamic Cyberpunk Velocity (High-Speed / Neon / Synth)
    const var2Project: Project = {
      ...baseProject,
      id: `var-cyberpunk-${Date.now()}`,
      title: `${baseProject.title} [Cyberpunk Velocity Cut]`,
      tone: 'High-Energy Futuristic • Dynamic Drone Sweep, Neon Glow',
      colorGrade: 'Blade Runner Neon Cyan & Hot Magenta LUT',
      musicStyle: 'Synthwave Electronic Pulse with Heavy Bass Drops',
      captionStyle: 'neon',
      selectedVoiceId: 'voice-kenji',
      render3DMode: 'cinematic_pbr',
      segments: baseProject.segments.map((s, i) => ({
        ...s,
        camera3D: {
          trajectory: (i % 2 === 0 ? 'drone_flyover' : 'fpv_flythrough') as CameraTrajectory,
          fov: 58,
          startPos: [0, 6, 14],
          endPos: [0, 2, -12],
          lookAt: [0, 0, -20],
          lensPreset: '24mm Ultra-Wide Cine f/1.8',
        },
        lighting3D: {
          environment: 'cyberpunk_neon',
          keyLightColor: '#06b6d4',
          fillLightColor: '#f43f5e',
          rimLightColor: '#a855f7',
          ambientIntensity: 0.8,
          directionalIntensity: 2.4,
          volumetricFog: true,
          fogColor: '#0a0518',
          fogDensity: 0.022,
        },
        particles3D: {
          type: 'stardust',
          count: 600,
          color: '#38bdf8',
          speed: 1.6,
          size: 0.12,
        },
      })),
    };

    // Variation 3: Atmospheric NatGeo Poetic (Naturalistic / Macro / Contemplative)
    const var3Project: Project = {
      ...baseProject,
      id: `var-natgeo-${Date.now()}`,
      title: `${baseProject.title} [Atmospheric NatGeo Cut]`,
      tone: 'Poetic Documentary • Organic Lighting, Intimate Macro Detail',
      colorGrade: 'Naturalistic 35mm Film Stock & Soft Organic Shadows',
      musicStyle: 'Acoustic Guitar & Warm Ambient Strings',
      captionStyle: 'documentary',
      selectedVoiceId: 'voice-elena',
      render3DMode: 'cinematic_pbr',
      segments: baseProject.segments.map((s, i) => ({
        ...s,
        camera3D: {
          trajectory: (i % 2 === 0 ? 'macro_push' : 'dutch_pan') as CameraTrajectory,
          fov: 38,
          startPos: [0, 3, 9],
          endPos: [0, 0.8, 3.8],
          lookAt: [0, 0, 0],
          lensPreset: '85mm Macro Portrait f/1.4',
        },
        lighting3D: {
          environment: 'highland_mist',
          keyLightColor: '#ffffff',
          fillLightColor: '#334155',
          rimLightColor: '#fde047',
          ambientIntensity: 0.65,
          directionalIntensity: 1.9,
          volumetricFog: true,
          fogColor: '#0f172a',
          fogDensity: 0.025,
        },
        particles3D: {
          type: 'steam',
          count: 450,
          color: '#e2e8f0',
          speed: 0.5,
          size: 0.14,
        },
      })),
    };

    // Variation 4: Modern Minimalist Tech Explainer (Kinetic / Bold / Wireframe-Hybrid)
    const var4Project: Project = {
      ...baseProject,
      id: `var-tech-${Date.now()}`,
      title: `${baseProject.title} [Modern Tech Explainer]`,
      tone: 'Clean Modern Explainer • Crisp Geometry, Bold Kinetic Pacing',
      colorGrade: 'Cobalt Studio Cleanroom & Radiant Hologram Accents',
      musicStyle: 'Minimalist Upbeat Lo-Fi Tech Groove',
      captionStyle: 'mrbeast',
      selectedVoiceId: 'voice-maya',
      render3DMode: 'cinematic_pbr',
      segments: baseProject.segments.map((s, i) => ({
        ...s,
        camera3D: {
          trajectory: (i % 2 === 0 ? 'spiral_reveal' : 'cinematic_dolly') as CameraTrajectory,
          fov: 46,
          startPos: [5, 4, 7],
          endPos: [-5, 2, 7],
          lookAt: [0, 0, 0],
          lensPreset: '35mm Studio Prime f/2.0',
        },
        lighting3D: {
          environment: 'studio_softbox',
          keyLightColor: '#38bdf8',
          fillLightColor: '#1e293b',
          rimLightColor: '#fbbf24',
          ambientIntensity: 0.9,
          directionalIntensity: 2.0,
          volumetricFog: true,
          fogColor: '#040814',
          fogDensity: 0.012,
        },
        particles3D: {
          type: 'sparks',
          count: 400,
          color: '#38bdf8',
          speed: 1.1,
          size: 0.09,
        },
      })),
    };

    const variations: VideoVariation[] = [
      {
        id: 'var-1',
        title: "Director's Cinematic 3D Cut",
        styleName: 'Cinematic 3D Blockbuster',
        tagline: 'Sweeping 3D Anamorphic Cameras & Warm Golden Hour PBR',
        description: 'Immersive cinematic pacing with grand crane trajectories, rich atmospheric lighting, and orchestral score depth.',
        visualTheme: baseProject.segments[0]?.visualTheme || 'coffee',
        tone: 'Epic Cinema Documentary',
        colorGrade: 'Kodak 2383 Golden Amber LUT',
        musicStyle: 'Hans Zimmer Hybrid Orchestral',
        captionStyle: 'documentary',
        cameraStyle: '50mm Anamorphic Primes • 360° Orbit & Crane Rise',
        lightingEnvironment: 'Golden Hour Sunset & Volumetric Haze',
        badge: "DIRECTOR'S CHOICE",
        accentColor: '#f59e0b',
        recommendedVoiceId: 'voice-attenborough',
        render3DMode: 'cinematic_pbr',
        project: var1Project,
      },
      {
        id: 'var-2',
        title: 'Cyberpunk Velocity Cut',
        styleName: 'High-Energy Sci-Fi / Action',
        tagline: 'Kinetic 60 FPS Drone Flights & Neon Chromatic Glow',
        description: 'Ultra-dynamic pacing with fast camera flythroughs, glowing neon volumetric fog, and synthwave electronic beats.',
        visualTheme: 'scifi_cyberpunk',
        tone: 'High-Energy Modern / Futuristic',
        colorGrade: 'Blade Runner Cyan & Magenta LUT',
        musicStyle: 'Synthwave Heavy Electronic Pulse',
        captionStyle: 'neon',
        cameraStyle: '24mm Ultra-Wide • FPV Drone Flythroughs',
        lightingEnvironment: 'Cyberpunk Neon & Chromatic Fog',
        badge: 'TRENDING ON TIKTOK',
        accentColor: '#ec4899',
        recommendedVoiceId: 'voice-kenji',
        render3DMode: 'cinematic_pbr',
        project: var2Project,
      },
      {
        id: 'var-3',
        title: 'Atmospheric NatGeo Poetic',
        styleName: 'Poetic Nature & Macro Documentary',
        tagline: 'Intimate Macro Depth-of-Field & Highland Mist Atmosphere',
        description: 'Quiet, contemplative pacing highlighting intricate textures, soft natural lighting, and warm organic narration.',
        visualTheme: 'nature',
        tone: 'Intimate, Lyrical, Contemplative',
        colorGrade: 'Naturalistic 35mm Film Stock',
        musicStyle: 'Acoustic Guitar & Warm Strings',
        captionStyle: 'documentary',
        cameraStyle: '85mm Macro Portrait • Gentle Dutch Pans',
        lightingEnvironment: 'Highland Mist & Soft Diffused Light',
        badge: 'BBC / NATGEO STYLE',
        accentColor: '#10b981',
        recommendedVoiceId: 'voice-elena',
        render3DMode: 'cinematic_pbr',
        project: var3Project,
      },
      {
        id: 'var-4',
        title: 'Modern Minimalist Tech Explainer',
        styleName: 'Clean Tech & Kinetic Motion',
        tagline: 'Crisp Cleanroom Shaders, Kinetic Titles & Upbeat Lo-Fi',
        description: 'Punchy, informative style featuring sharp 3D geometric framing, vibrant subtitle animations, and modern creator energy.',
        visualTheme: 'quantum',
        tone: 'Crisp, Engaging, Creator-First',
        colorGrade: 'Cobalt Studio & Hologram Accents',
        musicStyle: 'Minimalist Upbeat Lo-Fi Tech',
        captionStyle: 'mrbeast',
        cameraStyle: '35mm Studio Prime • Spiral Dolly Reveals',
        lightingEnvironment: 'Studio Softbox & Particle Sparkles',
        badge: 'YOUTUBE EXPLAINER',
        accentColor: '#38bdf8',
        recommendedVoiceId: 'voice-maya',
        render3DMode: 'cinematic_pbr',
        project: var4Project,
      },
    ];

    var1Project.variations = variations;
    var1Project.selectedVariationId = 'var-1';

    onProgress?.({
      stage: 'done',
      percent: 100,
      message: 'Generated 4 candidate video variations! Choose the best one below.',
    });

    return {
      variations,
      selectedProject: var1Project,
    };
  }

  /**
   * Generates a complete 6-minute realistic 3D video project pipeline from a single prompt
   */
  static async generateProjectFromPrompt(
    prompt: string,
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<Project> {
    const cleanPrompt = prompt.trim();
    const isCoffee = cleanPrompt.toLowerCase().includes('coffee');
    const isTitan = cleanPrompt.toLowerCase().includes('titan') || cleanPrompt.toLowerCase().includes('space') || cleanPrompt.toLowerCase().includes('mars');
    const isQuantum = cleanPrompt.toLowerCase().includes('quantum') || cleanPrompt.toLowerCase().includes('physics') || cleanPrompt.toLowerCase().includes('tech');
    const isDeepSea = cleanPrompt.toLowerCase().includes('deep') || cleanPrompt.toLowerCase().includes('sea') || cleanPrompt.toLowerCase().includes('ocean') || cleanPrompt.toLowerCase().includes('nature');
    const isCity = cleanPrompt.toLowerCase().includes('city') || cleanPrompt.toLowerCase().includes('megacity') || cleanPrompt.toLowerCase().includes('tokyo') || cleanPrompt.toLowerCase().includes('cyberpunk');
    const isPyramid = cleanPrompt.toLowerCase().includes('pyramid') || cleanPrompt.toLowerCase().includes('egypt') || cleanPrompt.toLowerCase().includes('ancient') || cleanPrompt.toLowerCase().includes('giza');

    // Stage 1: Script synthesis simulation
    onProgress?.({
      stage: 'script',
      percent: 15,
      message: 'Deconstructing prompt into 6-minute 3D narrative arc & logline...',
    });
    await new Promise((r) => setTimeout(r, 600));

    onProgress?.({
      stage: 'script',
      percent: 30,
      message: 'Drafting 8 timestamped 3D scenes (approx. 850 spoken words, 360s pacing)...',
    });
    await new Promise((r) => setTimeout(r, 700));

    // Stage 2: Storyboard planning
    onProgress?.({
      stage: 'storyboard',
      percent: 50,
      message: 'Synthesizing 3D camera spline trajectories, PBR shaders, and volumetric lighting...',
    });
    await new Promise((r) => setTimeout(r, 600));

    onProgress?.({
      stage: 'storyboard',
      percent: 65,
      message: 'Generating realistic video frames...',
    });
    await new Promise((r) => setTimeout(r, 700));

    // Stage 3: Video generation & mastering
    onProgress?.({
      stage: 'generating',
      percent: 80,
      message: 'Synthesizing video diffusion latent frames & temporal motion...',
      currentScene: 4,
      totalScenes: 8,
    });
    await new Promise((r) => setTimeout(r, 700));

    onProgress?.({
      stage: 'generating',
      percent: 95,
      message: 'Mastering orchestral soundtrack bed & lower-third graphics...',
      currentScene: 8,
      totalScenes: 8,
    });
    await new Promise((r) => setTimeout(r, 500));

    onProgress?.({
      stage: 'done',
      percent: 100,
      message: 'Realistic 3D Master Video synthesized! Ready for playback & publishing.',
    });

    // Dynamic Semantic Generator for ANY arbitrary prompt
    return this.createCustomProject(cleanPrompt);
  }

  private static createTitanProject(prompt: string): Project {
    const segments: SceneSegment[] = [
      {
        id: 'titan-1',
        index: 0,
        title: 'Chapter 1: The Golden Haze (Descent into 2184)',
        startTime: 0,
        endTime: 40,
        duration: 40,
        narration: 'Beneath a dense, orange-tinted stratosphere, nine hundred million miles from the sun, lies our species’ next sanctuary. Titan. A world shrouded in perpetual nitrogen haze, where methane rain carves river valleys through mountains of rock-hard ice. Today, the landing module Aethelgard pierces the clouds, carrying forty-two pioneers into the unknown.',
        speaker: 'Narrator',
        wordCount: 56,
        shotType: 'Atmospheric Entry Orbit & Atmospheric Burn • 24mm Anamorphic 3D',
        setting: 'Upper atmosphere of Titan with glowing heat shield plasma and Saturn rings visible in 3D upper rim',
        lighting: 'Amber nitrogen haze glow, fiery re-entry plasma streaks, faint golden solar rim',
        cameraMovement: 'Dynamic 3D orbital tracking following the descent craft as it banks into the cloud deck',
        continuityTag: 'PROP_AETHELGARD_CRAFT_01',
        lowerThirdText: 'ORBITAL DESCENT: TITAN ATMOSPHERE • 2184 CE',
        sfxCue: 'Deep atmospheric rumble, roaring plasma wash, ethereal synth pad swell',
        visualMood: 'Majestic, tense, otherworldly amber glow, high-tech 3D exploration',
        visualPrompt: 'Futuristic 3D colony ship entering glowing amber cloudy atmosphere of Titan with Saturn rings overhead in deep space',
        visualTheme: 'scifi_titan',
        visualKeywords: ['titan atmosphere 3d', 'saturn rings', 'colony ship', 'amber clouds', 'sci fi entry'],
        is3D: true,
        camera3D: {
          trajectory: 'orbit_360',
          fov: 50,
          startPos: [10, 4, 10],
          endPos: [-8, 2, 8],
          lookAt: [0, 0, 0],
          lensPreset: '24mm Anamorphic Prime f/1.8',
        },
        lighting3D: {
          environment: 'deep_space',
          keyLightColor: '#fde047',
          fillLightColor: '#78350f',
          rimLightColor: '#38bdf8',
          ambientIntensity: 0.6,
          directionalIntensity: 2.4,
          volumetricFog: true,
          fogColor: '#08091a',
          fogDensity: 0.015,
        },
        particles3D: {
          type: 'stardust',
          count: 500,
          color: '#fed7aa',
          speed: 1.2,
          size: 0.1,
        },
        mesh3dObjects: ['SaturnSphereMesh', 'SaturnRingsPBR', 'HeroSpaceshipMesh'],
      },
      {
        id: 'titan-2',
        index: 1,
        title: 'Chapter 2: The Methane Seas of Kraken Mare',
        startTime: 40,
        endTime: 85,
        duration: 45,
        narration: 'As the spacecraft slows, the surface reveals itself: Kraken Mare, an alien sea larger than Lake Superior, gleaming like polished black obsidian under faint twilight. Liquid ethane and methane lap against shorelines of crystalline water ice. Here, low gravity and thick atmosphere mean a human could don artificial wings and fly with the power of their own muscles.',
        speaker: 'Narrator',
        wordCount: 65,
        shotType: 'Low-Altitude 3D Flight across Liquid Hydrocarbon Waves • 35mm Prime',
        setting: 'Vast black liquid methane sea with icy quartz-like coastal cliffs and atmospheric haze',
        lighting: 'Deep indigo and amber twilight, soft bioluminescent research buoys',
        cameraMovement: 'Smooth 3D skimming drone flight 5 meters above dark glassy waves toward icy coastline',
        continuityTag: 'LOC_KRAKEN_MARE_COAST',
        lowerThirdText: 'KRAKEN MARE • LIQUID HYDROCARBON BASIN',
        sfxCue: 'Eerie liquid lapping sounds, atmospheric hum, haunting French horn melody',
        visualMood: 'Vast, serene, alien, crystalline 3D beauty',
        visualPrompt: 'Vast dark reflective liquid methane ocean on Titan with towering crystalline ice cliffs under orange sky',
        visualTheme: 'scifi_space',
        visualKeywords: ['kraken mare 3d', 'methane sea', 'ice cliffs', 'titan surface', 'alien ocean'],
        is3D: true,
        camera3D: {
          trajectory: 'drone_flyover',
          fov: 55,
          startPos: [0, 6, 15],
          endPos: [0, 2, -15],
          lookAt: [0, 0, -25],
          lensPreset: '35mm Prime Cinema f/2.0',
        },
        lighting3D: {
          environment: 'deep_space',
          keyLightColor: '#f59e0b',
          fillLightColor: '#0f172a',
          rimLightColor: '#06b6d4',
          ambientIntensity: 0.5,
          directionalIntensity: 2.0,
          volumetricFog: true,
          fogColor: '#0c0a1f',
          fogDensity: 0.02,
        },
        particles3D: {
          type: 'dust',
          count: 400,
          color: '#fbbf24',
          speed: 0.7,
          size: 0.09,
        },
        mesh3dObjects: ['TitanTerrainMesh', 'LiquidMethanePlane', 'SaturnSphereMesh'],
      },
      {
        id: 'titan-3',
        index: 2,
        title: 'Chapter 3: The Geothermal Dome of Shangri-La',
        startTime: 85,
        endTime: 130,
        duration: 45,
        narration: 'Touchdown in the Shangri-La dune fields. Robotic terra-forming rigs deployed six months prior have already erected the primary pressurized biosphere. Powered by deep cryovolcanic heat exchangers, the dome pulses with warm cyan light — an oasis of Earth-like warmth in a realm where surface temperatures hover at minus one hundred and seventy-nine degrees Celsius.',
        speaker: 'Narrator',
        wordCount: 61,
        shotType: 'Wide Establishing 3D Crane Shot • 28mm Cinema',
        setting: 'Geodesic pressurized habitat dome surrounded by methane dune fields and automated rovers',
        lighting: 'Cyan interior dome glow contrasting with freezing dark amber exterior',
        cameraMovement: 'Slow 3D crane rise revealing the expanding dome complex and automated rovers',
        continuityTag: 'PROP_HAB_DOME_ALPHA',
        lowerThirdText: 'BIOSPHERE ALPHA • CRYO-THERMAL POWER GRID',
        sfxCue: 'Pressurization hiss, mechanical rover servo hums, rhythmic electronic pulse',
        visualMood: 'Triumphant engineering, isolation, warm refuge amid cold expanse',
        visualPrompt: 'Massive glowing geodesic colony dome on Titan dunes at dusk with rovers and astronauts working outside',
        visualTheme: 'scifi_titan',
        visualKeywords: ['colony dome 3d', 'titan dunes', 'astronaut rovers', 'cyan lights', 'geothermal habitat'],
        is3D: true,
        camera3D: {
          trajectory: 'crane_rise',
          fov: 48,
          startPos: [6, 1, 10],
          endPos: [6, 8, 8],
          lookAt: [-4, 0.5, -4],
          lensPreset: '28mm Cinema Prime f/2.4',
        },
        lighting3D: {
          environment: 'cyberpunk_neon',
          keyLightColor: '#06b6d4',
          fillLightColor: '#78350f',
          rimLightColor: '#f97316',
          ambientIntensity: 0.7,
          directionalIntensity: 2.2,
          volumetricFog: true,
          fogColor: '#0b0c1e',
          fogDensity: 0.018,
        },
        particles3D: {
          type: 'stardust',
          count: 500,
          color: '#38bdf8',
          speed: 0.9,
          size: 0.1,
        },
        mesh3dObjects: ['GeodesicDomeLattice', 'GeodesicDomeGlass', 'TitanTerrainMesh'],
      },
      {
        id: 'titan-4',
        index: 3,
        title: 'Chapter 4: First Footsteps & The Cryo-Drill',
        startTime: 130,
        endTime: 175,
        duration: 45,
        narration: 'Commander Teresa Ruiz steps onto the ladder. Unlike the vacuum of Mars or the Moon, Titan offers atmospheric shielding from cosmic radiation. The team ignites the thermal deep-core drill, penetrating the outer ice crust toward the colossal subsurface liquid water ocean that scientists believe could harbor indigenous microbial biology.',
        speaker: 'Narrator',
        wordCount: 57,
        shotType: 'Low-Angle 3D Hero Push • 50mm Prime',
        setting: 'Frost-covered ladder and pristine hydrocarbon sand with drill rig in 3D background',
        lighting: 'Helmet headlamps cutting through cold amber mist, thermal drill laser glow',
        cameraMovement: 'Tight rack focus 3D push from suited boot stepping into soil to the towering laser drill',
        continuityTag: 'CHAR_COMMANDER_RUIZ',
        lowerThirdText: 'SUB-SURFACE CRUST SAMPLING • DEPTH: 1,400M',
        sfxCue: 'Deep rhythmic mechanical drill pulse, suit radio breath, inspiring strings',
        visualMood: 'Historic milestone, scientific discovery, intrepid exploration',
        visualPrompt: 'High-tech spacesuited astronaut stepping onto Titan surface with laser drill rig in mist background',
        visualTheme: 'scifi_titan',
        visualKeywords: ['astronaut boots', 'titan soil', 'laser drill', 'space suit', 'scientific discovery'],
        is3D: true,
        camera3D: {
          trajectory: 'macro_push',
          fov: 40,
          startPos: [2, 2, 7],
          endPos: [0, 1.2, 3.5],
          lookAt: [0, 0, 0],
          lensPreset: '50mm Anamorphic Master f/1.4',
        },
        lighting3D: {
          environment: 'deep_space',
          keyLightColor: '#fef08a',
          fillLightColor: '#0f172a',
          rimLightColor: '#f97316',
          ambientIntensity: 0.6,
          directionalIntensity: 2.2,
          volumetricFog: true,
          fogColor: '#0a0b1c',
          fogDensity: 0.02,
        },
        particles3D: {
          type: 'dust',
          count: 450,
          color: '#fed7aa',
          speed: 0.6,
          size: 0.08,
        },
        mesh3dObjects: ['TitanTerrainMesh', 'SaturnSphereMesh', 'GeodesicDomeLattice'],
      },
      {
        id: 'titan-5',
        index: 4,
        title: 'Chapter 5: Hydroponic Oasis & The New Atmosphere',
        startTime: 175,
        endTime: 220,
        duration: 45,
        narration: 'Inside the greenhouse tiers, vertical spirulina and potato farms thrive under artificial sunlight spectra. For the first time, human children born in deep transit breathe oxygen harvested from Titanian ice. The closed-loop ecosystem proves that humanity can not only survive beyond the asteroid belt — but sustainably prosper.',
        speaker: 'Narrator',
        wordCount: 52,
        shotType: 'Sleek 3D Interior Glide through Hydroponic Towers • 35mm Steadicam',
        setting: 'Multi-tiered futuristic vertical greenhouse with lush green foliage and purple LED arrays',
        lighting: 'Lush agricultural full-spectrum magenta and emerald lighting',
        cameraMovement: '3D glide down central atrium showing scientists inspecting lush crops with view of Titan outside',
        continuityTag: 'LOC_HYDROPONIC_TIER_3',
        lowerThirdText: 'HYDROPONIC CORE • 100% OXYGEN SELF-SUFFICIENCY',
        sfxCue: 'Gentle water misting systems, cycling air ventilation, uplifting acoustic guitar harmony',
        visualMood: 'Lush rebirth, futuristic hope, biological triumph',
        visualPrompt: 'Interior of futuristic space colony greenhouse with lush green vertical crops and panoramic window to Saturn',
        visualTheme: 'scifi_space',
        visualKeywords: ['space greenhouse 3d', 'vertical farming', 'colony interior', 'saturn view', 'future biology'],
        is3D: true,
        camera3D: {
          trajectory: 'orbit_360',
          fov: 45,
          startPos: [6, 3, 6],
          endPos: [-6, 3, 6],
          lookAt: [0, 0, 0],
          lensPreset: '35mm Steadicam Prime f/2.0',
        },
        lighting3D: {
          environment: 'cyberpunk_neon',
          keyLightColor: '#10b981',
          fillLightColor: '#a855f7',
          rimLightColor: '#06b6d4',
          ambientIntensity: 0.8,
          directionalIntensity: 2.0,
          volumetricFog: true,
          fogColor: '#051b14',
          fogDensity: 0.015,
        },
        particles3D: {
          type: 'steam',
          count: 350,
          color: '#a7f3d0',
          speed: 0.5,
          size: 0.12,
        },
        mesh3dObjects: ['GeodesicDomeGlass', 'HydroponicTowers', 'TitanTerrainMesh'],
      },
      {
        id: 'titan-6',
        index: 5,
        title: 'Chapter 6: The Communication Delay (80 Minutes to Earth)',
        startTime: 220,
        endTime: 265,
        duration: 45,
        narration: 'Back in the command module, communications officer Jax dials the high-gain laser array. A message to Earth takes eighty minutes each way. Every decision, every medical emergency, every scientific breakthrough must be solved autonomously. Titan is not a remote outpost waiting for orders; it is the birth of an independent interplanetary civilization.',
        speaker: 'Narrator',
        wordCount: 56,
        shotType: 'Macro 3D Holographic Display Terminal & Laser Relay • 85mm Cine',
        setting: 'Dimly lit command hub with holographic telemetry and planetary orbit projections in 3D',
        lighting: 'Blue holographic glow, ambient status indicator LEDs, moody cinematic darks',
        cameraMovement: 'Slow 3D circular pan around the holographic Earth-Titan orbital transfer line',
        continuityTag: 'PROP_HOLO_COMM_ARRAY',
        lowerThirdText: 'LASER TELEMETRY ARRAY • LATENCY: 79.4 MINS',
        sfxCue: 'Data relay chime, synthetic UI clicks, dramatic cello undertone',
        visualMood: 'Introspective, profound solitude, human resilience',
        visualPrompt: 'Futuristic spaceship bridge with glowing 3D holographic projection of Earth and Saturn telemetry',
        visualTheme: 'scifi_space',
        visualKeywords: ['hologram bridge 3d', 'orbital map', 'laser comms', 'deep space relay', 'sci fi command'],
        is3D: true,
        camera3D: {
          trajectory: 'orbit_360',
          fov: 42,
          startPos: [5, 2.5, 5],
          endPos: [-5, 2.5, 5],
          lookAt: [0, 0, 0],
          lensPreset: '85mm Cine Master f/1.8',
        },
        lighting3D: {
          environment: 'cyberpunk_neon',
          keyLightColor: '#38bdf8',
          fillLightColor: '#1e1b4b',
          rimLightColor: '#06b6d4',
          ambientIntensity: 0.6,
          directionalIntensity: 1.8,
          volumetricFog: true,
          fogColor: '#050714',
          fogDensity: 0.02,
        },
        particles3D: {
          type: 'stardust',
          count: 400,
          color: '#38bdf8',
          speed: 0.8,
          size: 0.08,
        },
        mesh3dObjects: ['HoloRelayArray', 'SaturnSphereMesh', 'HeroSpaceshipMesh'],
      },
      {
        id: 'titan-7',
        index: 6,
        title: 'Chapter 7: The Discovery in the Sub-Crust Ocean',
        startTime: 265,
        endTime: 310,
        duration: 45,
        narration: 'Day two hundred and fourteen. The deep probe breaches the inner mantle at four kilometers depth. Down in the warm, mineral-rich liquid water ocean, the probe’s cameras capture an astonishing spectacle: complex self-assembling organic lattices pulsing with bio-luminescence. We are no longer alone in the cosmos.',
        speaker: 'Narrator',
        wordCount: 51,
        shotType: 'Submersible 3D Camera Feed descending into Ocean Abyss • 28mm Wide',
        setting: 'Deep subsurface dark ocean beneath Titan ice with glowing 3D alien hydrothermal vents and bioluminescent creatures',
        lighting: 'Vibrant bioluminescent cyan and gold pulses radiating from organic underwater structures',
        cameraMovement: 'Submersible probe headlight sweep revealing mesmerizing glowing alien lifeforms in 3D',
        continuityTag: 'PROP_PROBE_TITAN_DEEP',
        lowerThirdText: 'OCEANIC MANTLE DISCOVERY • BIO-SIGNATURE CONFIRMED',
        sfxCue: 'Underwater sonics, whale-like resonant hum, awe-inspiring choral crescendo',
        visualMood: 'Mystical revelation, cosmic awe, breathtaking discovery',
        visualPrompt: 'Deep underwater alien ocean on Titan with glowing bioluminescent structures and hydrothermal vents',
        visualTheme: 'deepsea',
        visualKeywords: ['subsurface ocean 3d', 'bioluminescence', 'alien life', 'hydrothermal vents', 'deep space biology'],
        is3D: true,
        camera3D: {
          trajectory: 'macro_push',
          fov: 50,
          startPos: [0, 4, 10],
          endPos: [0, 1, 3.5],
          lookAt: [0, 0, 0],
          lensPreset: '28mm Wide Underwater f/2.0',
        },
        lighting3D: {
          environment: 'underwater_abyss',
          keyLightColor: '#06b6d4',
          fillLightColor: '#0f172a',
          rimLightColor: '#f43f5e',
          ambientIntensity: 0.5,
          directionalIntensity: 1.6,
          volumetricFog: true,
          fogColor: '#010914',
          fogDensity: 0.035,
        },
        particles3D: {
          type: 'bubbles',
          count: 500,
          color: '#67e8f9',
          speed: 1.0,
          size: 0.12,
        },
        mesh3dObjects: ['HydrothermalVentsMesh', 'BioluminescentJellyfish_5x', 'AbyssalSeabed'],
      },
      {
        id: 'titan-8',
        index: 7,
        title: 'Chapter 8: Horizon of the Ringed World (The New Home)',
        startTime: 310,
        endTime: 360,
        duration: 50,
        narration: 'As night settles over the Shangri-La colony, the rings of Saturn rise majestically above the orange horizon. A hundred pioneers look up not with homesickness, but with the quiet pride of founders. Earth gave us our birth, but Titan has given us our future. The age of multi-planetary humanity has officially begun.',
        speaker: 'Narrator',
        wordCount: 58,
        shotType: 'Grand 3D Panoramic Pull-Back over Colony with Saturn • 18mm Extreme Wide',
        setting: 'Vast panorama of glowing 3D colony city under clear gap in Titan atmosphere with gigantic Saturn rings',
        lighting: 'Golden ring light, glowing city grid, deep cosmic starry indigo',
        cameraMovement: 'Majestic 3D crane pull-back and tilt-up into the infinite starfield with Saturn dominating the frame',
        continuityTag: 'ENV_TITAN_PANORAMA_CITY',
        lowerThirdText: 'COLONY AETHELGARD • 2184 AND BEYOND',
        sfxCue: 'Sweeping orchestral finale, thunderous timpani, lingering emotional brass chord',
        visualMood: 'Epic, triumphant, cinematic perfection in 3D',
        visualPrompt: 'Breathtaking 3D landscape of futuristic city on Titan under massive Saturn with glowing rings in dark sky',
        visualTheme: 'scifi_titan',
        visualKeywords: ['saturn landscape 3d', 'titan colony city', 'saturn rings in sky', 'future humanity', 'epic finale'],
        is3D: true,
        camera3D: {
          trajectory: 'crane_rise',
          fov: 60,
          startPos: [0, 2, 10],
          endPos: [0, 12, 25],
          lookAt: [0, 2, -10],
          lensPreset: '18mm Extreme Wide Prime f/2.8',
        },
        lighting3D: {
          environment: 'deep_space',
          keyLightColor: '#fef08a',
          fillLightColor: '#78350f',
          rimLightColor: '#38bdf8',
          ambientIntensity: 0.7,
          directionalIntensity: 2.6,
          volumetricFog: true,
          fogColor: '#060818',
          fogDensity: 0.015,
        },
        particles3D: {
          type: 'stardust',
          count: 600,
          color: '#fef08a',
          speed: 0.9,
          size: 0.12,
        },
        mesh3dObjects: ['SaturnSphereMesh', 'SaturnRingsPBR', 'GeodesicDomeLattice', 'TitanTerrainMesh'],
      },
    ];

    return {
      id: `proj-titan-${Date.now()}`,
      title: 'Project Aethelgard: The First Colony on Titan (Realistic 3D)',
      prompt,
      logline: 'In 2184, forty-two astronauts make humanity’s most audacious leap — founding our first permanent settlement on Saturn’s liquid methane moon.',
      tone: 'Interstellar Cinematic • Epic, Scientific, Realistic 3D',
      targetAudience: 'Sci-fi fans, astronomy lovers, future tech enthusiasts, cinema documentary viewers',
      targetDurationSec: 360,
      aspectRatio: '16:9',
      resolution: '4k',
      colorGrade: 'Anamorphic Sci-Fi Teal & Golden Amber LUT',
      musicStyle: 'Hans Zimmer Style Hybrid Orchestral & Deep Synthesizers',
      captionStyle: 'neon',
      selectedVoiceId: 'voice-marcus',
      characterVoices: {
        'Narrator': 'voice-marcus',
        'Commander Ruiz': 'voice-elena',
      },
      is3D: true,
      render3DMode: 'cinematic_pbr',
      cameraMode: 'directed',
      renderProgress: 100,
      renderingSceneIndex: 8,
      statusMessage: 'Realistic 3D Master Video Ready for Export & Publishing',
      estimatedTimeSec: 0,
      estimatedCost: '$0.00 (Ready)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentVersion: 1,
      versionHistory: [],
      publishingMetadata: {
        titles: [
          'Project Aethelgard: The First Human Colony on Titan (Realistic 3D Doc)',
          'What Life on Saturn’s Moon Titan Will Actually Look Like in 2184',
          'Why Titan, Not Mars, Is Humanity’s True Next Home',
        ],
        selectedTitleIndex: 0,
        description: `🚀 Step into 2184 in realistic cinematic detail as humanity establishes its first permanent civilization on Titan, Saturn’s giant hydrocarbon moon.

📌 CHAPTERS:
00:00 - Descent into the Golden Haze (3D Saturn Orbit)
00:40 - The Methane Seas of Kraken Mare (3D Wave Skimming)
01:25 - The Geothermal Dome of Shangri-La (3D Habitat Architecture)
02:10 - First Footsteps & The Deep Ice Drill
02:55 - Hydroponic Oxygen Self-Sufficiency
03:40 - The 80-Minute Communication Delay
04:25 - The Subsurface Ocean Discovery
05:10 - Horizon of the Ringed World (3D Starfield Climax)

Produced autonomously by Cinegen 3D AI Video Studio.
#Titan #Realistic3D #SciFi #Saturn #SpaceColony #Astronomy #CinegenAI`,
        tags: ['Titan Colony', 'Realistic 3D Video', 'Saturn Moon', 'Space Exploration', 'Sci Fi Documentary', 'Astronomy 4K', 'Cinegen AI'],
        selectedThumbnailIndex: 0,
        thumbnails: [
          {
            id: 't-titan-1',
            label: 'Titan Descent & Saturn Rings',
            bgTheme: 'scifi_titan',
            headline: 'PROJECT AETHELGARD',
            subtext: 'First Colony on Titan • 2184',
            badgeText: 'REALISTIC 3D',
            accentColor: '#f59e0b',
          },
          {
            id: 't-titan-2',
            label: 'Alien Methane Oceans',
            bgTheme: 'scifi_space',
            headline: 'BEYOND MARS',
            subtext: 'The True Future of Humanity',
            badgeText: 'MUST WATCH',
            accentColor: '#06b6d4',
          },
          {
            id: 't-titan-3',
            label: 'The Subsurface Discovery',
            bgTheme: 'scifi_cyberpunk',
            headline: 'WE ARE NOT ALONE',
            subtext: 'The Secret Beneath the Ice',
            badgeText: '6 MIN DOC',
            accentColor: '#8b5cf6',
          },
        ],
        platformConnections: {
          youtube: { connected: true, channelName: 'Cosmic Frontier 4K', privacy: 'public', category: 'Science & Technology' },
          tiktok: { connected: true, accountName: '@cinegen_space', allowDuet: true },
          instagram: { connected: false, accountName: '', shareToFeed: true },
          x: { connected: true, handle: '@CosmicFrontier' },
        },
        publishHistory: [],
      },
      segments,
    };
  }

  private static createQuantumProject(prompt: string): Project {
    const segments: SceneSegment[] = [
      {
        id: 'q-1',
        index: 0,
        title: 'Chapter 1: The End of Secrets (The RSA Crisis)',
        startTime: 0,
        endTime: 40,
        duration: 40,
        narration: 'Every bank account, military cipher, and encrypted message traversing our planet relies on a single mathematical assumption: that factoring two prime numbers is computationally impossible. But in research cleanrooms across Zurich, Santa Barbara, and Tokyo, that assumption is evaporating. The quantum revolution is here, and it will rewrite our definition of reality.',
        speaker: 'Narrator',
        wordCount: 56,
        shotType: 'Macro 3D Golden Quantum Chandelier & Dilution Refrigerator • 100mm Macro',
        setting: 'Ultra-clean quantum physics laboratory with 3D 5-tier golden dilution chandelier and cryogenic tubes',
        lighting: 'Cold cobalt blue cleanroom light with golden reflections on cryogenic tubes',
        cameraMovement: 'Slow hypnotic 3D glide down the tiered golden chandelier dilution refrigerator',
        continuityTag: 'PROP_QUANTUM_CHANDELIER_01',
        lowerThirdText: 'IBM / GOOGLE QUANTUM RESEARCH • CRYOGENIC 15mK',
        sfxCue: 'Deep sub-bass hum, laser pulse discharge, modern minimalist electronic beat',
        visualMood: 'Cutting-edge, mysterious, high-stakes 3D technology',
        visualPrompt: 'Gleaming 3D golden quantum computer dilution refrigerator chandelier with glowing blue cables and laser arrays',
        visualTheme: 'quantum',
        visualKeywords: ['quantum computer 3d', 'dilution refrigerator', 'gold chandelier', 'superconducting chip', 'laser cleanroom'],
        is3D: true,
        camera3D: {
          trajectory: 'macro_push',
          fov: 40,
          startPos: [0, 4, 10],
          endPos: [0, -1, 4.5],
          lookAt: [0, -1, 0],
          lensPreset: '100mm Macro Cine f/2.0',
        },
        lighting3D: {
          environment: 'studio_softbox',
          keyLightColor: '#fde047',
          fillLightColor: '#1e1b4b',
          rimLightColor: '#06b6d4',
          ambientIntensity: 0.7,
          directionalIntensity: 2.5,
          volumetricFog: true,
          fogColor: '#02040a',
          fogDensity: 0.02,
        },
        particles3D: {
          type: 'stardust',
          count: 450,
          color: '#38bdf8',
          speed: 1.0,
          size: 0.09,
        },
        mesh3dObjects: ['QuantumChandelierGold', 'CoaxialCablesPBR', 'QubitCoreOctahedron', 'CleanroomGridFloor'],
      },
      {
        id: 'q-2',
        index: 1,
        title: 'Chapter 2: Spooky Action at a Distance (Entanglement)',
        startTime: 40,
        endTime: 85,
        duration: 45,
        narration: 'Albert Einstein famously mocked it as "spooky action at a distance." Quantum entanglement connects two particles across infinite space: measure the spin of one in Paris, and its partner in Tokyo instantly resolves its state with zero time lag. It defied classical physics for a century — but today, it is the bedrock of ultra-secure quantum communications.',
        speaker: 'Narrator',
        wordCount: 59,
        shotType: '3D Optical Simulation of Entangled Qubit Matrix • CGI Macro',
        setting: 'Deep indigo quantum vacuum with glowing 3D qubit crystals and laser interconnects',
        lighting: 'Neon cyan and magenta wave interference patterns',
        cameraMovement: '3D orbital rotation around the pulsating quantum core with laser interconnects',
        continuityTag: 'PROP_PHOTON_PAIR_ENTANGLED',
        lowerThirdText: 'QUANTUM ENTANGLEMENT • BELL STATE |Ψ+⟩',
        sfxCue: 'Shimmering crystal tone, Doppler resonance pulse, electronic melody',
        visualMood: 'Mind-bending, luminous, conceptual 3D elegance',
        visualPrompt: '3D visualization of glowing entangled quantum qubit core spinning in quantum vacuum with neon light trails',
        visualTheme: 'quantum',
        visualKeywords: ['entangled photons 3d', 'quantum wave', 'superposition', 'neon interference', 'qubit lattice'],
        is3D: true,
        camera3D: {
          trajectory: 'orbit_360',
          fov: 45,
          startPos: [7, 3, 7],
          endPos: [-7, 3, 7],
          lookAt: [0, -1, 0],
          lensPreset: '50mm Anamorphic Prime f/1.4',
        },
        lighting3D: {
          environment: 'cyberpunk_neon',
          keyLightColor: '#06b6d4',
          fillLightColor: '#a855f7',
          rimLightColor: '#fbbf24',
          ambientIntensity: 0.8,
          directionalIntensity: 2.2,
          volumetricFog: true,
          fogColor: '#030410',
          fogDensity: 0.022,
        },
        particles3D: {
          type: 'stardust',
          count: 500,
          color: '#67e8f9',
          speed: 1.2,
          size: 0.1,
        },
        mesh3dObjects: ['QuantumChandelierGold', 'QubitCoreOctahedron', 'LaserInterconnects'],
      },
    ];

    return {
      ...COFFEE_PROJECT,
      id: `proj-quantum-${Date.now()}`,
      title: 'The Quantum Revolution: 3D Entanglement & Supercomputing',
      prompt,
      logline: 'How harnessing the bizarre physics of superposition and entanglement is dismantling modern cryptography, reinventing chemistry, and ushering in the next era of human civilization.',
      tone: 'Veritasium / Kurzgesagt Style • Realistic 3D Tech Essay',
      colorGrade: 'Cobalt Cleanroom Blue & Radiant Holographic Gold',
      captionStyle: 'neon',
      selectedVoiceId: 'voice-kenji',
      is3D: true,
      render3DMode: 'cinematic_pbr',
      segments: [
        ...segments,
        ...COFFEE_PROJECT.segments.slice(2).map((s, i) => ({
          ...s,
          id: `q-${i + 3}`,
          index: i + 2,
          visualTheme: 'quantum',
          is3D: true,
        })),
      ],
    };
  }

  private static createDeepSeaProject(prompt: string): Project {
    const segments: SceneSegment[] = [
      {
        id: 'sea-1',
        index: 0,
        title: 'Chapter 1: Into the Midnight Zone (4,000m Down)',
        startTime: 0,
        endTime: 45,
        duration: 45,
        narration: 'Beneath the reach of sunlight, in the crushing blackness of the abyssal zone, life has evolved its own illumination. Here, where pressure exceeds one thousand atmospheres, creatures create living light — cold bioluminescence born from chemical fire.',
        speaker: 'Narrator',
        wordCount: 42,
        shotType: 'Deep Submersible 3D Descent with Caustic Godrays • 28mm Wide',
        setting: 'Sunless oceanic abyss with volcanic seabed, hydrothermal black smoker vents, and pulsing bioluminescent jellyfish',
        lighting: 'Bioluminescent cyan and hot pink pulses cutting through midnight oceanic blue',
        cameraMovement: 'Smooth 3D submersible tracking shot gliding past translucent pulsing jellyfish toward hydrothermal vents',
        continuityTag: 'PROP_SUBMERSIBLE_ABYSS',
        lowerThirdText: 'MARIANA TRENCH • DEPTH: 4,200M',
        sfxCue: 'Deep ocean sonics, rhythmic bubble release, ethereal orchestral choir',
        visualMood: 'Mesmerizing, mysterious, wonder-filled 3D nature',
        visualPrompt: 'Photorealistic 3D deep sea abyss with pulsing bioluminescent jellyfish, hydrothermal vents, and floating marine snow',
        visualTheme: 'deepsea',
        visualKeywords: ['deep sea 3d', 'bioluminescent jellyfish', 'hydrothermal vents', 'ocean abyss', 'marine snow'],
        is3D: true,
        camera3D: {
          trajectory: 'macro_push',
          fov: 50,
          startPos: [0, 4, 12],
          endPos: [0, 1, 4],
          lookAt: [0, 0, 0],
          lensPreset: '28mm Wide Submersible f/2.0',
        },
        lighting3D: {
          environment: 'underwater_abyss',
          keyLightColor: '#06b6d4',
          fillLightColor: '#0284c7',
          rimLightColor: '#f43f5e',
          ambientIntensity: 0.5,
          directionalIntensity: 1.8,
          volumetricFog: true,
          fogColor: '#010914',
          fogDensity: 0.035,
        },
        particles3D: {
          type: 'bubbles',
          count: 550,
          color: '#67e8f9',
          speed: 0.8,
          size: 0.12,
        },
        mesh3dObjects: ['AbyssalSeabed', 'BioluminescentJellyfish_5x', 'HydrothermalVentsMesh'],
      },
    ];

    return {
      ...COFFEE_PROJECT,
      id: `proj-deepsea-${Date.now()}`,
      title: 'Abyssal Horizons: Secrets of the Bioluminescent Deep (3D)',
      prompt,
      logline: 'A breathtaking expedition four thousand meters beneath the surface into the sunless abyss where nature glows in living neon light.',
      tone: 'Blue Planet Nature Documentary • Realistic 3D Ocean',
      colorGrade: 'Abyssal Deep Ocean Indigo & Neon Bioluminescent Emerald',
      captionStyle: 'documentary',
      selectedVoiceId: 'voice-attenborough',
      is3D: true,
      render3DMode: 'cinematic_pbr',
      segments: [
        ...segments,
        ...COFFEE_PROJECT.segments.slice(1).map((s, i) => ({
          ...s,
          id: `sea-${i + 2}`,
          index: i + 1,
          visualTheme: 'deepsea',
          is3D: true,
        })),
      ],
    };
  }

  private static createCityProject(prompt: string): Project {
    return {
      ...COFFEE_PROJECT,
      id: `proj-city-${Date.now()}`,
      title: 'Tokyo 2099: Flight Through the Cyberpunk Megacity (Realistic 3D)',
      prompt,
      logline: 'An exhilarating aerial drone journey through the towering neon skyscrapers, holographic billboards, and aerocar light highways of Tokyo in 2099.',
      tone: 'Blade Runner 2049 • High-Speed 3D Drone Flight',
      colorGrade: 'Cyberpunk Neon Cyan & Hot Magenta',
      captionStyle: 'neon',
      selectedVoiceId: 'voice-kenji',
      is3D: true,
      render3DMode: 'cinematic_pbr',
      segments: COFFEE_PROJECT.segments.map((s, i) => ({
        ...s,
        visualTheme: 'city',
        is3D: true,
        camera3D: {
          trajectory: (i % 2 === 0 ? 'drone_flyover' : 'orbit_360') as CameraTrajectory,
          fov: 55,
          startPos: [0, 8, 16],
          endPos: [0, 3, -12],
          lookAt: [0, 0, -20],
          lensPreset: '24mm Wide Anamorphic f/1.8',
        },
        lighting3D: {
          environment: 'cyberpunk_neon',
          keyLightColor: '#06b6d4',
          fillLightColor: '#f43f5e',
          rimLightColor: '#a855f7',
          ambientIntensity: 0.7,
          directionalIntensity: 2.2,
          volumetricFog: true,
          fogColor: '#0a0818',
          fogDensity: 0.02,
        },
        particles3D: {
          type: 'rain',
          count: 600,
          color: '#38bdf8',
          speed: 1.8,
          size: 0.08,
        },
      })),
    };
  }

  private static createPyramidProject(prompt: string): Project {
    return {
      ...COFFEE_PROJECT,
      id: `proj-pyramid-${Date.now()}`,
      title: 'Giza 2500 BCE: Wonders of the Golden Pharaohs (Realistic 3D)',
      prompt,
      logline: 'An epic realistic 3D historical journey uncovering the engineering mastery and golden splendour of the Great Pyramids of Giza.',
      tone: 'Epic Historical Cinema • Realistic 3D Desert Wonders',
      colorGrade: 'Kodak 2383 Golden Sandstone & Sunset Crimson',
      captionStyle: 'documentary',
      selectedVoiceId: 'voice-attenborough',
      is3D: true,
      render3DMode: 'cinematic_pbr',
      segments: COFFEE_PROJECT.segments.map((s, i) => ({
        ...s,
        visualTheme: 'pyramid',
        is3D: true,
        camera3D: {
          trajectory: (i % 2 === 0 ? 'orbit_360' : 'crane_rise') as CameraTrajectory,
          fov: 48,
          startPos: [8, 4, 8],
          endPos: [-8, 5, 8],
          lookAt: [0, 2, -6],
          lensPreset: '35mm Epic Prime f/2.0',
        },
        lighting3D: {
          environment: 'desert_sunset',
          keyLightColor: '#f59e0b',
          fillLightColor: '#78350f',
          rimLightColor: '#fde047',
          ambientIntensity: 0.8,
          directionalIntensity: 2.6,
          volumetricFog: true,
          fogColor: '#451a03',
          fogDensity: 0.015,
        },
        particles3D: {
          type: 'sandstorm',
          count: 500,
          color: '#fbbf24',
          speed: 1.4,
          size: 0.1,
        },
      })),
    };
  }

  private static createCustomProject(prompt: string): Project {
    const pLower = prompt.toLowerCase();

    // 1. Semantic Domain Classifier
    let domain: 'nature_wildlife' | 'scifi_space' | 'cyberpunk_city' | 'ancient_history' | 'deepsea_ocean' | 'culinary_food' | 'quantum_tech' | 'automotive_action' | 'fantasy_magic' | 'cinematic_landscape' = 'cinematic_landscape';
    let visualTheme = 'custom';
    let defaultVoiceId = 'voice-attenborough';
    let tone = 'Cinematic 3D Blockbuster • High Fidelity Visuals & Dynamic Trajectories';
    let colorGrade = 'Kodak 2383 Golden Amber & Deep Contrast LUT';
    let musicStyle = 'Hans Zimmer Style Hybrid Orchestral & Deep Brass';
    let defaultParticleType: 'dust' | 'steam' | 'embers' | 'sparks' | 'rain' | 'bubbles' | 'stardust' | 'sandstorm' | 'none' = 'dust';
    let defaultLightingEnv: 'golden_hour' | 'deep_space' | 'cyberpunk_neon' | 'underwater_abyss' | 'studio_softbox' | 'desert_sunset' | 'highland_mist' = 'golden_hour';

    if (pLower.includes('lion') || pLower.includes('tiger') || pLower.includes('leopard') || pLower.includes('wolf') || pLower.includes('bear') || pLower.includes('animal') || pLower.includes('wildlife') || pLower.includes('safari') || pLower.includes('jungle') || pLower.includes('forest') || pLower.includes('savanna') || pLower.includes('bird') || pLower.includes('eagle')) {
      domain = 'nature_wildlife';
      visualTheme = 'nature';
      defaultVoiceId = 'voice-attenborough';
      tone = 'NatGeo Wildlife Masterpiece • Pristine Macro Detail & Sweeping Habitats';
      colorGrade = 'Natural Organic 35mm Film Stock with Rich Foliage Greens';
      musicStyle = 'Organic Orchestral Strings, Tribal Percussion & Atmospheric Flutes';
      defaultParticleType = 'dust';
      defaultLightingEnv = 'golden_hour';
    } else if (pLower.includes('titan') || pLower.includes('mars') || pLower.includes('space') || pLower.includes('astronaut') || pLower.includes('galaxy') || pLower.includes('star') || pLower.includes('planet') || pLower.includes('nebula') || pLower.includes('black hole') || pLower.includes('orbit') || pLower.includes('supernova') || pLower.includes('spaceship') || pLower.includes('cosmos')) {
      domain = 'scifi_space';
      visualTheme = 'scifi_titan';
      defaultVoiceId = 'voice-marcus';
      tone = 'Interstellar Epic • Vast Cosmic Scale & Volumetric Starlight';
      colorGrade = 'Deep Space Indigo & Radiant Golden Starfire LUT';
      musicStyle = 'Deep Analog Synthesizers & Massive Cosmic Horn Swells';
      defaultParticleType = 'stardust';
      defaultLightingEnv = 'deep_space';
    } else if (pLower.includes('cyberpunk') || pLower.includes('tokyo') || pLower.includes('neon') || pLower.includes('robot') || pLower.includes('android') || pLower.includes('futuristic') || pLower.includes('city') || pLower.includes('megacity') || pLower.includes('blade runner') || pLower.includes('synthwave')) {
      domain = 'cyberpunk_city';
      visualTheme = 'city';
      defaultVoiceId = 'voice-kenji';
      tone = 'High-Speed Cyberpunk Velocity • Volumetric Neon & Kinetic Drone Tracking';
      colorGrade = 'Blade Runner Neon Cyan & Radiant Magenta LUT';
      musicStyle = 'Cyberpunk Synthwave Electronic Pulse with Heavy Bass Drops';
      defaultParticleType = 'rain';
      defaultLightingEnv = 'cyberpunk_neon';
    } else if (pLower.includes('egypt') || pLower.includes('pyramid') || pLower.includes('rome') || pLower.includes('roman') || pLower.includes('greece') || pLower.includes('samurai') || pLower.includes('medieval') || pLower.includes('viking') || pLower.includes('ancient') || pLower.includes('temple') || pLower.includes('history') || pLower.includes('pharaoh') || pLower.includes('empire') || pLower.includes('gladiator')) {
      domain = 'ancient_history';
      visualTheme = 'pyramid';
      defaultVoiceId = 'voice-attenborough';
      tone = 'Monumental Historical Epic • Ancient Golden Architecture & Sunstone Grandeur';
      colorGrade = 'Kodak 2383 Golden Sandstone & Sunset Crimson LUT';
      musicStyle = 'Ancient Bronze Horns, Deep War Drums & Ethereal Choir';
      defaultParticleType = 'sandstorm';
      defaultLightingEnv = 'desert_sunset';
    } else if (pLower.includes('ocean') || pLower.includes('sea') || pLower.includes('deep') || pLower.includes('water') || pLower.includes('shark') || pLower.includes('whale') || pLower.includes('jellyfish') || pLower.includes('coral') || pLower.includes('abyss') || pLower.includes('underwater') || pLower.includes('trench') || pLower.includes('submersible')) {
      domain = 'deepsea_ocean';
      visualTheme = 'deepsea';
      defaultVoiceId = 'voice-elena';
      tone = 'Mesmerizing Oceanic Odyssey • Bioluminescent Caustics & Liquid Light';
      colorGrade = 'Abyssal Midnight Blue & Phosphorescent Cyan Shimmer';
      musicStyle = 'Ambient Aquatic Soundscapes, Sub-Bass Pulses & Ethereal Glass Harmonica';
      defaultParticleType = 'bubbles';
      defaultLightingEnv = 'underwater_abyss';
    } else if (pLower.includes('coffee') || pLower.includes('food') || pLower.includes('burger') || pLower.includes('steak') || pLower.includes('pizza') || pLower.includes('chef') || pLower.includes('culinary') || pLower.includes('restaurant') || pLower.includes('cooking') || pLower.includes('baking') || pLower.includes('espresso') || pLower.includes('chocolate') || pLower.includes('wine')) {
      domain = 'culinary_food';
      visualTheme = 'coffee';
      defaultVoiceId = 'voice-sophia';
      tone = 'Sensory Artisan Cinema • Hyper-Detailed Macro Textures & Warm Ambient Light';
      colorGrade = 'Warm Espresso Amber & Rich Roasted Mahogany LUT';
      musicStyle = 'Sophisticated Jazz Acoustic Trio & Warm Acoustic Bass';
      defaultParticleType = 'steam';
      defaultLightingEnv = 'golden_hour';
    } else if (pLower.includes('quantum') || pLower.includes('ai') || pLower.includes('neural') || pLower.includes('tech') || pLower.includes('computing') || pLower.includes('chip') || pLower.includes('silicon') || pLower.includes('algorithm') || pLower.includes('physics') || pLower.includes('science') || pLower.includes('laser')) {
      domain = 'quantum_tech';
      visualTheme = 'quantum';
      defaultVoiceId = 'voice-kenji';
      tone = 'Frontier Science & Supercomputing • Clean Geometry & Holographic Data Streams';
      colorGrade = 'Cobalt Cleanroom Blue & Radiant Hologram Gold LUT';
      musicStyle = 'Minimalist Upbeat Lo-Fi Tech Beats & Precision Digital Pulses';
      defaultParticleType = 'stardust';
      defaultLightingEnv = 'studio_softbox';
    } else if (pLower.includes('car') || pLower.includes('ferrari') || pLower.includes('porsche') || pLower.includes('racing') || pLower.includes('f1') || pLower.includes('drift') || pLower.includes('motorcycle') || pLower.includes('speed') || pLower.includes('engine') || pLower.includes('vehicle')) {
      domain = 'automotive_action';
      visualTheme = 'city';
      defaultVoiceId = 'voice-marcus';
      tone = 'High-Octane Dynamic Automotive Cinema • Low-Angle Tracking & Kinetic Motion';
      colorGrade = 'High-Contrast Carbon Fiber & Metallic Velocity LUT';
      musicStyle = 'Fast-Paced Hybrid Action Rock & Electronic Bass Pulse';
      defaultParticleType = 'sparks';
      defaultLightingEnv = 'golden_hour';
    } else if (pLower.includes('dragon') || pLower.includes('fantasy') || pLower.includes('magic') || pLower.includes('castle') || pLower.includes('wizard') || pLower.includes('island') || pLower.includes('mystical') || pLower.includes('floating')) {
      domain = 'fantasy_magic';
      visualTheme = 'custom';
      defaultVoiceId = 'voice-attenborough';
      tone = 'Enchanted Mythic Fantasy • Luminous Volumetric Auras & Floating Vistas';
      colorGrade = 'Emerald Enchantment & Radiant Starlight Gold LUT';
      musicStyle = 'Epic Celtic Fantasy Orchestra with Ethereal Vocal Choirs';
      defaultParticleType = 'embers';
      defaultLightingEnv = 'highland_mist';
    }

    // Directorial Camera Overrides from User Prompt
    let userCameraTrajectory: CameraTrajectory | null = null;
    if (pLower.includes('orbit') || pLower.includes('360')) userCameraTrajectory = 'orbit_360';
    else if (pLower.includes('drone') || pLower.includes('aerial')) userCameraTrajectory = 'drone_flyover';
    else if (pLower.includes('fpv') || pLower.includes('flythrough')) userCameraTrajectory = 'fpv_flythrough';
    else if (pLower.includes('macro') || pLower.includes('close up') || pLower.includes('close-up')) userCameraTrajectory = 'macro_push';
    else if (pLower.includes('crane') || pLower.includes('boom')) userCameraTrajectory = 'crane_rise';
    else if (pLower.includes('dolly')) userCameraTrajectory = 'cinematic_dolly';
    else if (pLower.includes('spiral')) userCameraTrajectory = 'spiral_reveal';

    // Directorial Lighting Overrides from User Prompt
    if (pLower.includes('golden hour') || pLower.includes('sunrise') || pLower.includes('warm')) defaultLightingEnv = 'golden_hour';
    else if (pLower.includes('sunset') || pLower.includes('dusk')) defaultLightingEnv = 'desert_sunset';
    else if (pLower.includes('neon') || pLower.includes('cyber')) defaultLightingEnv = 'cyberpunk_neon';
    else if (pLower.includes('fog') || pLower.includes('mist')) defaultLightingEnv = 'highland_mist';
    else if (pLower.includes('space') || pLower.includes('dark')) defaultLightingEnv = 'deep_space';
    else if (pLower.includes('underwater')) defaultLightingEnv = 'underwater_abyss';

    // Directorial Particle Overrides from User Prompt
    if (pLower.includes('rain')) defaultParticleType = 'rain';
    else if (pLower.includes('snow') || pLower.includes('blizzard')) defaultParticleType = 'stardust';
    else if (pLower.includes('ember') || pLower.includes('fire')) defaultParticleType = 'embers';
    else if (pLower.includes('spark')) defaultParticleType = 'sparks';
    else if (pLower.includes('bubble')) defaultParticleType = 'bubbles';
    else if (pLower.includes('steam') || pLower.includes('smoke')) defaultParticleType = 'steam';
    else if (pLower.includes('sand') || pLower.includes('dust')) defaultParticleType = 'sandstorm';

    // Generate formatted Title
    const subjectClean = prompt
      .replace(/generate|create|make|produce|video|cinematic|film|shot|on|in|4k|60fps|3d|hd|documentary/gi, '')
      .trim()
      .split(/\s+/)
      .slice(0, 5)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || 'The Cinematic Journey';

    const projectTitle = `${subjectClean}: Google Veo Cinematic Master`;

    // 2. Generate 8 Comprehensive Timestamped Scenes
    const sceneBlueprints = [
      {
        title: `Chapter 1: The Overture — ${subjectClean}`,
        duration: 45,
        narration: `In the vast tapestry of our world, few phenomena capture the imagination quite like ${prompt.slice(0, 60)}. From the very first light of dawn, an extraordinary symphony of forces begins to unfold, setting the stage for a cinematic journey of unprecedented scale and breathtaking wonder.`,
        shotType: 'Grand Establishing Vista • 24mm Ultra-Wide Anamorphic',
        movement: 'Sweeping 3D aerial panoramic glide revealing the panoramic landscape with volumetric morning godrays',
        sfx: 'Ethereal ambient drone swell, distant wind rush, gentle sub-bass vibration',
        lowerThird: `${subjectClean.toUpperCase()} • OVERTURE`,
        trajectory: userCameraTrajectory || 'drone_flyover',
        fov: 52,
        lens: '24mm Ultra-Wide Cine Prime f/1.8',
        startPos: [0, 8, 16] as [number, number, number],
        endPos: [0, 3, -10] as [number, number, number],
      },
      {
        title: `Chapter 2: The Formative Genesis`,
        duration: 45,
        narration: `To truly comprehend what we see today, we must look deeper into the origins. Every contour, surface texture, and radiant reflection carries the signature of countless transformations. Nothing here is accidental; every element is engineered by physical law and profound evolution.`,
        shotType: 'Slow Cinematic Tracking Shot • 35mm Prime f/1.4',
        movement: 'Slow orbital push-in with continuous focus tracking across the main focal elements',
        sfx: 'Deep cello resonance, subtle crystalline chime, mechanical or organic ambient harmonics',
        lowerThird: 'ORIGIN & ARCHITECTURE • TIMECODE 00:45',
        trajectory: userCameraTrajectory || 'orbit_360',
        fov: 46,
        lens: '35mm Prime f/1.4',
        startPos: [8, 4, 8] as [number, number, number],
        endPos: [-8, 3, 8] as [number, number, number],
      },
      {
        title: `Chapter 3: The Microscopic Anatomy`,
        duration: 45,
        narration: `Up close, a hidden universe reveals itself. Microscopic details, pristine physical materials, and dynamic light refractions dance across the frame at sixty frames per second. At this macro scale, the boundary between art and physics dissolves completely.`,
        shotType: 'Extreme Macro Depth of Field • 85mm Macro Cine',
        movement: 'Intimate macro dolly push gliding within inches of surface textures with shallow depth of field',
        sfx: 'Crisp high-frequency sparkle, subtle heartbeat pulse, focused ambient breeze',
        lowerThird: 'MACRO PERSPECTIVE • 85MM T1.5',
        trajectory: userCameraTrajectory || 'macro_push',
        fov: 36,
        lens: '85mm Macro Cine f/2.0',
        startPos: [0, 3, 7] as [number, number, number],
        endPos: [0, 0.5, 3.2] as [number, number, number],
      },
      {
        title: `Chapter 4: The Dynamic Shift`,
        duration: 45,
        narration: `Suddenly, the atmosphere intensifies. Currents shift, shadows lengthen, and kinetic motion takes command of the frame. In this crucible of energy, we witness the decisive moment that defines this entire spectacle.`,
        shotType: 'High-Speed Kinetic Flight • 24mm Anamorphic 60 FPS',
        movement: 'Dynamic 360-degree rotational spiral cutting through volumetric haze and atmospheric particles',
        sfx: 'Massive brass hit, accelerating whoosh sweep, driving percussion cadence',
        lowerThird: 'DYNAMIC CONVERGENCE • 60 FPS MOTION',
        trajectory: userCameraTrajectory || 'fpv_flythrough',
        fov: 58,
        lens: '24mm Anamorphic f/1.8',
        startPos: [0, 6, 14] as [number, number, number],
        endPos: [0, 1.5, -14] as [number, number, number],
      },
      {
        title: `Chapter 5: The Crucible of Mastery`,
        duration: 45,
        narration: `Centuries of observation and refinement lead directly to this apex. Whether through natural selection, human engineering, or raw celestial power, the balance achieved here is fragile yet virtually indestructible under pressure.`,
        shotType: 'Low-Angle Architectural Pan • 50mm Anamorphic Prime',
        movement: 'Steadicam tracking shot moving alongside the central subjects with dramatic rim lighting',
        sfx: 'Warm French horn chorale, deep sub-drop, rhythmic metallic or natural pulses',
        lowerThird: 'STRUCTURAL EQUILIBRIUM • MASTER CADENCE',
        trajectory: userCameraTrajectory || 'cinematic_dolly',
        fov: 44,
        lens: '50mm Anamorphic Prime f/1.2',
        startPos: [-7, 3, 9] as [number, number, number],
        endPos: [7, 2, 7] as [number, number, number],
      },
      {
        title: `Chapter 6: The Peak Crescendo`,
        duration: 45,
        narration: `Now, every thread converges into a single, breathtaking climax. The lighting reaches its golden zenith, and the full majesty of ${subjectClean} stands revealed in uncompromising cinematic clarity.`,
        shotType: 'Epic Crane Rise & Reveal • 35mm Hollywood Prime',
        movement: 'Vertical crane boom rising sixty feet into the sky to reveal the monumental surrounding vista',
        sfx: 'Full orchestral crescendo, soaring strings, triumphant tympani roll',
        lowerThird: 'THE CLIMAX • PEAK MAGNITUDE',
        trajectory: userCameraTrajectory || 'crane_rise',
        fov: 48,
        lens: '35mm Studio Prime f/1.4',
        startPos: [0, 1, 8] as [number, number, number],
        endPos: [0, 12, 16] as [number, number, number],
      },
      {
        title: `Chapter 7: The Global Echo`,
        duration: 45,
        narration: `The resonance of this journey extends far beyond what meets the eye. Across borders, across disciplines, and across generations, its influence continues to inspire explorers, creators, and visionaries worldwide.`,
        shotType: 'Golden Hour Atmospheric Glide • 50mm Prime f/1.2',
        movement: 'Gentle horizontal pan catching the setting sun reflections and warm volumetric glow',
        sfx: 'Contemplative acoustic piano, warm strings swell, soothing ambient harmonics',
        lowerThird: 'GLOBAL RESONANCE • TIMELESS HORIZON',
        trajectory: userCameraTrajectory || 'spiral_reveal',
        fov: 42,
        lens: '50mm Prime f/1.2',
        startPos: [6, 4, 7] as [number, number, number],
        endPos: [-6, 2, 6] as [number, number, number],
      },
      {
        title: `Chapter 8: The Endless Horizon (Epilogue)`,
        duration: 45,
        narration: `As the final embers of light fade into twilight, we are reminded that every ending is simply the prologue to another discovery. The story of ${subjectClean} will endure, forever etched into our collective imagination.`,
        shotType: 'Infinite Depth Twilight Pull-Back • 24mm Ultra-Wide',
        movement: 'Slow atmospheric pull-back into the twilight stars as the ambient score fades into silence',
        sfx: 'Gentle ambient fade, soft wind chime trail, deep resonant final tone',
        lowerThird: 'EPILOGUE • THE ENDLESS HORIZON',
        trajectory: userCameraTrajectory || 'orbit_360',
        fov: 50,
        lens: '24mm Ultra-Wide f/1.8',
        startPos: [0, 3, 9] as [number, number, number],
        endPos: [0, 10, 22] as [number, number, number],
      },
    ];

    let currentTimestamp = 0;
    const segments: SceneSegment[] = sceneBlueprints.map((bp, i) => {
      const startTime = currentTimestamp;
      const endTime = currentTimestamp + bp.duration;
      currentTimestamp = endTime;

      return {
        id: `veo-scene-${i + 1}`,
        index: i,
        title: bp.title,
        startTime,
        endTime,
        duration: bp.duration,
        narration: bp.narration,
        speaker: 'Narrator',
        wordCount: bp.narration.split(/\s+/).length,
        shotType: bp.shotType,
        setting: `${prompt} in realistic cinematic 3D environment with dynamic lighting and atmosphere`,
        lighting: `Volumetric ${defaultLightingEnv.replace('_', ' ')} with directional rim lighting and ambient fill`,
        cameraMovement: bp.movement,
        continuityTag: `PROP_HERO_${subjectClean.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_01`,
        lowerThirdText: bp.lowerThird,
        sfxCue: bp.sfx,
        visualMood: tone,
        visualPrompt: `Photorealistic 3D cinematic scene depicting ${prompt} with ${bp.shotType.toLowerCase()}, volumetric atmospheric lighting and 60 FPS motion`,
        visualTheme,
        visualKeywords: [prompt, subjectClean, domain, 'cinematic 3d', 'photorealistic', '60fps'],
        is3D: true,
        camera3D: {
          trajectory: bp.trajectory,
          fov: bp.fov,
          startPos: bp.startPos,
          endPos: bp.endPos,
          lookAt: [0, 0, 0],
          lensPreset: bp.lens,
        },
        lighting3D: {
          environment: defaultLightingEnv,
          keyLightColor: defaultLightingEnv === 'golden_hour' ? '#fde047' : defaultLightingEnv === 'cyberpunk_neon' ? '#06b6d4' : defaultLightingEnv === 'underwater_abyss' ? '#0284c7' : '#f59e0b',
          fillLightColor: defaultLightingEnv === 'cyberpunk_neon' ? '#f43f5e' : defaultLightingEnv === 'deep_space' ? '#1e1b4b' : '#334155',
          rimLightColor: defaultLightingEnv === 'cyberpunk_neon' ? '#a855f7' : '#38bdf8',
          ambientIntensity: 0.75,
          directionalIntensity: 2.4,
          volumetricFog: true,
          fogColor: defaultLightingEnv === 'deep_space' ? '#050714' : defaultLightingEnv === 'cyberpunk_neon' ? '#080518' : '#0f0a06',
          fogDensity: 0.018,
        },
        particles3D: {
          type: defaultParticleType,
          count: 500,
          color: defaultParticleType === 'rain' ? '#38bdf8' : defaultParticleType === 'embers' ? '#f97316' : defaultParticleType === 'stardust' ? '#a78bfa' : '#fde047',
          speed: 1.0,
          size: 0.1,
        },
        mesh3dObjects: ['HeroProceduralObject', 'GyroRing1', 'GyroRing2', 'FloatingMonoliths_8x'],
      };
    });

    let matchedVideoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-steaming-cup-of-coffee-41584-large.mp4';
    if (pLower.includes('snow') || pLower.includes('leopard') || pLower.includes('tiger') || pLower.includes('cat') || pLower.includes('animal') || pLower.includes('wildlife')) {
      matchedVideoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-wild-tiger-walking-in-nature-41585-large.mp4';
    } else if (pLower.includes('city') || pLower.includes('cyberpunk') || pLower.includes('tokyo') || pLower.includes('future') || pLower.includes('neon') || pLower.includes('street')) {
      matchedVideoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-city-with-flying-cars-at-night-41595-large.mp4';
    } else if (pLower.includes('ocean') || pLower.includes('sea') || pLower.includes('water') || pLower.includes('underwater') || pLower.includes('deep') || pLower.includes('wave')) {
      matchedVideoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-waves-coming-to-the-beach-5016-large.mp4';
    } else if (pLower.includes('desert') || pLower.includes('canyon') || pLower.includes('mountain') || pLower.includes('drone') || pLower.includes('fpv') || pLower.includes('sunset') || pLower.includes('aerial')) {
      matchedVideoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-sunset-over-the-mountains-41601-large.mp4';
    } else if (pLower.includes('space') || pLower.includes('titan') || pLower.includes('star') || pLower.includes('galaxy') || pLower.includes('cosmos') || pLower.includes('mars') || pLower.includes('planet')) {
      matchedVideoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1610-large.mp4';
    } else if (pLower.includes('woman') || pLower.includes('girl') || pLower.includes('person') || pLower.includes('man') || pLower.includes('portrait')) {
      matchedVideoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-woman-walking-on-the-beach-at-sunset-1198-large.mp4';
    } else if (pLower.includes('coffee') || pLower.includes('cafe') || pLower.includes('espresso')) {
      matchedVideoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-coffee-beans-falling-in-slow-motion-42686-large.mp4';
    }

    const topicCover = CoverPageService.detectCoverTopic(prompt, projectTitle, visualTheme);

    return {
      ...COFFEE_PROJECT,
      id: `proj-veo-${Date.now()}`,
      title: projectTitle,
      prompt,
      videoUrl: matchedVideoUrl,
      coverUrl: topicCover.coverImageUrl,
      thumbnailUrl: topicCover.coverImageUrl,
      coverBadge: topicCover.badge,
      coverTheme: topicCover.id,
      coverStyle: 'cinematic',
      logline: `A captivating 6-minute Google Veo realistic cinematic 3D odyssey exploring the depths, beauty, and monumental scale of ${prompt}.`,
      tone,
      colorGrade,
      musicStyle,
      captionStyle: 'documentary',
      selectedVoiceId: defaultVoiceId,
      is3D: true,
      render3DMode: 'cinematic_pbr',
      targetDurationSec: 360,
      aspectRatio: '16:9',
      resolution: '1080p',
      segments,
      publishingMetadata: {
        titles: [
          projectTitle,
          `${subjectClean}: The Untold Documentary (4K 60FPS)`,
          `Beyond the Known: ${subjectClean}`,
          `${subjectClean} Explained in 6 Minutes`,
        ],
        selectedTitleIndex: 0,
        description: `Experience the definitive 6-minute realistic cinematic journey through ${prompt}. Generated with Google Veo AI Video Engine featuring 60 FPS motion, dynamic 3D camera trajectories, and synchronized voice narration.`,
        tags: [subjectClean.toLowerCase(), 'google veo', 'ai video', 'cinematic 3d', '4k 60fps', 'documentary', 'narrated'],
        selectedThumbnailIndex: 0,
        thumbnails: [
          {
            id: 't-1',
            label: 'Cinematic Grandeur',
            bgTheme: visualTheme,
            headline: subjectClean.toUpperCase(),
            subtext: 'The Definitive 3D Master',
            badgeText: 'GOOGLE VEO',
            accentColor: '#f43f5e',
          },
          {
            id: 't-2',
            label: 'Epic Discovery',
            bgTheme: visualTheme,
            headline: 'THE UNTOLD STORY',
            subtext: `Inside ${subjectClean}`,
            badgeText: '4K 60FPS',
            accentColor: '#ec4899',
          },
        ],
        platformConnections: {
          youtube: { connected: true, channelName: 'Veo Cinematic 4K', privacy: 'public', category: 'Film & Animation' },
          tiktok: { connected: true, accountName: '@veo_director', allowDuet: true },
          instagram: { connected: false, accountName: '', shareToFeed: true },
          x: { connected: true, handle: '@VeoDirector' },
        },
        publishHistory: [],
      },
    };
  }
}

