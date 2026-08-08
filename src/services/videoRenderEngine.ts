import { SceneSegment, CaptionStyle, AspectRatio } from '../types/cinegen';

export class VideoRenderEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number; color: string }> = [];
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context not supported');
    }
    this.ctx = context;
    this.initParticles();
  }

  private initParticles() {
    this.particles = [];
    for (let i = 0; i < 70; i++) {
      this.particles.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4 - 0.2, // gentle drift upwards
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.6 + 0.2,
        color: Math.random() > 0.5 ? '#f59e0b' : '#ffffff',
      });
    }
  }

  /**
   * Main render loop frame for current scene time
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
    }
  ) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const ctx = this.ctx;

    if (!segment) {
      ctx.fillStyle = '#07090e';
      ctx.fillRect(0, 0, width, height);
      return;
    }

    const progress = Math.min(Math.max(currentTimeInSegment / (segment.duration || 1), 0), 1);

    // 1. Clear background
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, width, height);

    // 2. Render Procedural Cinematic Background for the specific theme
    this.renderThematicVisual(segment, progress, globalTime, width, height);

    // 3. Render Atmospheric Particles (Dust / Embers / Steam)
    this.renderAtmosphereParticles(segment.visualTheme, width, height);

    // 4. Ken Burns Camera Movement & Anamorphic Vignette
    this.renderCinematicLightingAndVignette(segment, width, height, options.brightnessAdjustment || 0);

    // 5. Broadcast Lower-Third Overlay (if within first 10 seconds of scene)
    if (options.showLowerThirds !== false && currentTimeInSegment >= 1.5 && currentTimeInSegment <= 9.5 && segment.lowerThirdText) {
      this.renderLowerThird(segment.lowerThirdText, segment.title, currentTimeInSegment - 1.5, width, height);
    }

    // 6. Subtitles & Karaoke Captions
    if (options.captionStyle !== 'off') {
      this.renderCaptions(segment.narration, progress, options.captionStyle, width, height);
    }

    // 7. Aspect Ratio Matte / Letterbox (if 9:16 or 1:1 on 16:9 canvas)
    this.renderAspectGuides(options.aspectRatio, width, height);
  }

  private renderThematicVisual(
    segment: SceneSegment,
    progress: number,
    globalTime: number,
    width: number,
    height: number
  ) {
    const ctx = this.ctx;
    const theme = segment.visualTheme || 'coffee_origin';

    // Camera Pan / Zoom calculation (Ken Burns effect)
    const zoom = 1 + progress * 0.12;
    const panX = Math.sin(progress * Math.PI) * 25;
    const panY = Math.cos(progress * Math.PI) * 15;

    ctx.save();
    ctx.translate(width / 2 + panX, height / 2 + panY);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);

    if (theme.includes('coffee')) {
      this.drawCoffeeTheme(segment, progress, globalTime, width, height);
    } else if (theme.includes('scifi') || theme.includes('titan')) {
      this.drawSpaceTitanTheme(segment, progress, globalTime, width, height);
    } else if (theme.includes('quantum')) {
      this.drawQuantumTheme(segment, progress, globalTime, width, height);
    } else if (theme.includes('deepsea')) {
      this.drawDeepSeaTheme(segment, progress, globalTime, width, height);
    } else {
      this.drawCustomDocumentaryTheme(segment, progress, globalTime, width, height);
    }

    ctx.restore();
  }

  private drawCoffeeTheme(
    segment: SceneSegment,
    progress: number,
    globalTime: number,
    width: number,
    height: number
  ) {
    const ctx = this.ctx;
    const idx = segment.index;

    if (idx === 0 || idx === 5 || idx === 6) {
      // Pouring espresso / Cup scene
      const grad = ctx.createRadialGradient(width * 0.5, height * 0.45, 50, width * 0.5, height * 0.5, width * 0.7);
      grad.addColorStop(0, '#451a03'); // warm amber core
      grad.addColorStop(0.5, '#1e1b4b'); // deep shadow
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Glass cup silhouette with rich crema
      const cupX = width * 0.5;
      const cupY = height * 0.62;
      
      // Cup rim & glowing liquid
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cupX, cupY - 60, 140, 45, 0, 0, Math.PI * 2);
      const cremaGrad = ctx.createLinearGradient(cupX - 140, cupY, cupX + 140, cupY);
      cremaGrad.addColorStop(0, '#92400e');
      cremaGrad.addColorStop(0.5, '#d97706');
      cremaGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = cremaGrad;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.stroke();

      // Glass body
      ctx.beginPath();
      ctx.moveTo(cupX - 140, cupY - 60);
      ctx.lineTo(cupX - 100, cupY + 110);
      ctx.quadraticCurveTo(cupX, cupY + 130, cupX + 100, cupY + 110);
      ctx.lineTo(cupX + 140, cupY - 60);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.stroke();

      // Pour stream
      const streamX = cupX + Math.sin(globalTime * 2) * 2;
      const streamGrad = ctx.createLinearGradient(streamX, 0, streamX, cupY - 60);
      streamGrad.addColorStop(0, '#451a03');
      streamGrad.addColorStop(0.8, '#b45309');
      streamGrad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = streamGrad;
      ctx.fillRect(streamX - 5, 0, 10, cupY - 60);

      // Steam swirls
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 4;
      for (let s = 0; s < 4; s++) {
        ctx.beginPath();
        const steamOffset = (globalTime * 40 + s * 40) % 200;
        ctx.moveTo(cupX - 60 + s * 40, cupY - 60 - steamOffset * 0.2);
        ctx.bezierCurveTo(
          cupX - 80 + Math.sin(globalTime + s) * 30, cupY - 120 - steamOffset,
          cupX - 40 - Math.cos(globalTime + s) * 30, cupY - 180 - steamOffset,
          cupX - 60 + s * 40, cupY - 240 - steamOffset
        );
        ctx.stroke();
      }
      ctx.restore();
    } else if (idx === 1 || idx === 4 || idx === 7) {
      // Highland Forest / Plantation Sunset
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#78350f'); // Sunset amber
      skyGrad.addColorStop(0.4, '#b45309');
      skyGrad.addColorStop(0.7, '#064e3b'); // Emerald highlands
      skyGrad.addColorStop(1, '#022c22');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Mountain layers (parallax depth)
      ctx.fillStyle = 'rgba(6, 78, 59, 0.4)';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.55);
      ctx.quadraticCurveTo(width * 0.3, height * 0.45, width * 0.6, height * 0.52);
      ctx.quadraticCurveTo(width * 0.85, height * 0.58, width, height * 0.48);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fill();

      // Foreground coffee plant branches with red cherries
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.7);
      ctx.quadraticCurveTo(width * 0.4, height * 0.65, width * 0.8, height * 0.75);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fill();

      // Ripe Red Cherries
      [
        { x: width * 0.25, y: height * 0.72 },
        { x: width * 0.28, y: height * 0.70 },
        { x: width * 0.55, y: height * 0.68 },
        { x: width * 0.58, y: height * 0.71 },
        { x: width * 0.75, y: height * 0.73 },
      ].forEach((cherry) => {
        ctx.beginPath();
        ctx.arc(cherry.x, cherry.y, 14, 0, Math.PI * 2);
        const cGrad = ctx.createRadialGradient(cherry.x - 3, cherry.y - 3, 2, cherry.x, cherry.y, 14);
        cGrad.addColorStop(0, '#f87171');
        cGrad.addColorStop(0.4, '#dc2626');
        cGrad.addColorStop(1, '#7f1d1d');
        ctx.fillStyle = cGrad;
        ctx.fill();
        ctx.strokeStyle = '#450a0a';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    } else {
      // 17th Century Coffeehouse / Roasting fire
      const fireGrad = ctx.createRadialGradient(width * 0.5, height * 0.6, 20, width * 0.5, height * 0.6, width * 0.8);
      fireGrad.addColorStop(0, '#f59e0b');
      fireGrad.addColorStop(0.3, '#78350f');
      fireGrad.addColorStop(0.7, '#1e1b4b');
      fireGrad.addColorStop(1, '#07090e');
      ctx.fillStyle = fireGrad;
      ctx.fillRect(0, 0, width, height);

      // Vintage candlelit table & parchment outline
      ctx.fillStyle = 'rgba(30, 27, 75, 0.7)';
      ctx.fillRect(0, height * 0.65, width, height * 0.35);
      
      // Roasting pan silhouette
      ctx.beginPath();
      ctx.ellipse(width * 0.5, height * 0.65, 220, 60, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  private drawSpaceTitanTheme(
    segment: SceneSegment,
    progress: number,
    globalTime: number,
    width: number,
    height: number
  ) {
    const ctx = this.ctx;
    // Deep Titan Orange & Saturn Space Backdrop
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#0f172a');
    skyGrad.addColorStop(0.5, '#78350f');
    skyGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Giant Saturn & Rings in background
    ctx.save();
    const saturnX = width * 0.75;
    const saturnY = height * 0.28;
    const saturnR = 85;

    // Saturn body
    ctx.beginPath();
    ctx.arc(saturnX, saturnY, saturnR, 0, Math.PI * 2);
    const sGrad = ctx.createRadialGradient(saturnX - 25, saturnY - 25, 10, saturnX, saturnY, saturnR);
    sGrad.addColorStop(0, '#fef3c7');
    sGrad.addColorStop(0.7, '#d97706');
    sGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = sGrad;
    ctx.fill();

    // Saturn Rings
    ctx.beginPath();
    ctx.ellipse(saturnX, saturnY, saturnR * 2.4, 28, -Math.PI / 8, 0, Math.PI * 2);
    ctx.lineWidth = 14;
    ctx.strokeStyle = 'rgba(254, 243, 199, 0.4)';
    ctx.stroke();
    ctx.restore();

    // Titan Dunes / Methane Sea surface
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.65);
    ctx.quadraticCurveTo(width * 0.4, height * 0.58, width * 0.75, height * 0.66);
    ctx.quadraticCurveTo(width * 0.9, height * 0.7, width, height * 0.62);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fill();

    // Colony Geodesic Dome
    const domeX = width * 0.45;
    const domeY = height * 0.64;
    ctx.beginPath();
    ctx.arc(domeX, domeY, 90, Math.PI, 0);
    ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#06b6d4';
    ctx.stroke();
  }

  private drawQuantumTheme(
    segment: SceneSegment,
    progress: number,
    globalTime: number,
    width: number,
    height: number
  ) {
    const ctx = this.ctx;
    // Cyberpunk Quantum Cleanroom Background
    const bgGrad = ctx.createRadialGradient(width * 0.5, height * 0.5, 50, width * 0.5, height * 0.5, width * 0.8);
    bgGrad.addColorStop(0, '#1e1b4b');
    bgGrad.addColorStop(0.6, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Quantum Chandelier / Golden Dilution Refrigerator outline
    const cx = width * 0.5;
    ctx.save();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;

    // Chandelier tiers
    [80, 160, 240, 320].forEach((tierY, i) => {
      const tierWidth = 320 - i * 60;
      ctx.beginPath();
      ctx.ellipse(cx, tierY, tierWidth, 18, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Connecting cryogenic tubes
      for (let j = -2; j <= 2; j++) {
        ctx.beginPath();
        ctx.moveTo(cx + j * 35, tierY);
        ctx.lineTo(cx + j * 28, tierY + 80);
        ctx.lineWidth = 2;
        ctx.strokeStyle = j % 2 === 0 ? 'rgba(251, 191, 36, 0.7)' : 'rgba(6, 182, 212, 0.7)';
        ctx.stroke();
      }
    });

    // Glowing quantum pulse center
    ctx.beginPath();
    ctx.arc(cx, 380, 35 + Math.sin(globalTime * 4) * 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.fill();
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#06b6d4';
    ctx.stroke();
    ctx.restore();
  }

  private drawDeepSeaTheme(
    segment: SceneSegment,
    progress: number,
    globalTime: number,
    width: number,
    height: number
  ) {
    const ctx = this.ctx;
    // Deep ocean midnight blue
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
    oceanGrad.addColorStop(0, '#020617');
    oceanGrad.addColorStop(0.5, '#082f49');
    oceanGrad.addColorStop(1, '#020617');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, width, height);

    // Glowing bioluminescent jellyfish & creatures
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const jx = (width * 0.2 + i * 200 + Math.sin(globalTime + i) * 30) % width;
      const jy = (height * 0.3 + i * 80 + Math.cos(globalTime * 0.8 + i) * 40) % height;
      
      ctx.beginPath();
      ctx.arc(jx, jy, 25, Math.PI, 0);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(6, 182, 212, 0.5)' : 'rgba(244, 63, 94, 0.5)';
      ctx.fill();
      ctx.shadowBlur = 20;
      ctx.shadowColor = i % 2 === 0 ? '#06b6d4' : '#f43f5e';
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawCustomDocumentaryTheme(
    segment: SceneSegment,
    progress: number,
    globalTime: number,
    width: number,
    height: number
  ) {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#07090e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Cinematic geometric lighting lines
    ctx.save();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(0, height * (i / 6));
      ctx.bezierCurveTo(width * 0.3, height * (i / 6) + 40, width * 0.7, height * (i / 6) - 40, width, height * (i / 6));
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderAtmosphereParticles(theme: string, width: number, height: number) {
    const ctx = this.ctx;
    ctx.save();
    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fill();
    });
    ctx.restore();
  }

  private renderCinematicLightingAndVignette(
    segment: SceneSegment,
    width: number,
    height: number,
    brightnessAdjustment: number
  ) {
    const ctx = this.ctx;
    ctx.save();

    // 1. Film Vignette (Dark edges)
    const vignette = ctx.createRadialGradient(
      width / 2, height / 2, width * 0.3,
      width / 2, height / 2, width * 0.75
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // 2. Brightness Adjustment overlay
    if (brightnessAdjustment !== 0) {
      if (brightnessAdjustment > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(brightnessAdjustment / 100, 0.35)})`;
      } else {
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(Math.abs(brightnessAdjustment) / 100, 0.45)})`;
      }
      ctx.fillRect(0, 0, width, height);
    }

    // 3. Film Grain Emulation
    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    for (let g = 0; g < 150; g++) {
      ctx.fillRect(Math.random() * width, Math.random() * height, 1.5, 1.5);
    }

    ctx.restore();
  }

  private renderLowerThird(
    text: string,
    title: string,
    elapsed: number,
    width: number,
    height: number
  ) {
    const ctx = this.ctx;
    ctx.save();

    // Slide in & slide out animation
    const slideProgress = Math.min(elapsed / 0.8, 1);
    const alpha = Math.min(elapsed / 0.6, 1);
    const xPos = 40 * slideProgress;
    const yPos = height - 130;

    ctx.globalAlpha = alpha;

    // Glass backdrop pill
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.roundRect(xPos, yPos, 480, 68, 10);
    ctx.fill();
    ctx.stroke();

    // Accent line on left
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.roundRect(xPos, yPos, 6, 68, [10, 0, 0, 10]);
    ctx.fill();

    // Text details
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 15px "Outfit", sans-serif';
    ctx.fillText(title.toUpperCase(), xPos + 22, yPos + 26);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText(text, xPos + 22, yPos + 48);

    ctx.restore();
  }

  private renderCaptions(
    narration: string,
    progress: number,
    style: CaptionStyle,
    width: number,
    height: number
  ) {
    const ctx = this.ctx;
    ctx.save();

    const words = narration.split(' ');
    if (words.length === 0) return;

    // Determine current word index based on progress
    const activeIndex = Math.min(Math.floor(progress * words.length), words.length - 1);
    const chunkWindow = 7; // show 7 words at a time
    const startIdx = Math.max(0, Math.floor(activeIndex / chunkWindow) * chunkWindow);
    const visibleWords = words.slice(startIdx, startIdx + chunkWindow);

    const captionY = height - 70;

    if (style === 'mrbeast') {
      // Bold, Yellow Pop Highlight, Stroke
      ctx.font = '900 26px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      
      const phrase = visibleWords.join(' ');
      
      // Shadow
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffffff';
      
      // Render phrase with highlighted active word
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
      // Elegant Serif Subtitle with Semi-transparent Bar
      ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      const phrase = visibleWords.join(' ');
      const textWidth = ctx.measureText(phrase).width;

      // Dark pill backdrop
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.beginPath();
      ctx.roundRect((width - textWidth - 36) / 2, captionY - 26, textWidth + 36, 38, 6);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.fillText(phrase, width / 2, captionY);
    } else if (style === 'neon') {
      // Neon Glowing Cyberpunk Subtitle
      ctx.font = '700 22px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      const phrase = visibleWords.join(' ');

      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#22d3ee';
      ctx.fillText(phrase, width / 2, captionY);
    } else if (style === 'netflix') {
      // Clean Netflix Yellow Minimalist
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

  private renderAspectGuides(aspectRatio: AspectRatio, width: number, height: number) {
    const ctx = this.ctx;
    if (aspectRatio === '16:9') return;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';

    if (aspectRatio === '9:16') {
      // Vertical Pillarbox on standard canvas
      const targetWidth = height * (9 / 16);
      const sideMargin = (width - targetWidth) / 2;
      ctx.fillRect(0, 0, sideMargin, height);
      ctx.fillRect(width - sideMargin, 0, sideMargin, height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(sideMargin, 0, targetWidth, height);
    } else if (aspectRatio === '1:1') {
      // Square Pillarbox
      const sideMargin = (width - height) / 2;
      ctx.fillRect(0, 0, sideMargin, height);
      ctx.fillRect(width - sideMargin, 0, sideMargin, height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(sideMargin, 0, height, height);
    }

    ctx.restore();
  }
}
