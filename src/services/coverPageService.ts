import { Project, CoverStyle, AspectRatio } from '../types/cinegen';

export interface CoverTopicInfo {
  id: string;
  category: string;
  badge: string;
  accentColor: string;
  glowColor: string;
  gradientOverlay: string;
  coverImageUrl: string;
  alternateImageUrls: string[];
  tagline: string;
}

export const THEMATIC_COVER_CATALOG: Record<string, CoverTopicInfo> = {
  coffee: {
    id: 'coffee',
    category: 'Artisan Culinary & Culture',
    badge: '☕ BBC 3D DOCUMENTARY',
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    gradientOverlay: 'from-amber-950/90 via-stone-950/70 to-black/90',
    coverImageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&q=80',
    alternateImageUrls: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1600&q=80',
    ],
    tagline: 'From Ancient Ethiopian Highlands to Modern Specialty Culture',
  },
  wildlife: {
    id: 'wildlife',
    category: 'Nature & Wildlife Odyssey',
    badge: '🐅 NATGEO 4K WILDLIFE',
    accentColor: '#fb923c',
    glowColor: 'rgba(251, 146, 60, 0.4)',
    gradientOverlay: 'from-orange-950/90 via-stone-950/70 to-black/90',
    coverImageUrl: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=1600&q=80',
    alternateImageUrls: [
      'https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=1600&q=80',
    ],
    tagline: 'Raw Apex Predators in Photorealistic Habitats & 60 FPS Tracking',
  },
  space: {
    id: 'space',
    category: 'Cosmic Exploration & Sci-Fi',
    badge: '🚀 INTERSTELLAR 3D ODYSSEY',
    accentColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    gradientOverlay: 'from-sky-950/90 via-indigo-950/70 to-black/90',
    coverImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
    alternateImageUrls: [
      'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=80',
    ],
    tagline: 'Venture into the Unknown Frontiers of the Solar System',
  },
  cyberpunk: {
    id: 'cyberpunk',
    category: 'Cyberpunk & Future Metropolis',
    badge: '⚡ NEO-TOKYO 60 FPS',
    accentColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    gradientOverlay: 'from-pink-950/90 via-purple-950/70 to-black/90',
    coverImageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    alternateImageUrls: [
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80',
    ],
    tagline: 'Volumetric Neon, Rain Reflections & High-Octane Kinetic Drones',
  },
  ocean: {
    id: 'ocean',
    category: 'Deep Marine Abyss',
    badge: '🌊 BLUE PLANET 3D',
    accentColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    gradientOverlay: 'from-cyan-950/90 via-slate-950/70 to-black/90',
    coverImageUrl: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=1600&q=80',
    alternateImageUrls: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1600&q=80',
    ],
    tagline: 'Bioluminescent Wonders and Secrets of the Deep Abyss',
  },
  history: {
    id: 'history',
    category: 'Ancient Monuments & Civilization',
    badge: '🏛️ MONUMENTAL HISTORY',
    accentColor: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.4)',
    gradientOverlay: 'from-yellow-950/90 via-stone-950/70 to-black/90',
    coverImageUrl: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1600&q=80',
    alternateImageUrls: [
      'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1600&q=80',
    ],
    tagline: 'Unearthing 5,000 Years of Architectural Mastery and Myth',
  },
  quantum: {
    id: 'quantum',
    category: 'Quantum Computing & AI',
    badge: '🔮 FRONTIER SCIENCE 3D',
    accentColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    gradientOverlay: 'from-purple-950/90 via-slate-950/70 to-black/90',
    coverImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
    alternateImageUrls: [
      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80',
    ],
    tagline: 'Silicon Qubits, Neural Synapses, and the Architecture of Tomorrow',
  },
  automotive: {
    id: 'automotive',
    category: 'Supercar & High Velocity',
    badge: '🏎️ HIGH VELOCITY 4K',
    accentColor: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    gradientOverlay: 'from-rose-950/90 via-neutral-950/70 to-black/90',
    coverImageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
    alternateImageUrls: [
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1600&q=80',
    ],
    tagline: 'Raw Horsepower, Carbon Fiber & Precision Cinematic Tracking',
  },
  nature: {
    id: 'nature',
    category: 'Cinematic Mountain & Landscapes',
    badge: '🏔️ CINEMATIC 3D VISTA',
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    gradientOverlay: 'from-emerald-950/90 via-slate-950/70 to-black/90',
    coverImageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
    alternateImageUrls: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1434725039720-aaad6dd32dfe?auto=format&fit=crop&w=1600&q=80',
    ],
    tagline: 'Sweeping Golden Hour Drone Flyovers and Majestic Horizons',
  },
  fantasy: {
    id: 'fantasy',
    category: 'Mythic Fantasy & Lore',
    badge: '🐉 MYTHIC FANTASY 3D',
    accentColor: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.4)',
    gradientOverlay: 'from-violet-950/90 via-slate-950/70 to-black/90',
    coverImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    alternateImageUrls: [
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
    ],
    tagline: 'Enchanted Realms, Floating Islands, and Volumetric Magic',
  },
  portrait: {
    id: 'portrait',
    category: 'Human Spirit & Cinematic Drama',
    badge: '🎭 35MM CINEMATIC DRAMA',
    accentColor: '#f472b6',
    glowColor: 'rgba(244, 114, 182, 0.4)',
    gradientOverlay: 'from-pink-950/90 via-stone-950/70 to-black/90',
    coverImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1600&q=80',
    alternateImageUrls: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1600&q=80',
    ],
    tagline: 'An Emotional Masterpiece of Human Expression and Depth',
  },
};

export class CoverPageService {
  /**
   * Intelligently detects the most suitable thematic cover based on prompt, title, and keywords
   */
  static detectCoverTopic(
    prompt: string = '',
    title: string = '',
    visualTheme: string = '',
    keywords: string[] = []
  ): CoverTopicInfo {
    const text = `${prompt} ${title} ${visualTheme} ${keywords.join(' ')}`.toLowerCase();

    if (text.includes('coffee') || text.includes('cafe') || text.includes('espresso') || text.includes('food') || text.includes('culinary') || text.includes('barista') || text.includes('drink') || text.includes('roast')) {
      return THEMATIC_COVER_CATALOG.coffee;
    }
    if (text.includes('tiger') || text.includes('lion') || text.includes('leopard') || text.includes('wolf') || text.includes('animal') || text.includes('wildlife') || text.includes('cat') || text.includes('safari') || text.includes('bird') || text.includes('eagle')) {
      return THEMATIC_COVER_CATALOG.wildlife;
    }
    if (text.includes('titan') || text.includes('space') || text.includes('mars') || text.includes('saturn') || text.includes('galaxy') || text.includes('star') || text.includes('planet') || text.includes('nebula') || text.includes('cosmos') || text.includes('astronaut')) {
      return THEMATIC_COVER_CATALOG.space;
    }
    if (text.includes('cyberpunk') || text.includes('tokyo') || text.includes('neon') || text.includes('robot') || text.includes('city') || text.includes('megacity') || text.includes('blade runner') || text.includes('synthwave')) {
      return THEMATIC_COVER_CATALOG.cyberpunk;
    }
    if (text.includes('ocean') || text.includes('sea') || text.includes('deep') || text.includes('water') || text.includes('underwater') || text.includes('shark') || text.includes('whale') || text.includes('abyss') || text.includes('coral') || text.includes('marine')) {
      return THEMATIC_COVER_CATALOG.ocean;
    }
    if (text.includes('pyramid') || text.includes('egypt') || text.includes('ancient') || text.includes('history') || text.includes('rome') || text.includes('roman') || text.includes('temple') || text.includes('pharaoh') || text.includes('empire') || text.includes('gladiator')) {
      return THEMATIC_COVER_CATALOG.history;
    }
    if (text.includes('quantum') || text.includes('ai') || text.includes('neural') || text.includes('chip') || text.includes('tech') || text.includes('computing') || text.includes('algorithm') || text.includes('physics') || text.includes('science')) {
      return THEMATIC_COVER_CATALOG.quantum;
    }
    if (text.includes('car') || text.includes('ferrari') || text.includes('porsche') || text.includes('racing') || text.includes('speed') || text.includes('drift') || text.includes('motor') || text.includes('vehicle') || text.includes('engine')) {
      return THEMATIC_COVER_CATALOG.automotive;
    }
    if (text.includes('dragon') || text.includes('fantasy') || text.includes('magic') || text.includes('wizard') || text.includes('myth') || text.includes('castle') || text.includes('enchanted')) {
      return THEMATIC_COVER_CATALOG.fantasy;
    }
    if (text.includes('woman') || text.includes('girl') || text.includes('man') || text.includes('portrait') || text.includes('person') || text.includes('face') || text.includes('character')) {
      return THEMATIC_COVER_CATALOG.portrait;
    }

    // Default to cinematic mountain/landscape
    return THEMATIC_COVER_CATALOG.nature;
  }

  /**
   * Resolves the primary cover image URL for a project
   */
  static getCoverImageUrl(project?: Project): string {
    if (project?.coverUrl) return project.coverUrl;
    if (project?.thumbnailUrl) return project.thumbnailUrl;
    const topic = this.detectCoverTopic(project?.prompt, project?.title);
    return topic.coverImageUrl;
  }

  /**
   * Generates a high-definition Canvas poster data URL for export or preview
   */
  static async generateCoverCanvas(
    project: Project,
    options: {
      style?: CoverStyle;
      width?: number;
      height?: number;
      aspectRatio?: AspectRatio;
    } = {}
  ): Promise<string> {
    const style = options.style || project.coverStyle || 'cinematic';
    const aspectRatio = options.aspectRatio || project.aspectRatio || '16:9';
    let width = options.width || 1920;
    let height = options.height || 1080;

    if (aspectRatio === '9:16') {
      width = 1080;
      height = 1920;
    } else if (aspectRatio === '1:1') {
      width = 1440;
      height = 1440;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const topic = this.detectCoverTopic(project.prompt, project.title);
    const imageUrl = project.coverUrl || topic.coverImageUrl;

    // Load background image or draw fallback
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Proceed even if network image fails
        img.src = imageUrl;
        setTimeout(resolve, 1500); // 1.5s timeout fallback
      });

      if (img.complete && img.naturalWidth > 0) {
        // Draw cover with object-fit cover math
        const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
        const nw = img.naturalWidth * scale;
        const nh = img.naturalHeight * scale;
        const nx = (width - nw) / 2;
        const ny = (height - nh) / 2;
        ctx.drawImage(img, nx, ny, nw, nh);
      } else {
        // Gradient fallback
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#180718');
        grad.addColorStop(0.5, '#0d091a');
        grad.addColorStop(1, '#050208');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }
    } catch {
      // Fallback solid fill
      ctx.fillStyle = '#0f0514';
      ctx.fillRect(0, 0, width, height);
    }

    // 1. Dark Filmic Gradient Scrim
    const scrim = ctx.createLinearGradient(0, 0, 0, height);
    scrim.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    scrim.addColorStop(0.3, 'rgba(0, 0, 0, 0.15)');
    scrim.addColorStop(0.65, 'rgba(0, 0, 0, 0.75)');
    scrim.addColorStop(1, 'rgba(5, 2, 8, 0.96)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, width, height);

    // 2. Radial Vignette
    const vignette = ctx.createRadialGradient(
      width / 2, height / 2, width * 0.3,
      width / 2, height / 2, width * 0.8
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // 3. Top Branding & Badges
    const margin = width * 0.06;
    const topY = height * 0.08;

    // Genre Tag Pill
    const badgeText = project.coverBadge || topic.badge;
    ctx.save();
    ctx.font = `bold ${Math.round(height * 0.02)}px "Outfit", sans-serif`;
    const badgeWidth = ctx.measureText(badgeText).width + 36;
    const badgeHeight = height * 0.038;

    ctx.fillStyle = 'rgba(236, 72, 153, 0.25)';
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(margin, topY, badgeWidth, badgeHeight, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fce7f3';
    ctx.fillText(badgeText, margin + 18, topY + badgeHeight * 0.68);

    // Right Side Metadata Pill (Resolution & Duration)
    const resText = `1080p 60 FPS • ${Math.round((project.targetDurationSec || 360) / 60)}:00`;
    ctx.font = `bold ${Math.round(height * 0.018)}px "JetBrains Mono", monospace`;
    const resWidth = ctx.measureText(resText).width + 30;
    const resX = width - margin - resWidth;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(resX, topY, resWidth, badgeHeight, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(resText, resX + 15, topY + badgeHeight * 0.68);
    ctx.restore();

    // 4. Center Play Symbol Emblem
    const centerX = width / 2;
    const centerY = height * 0.44;
    const playRadius = Math.min(width, height) * 0.07;

    ctx.save();
    // Glowing outer ring
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 35;
    ctx.fillStyle = 'rgba(236, 72, 153, 0.9)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, playRadius, 0, Math.PI * 2);
    ctx.fill();

    // White Play Triangle
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    const triSize = playRadius * 0.55;
    ctx.moveTo(centerX - triSize * 0.4, centerY - triSize * 0.6);
    ctx.lineTo(centerX + triSize * 0.7, centerY);
    ctx.lineTo(centerX - triSize * 0.4, centerY + triSize * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 5. Main Title & Typography Card
    ctx.save();
    const titleY = height * 0.72;
    const cleanTitle = (project.title || 'Cinematic Odyssey').toUpperCase();

    if (style === 'cinematic') {
      ctx.font = `900 ${Math.round(height * 0.052)}px "Outfit", sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 20;
    } else if (style === 'documentary') {
      ctx.font = `bold ${Math.round(height * 0.046)}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 15;
    } else if (style === 'neon') {
      ctx.font = `bold ${Math.round(height * 0.048)}px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#f472b6';
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 30;
    } else {
      ctx.font = `bold ${Math.round(height * 0.048)}px "Outfit", sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
    }

    // Wrap Title lines
    const maxTitleWidth = width - margin * 2;
    const words = cleanTitle.split(' ');
    let line = '';
    let currentY = titleY;
    const lineHeight = height * 0.058;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTitleWidth && i > 0) {
        ctx.fillText(line.trim(), margin, currentY);
        line = words[i] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), margin, currentY);

    // Subtitle / Logline
    ctx.shadowBlur = 0;
    ctx.font = `500 ${Math.round(height * 0.02)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#cbd5e1';
    const subText = project.logline || topic.tagline;
    ctx.fillText(subText.slice(0, 110) + (subText.length > 110 ? '...' : ''), margin, currentY + height * 0.038);

    // Bottom Credits Line
    ctx.font = `600 ${Math.round(height * 0.016)}px "JetBrains Mono", monospace`;
    ctx.fillStyle = '#ec4899';
    const credits = `CINEGEN 3D STUDIO • SYNCHRONIZED NARRATION • THREE.JS 60 FPS`;
    ctx.fillText(credits, margin, height - height * 0.05);
    ctx.restore();

    return canvas.toDataURL('image/png');
  }

  /**
   * Triggers direct browser download of the full-resolution Cover Page image
   */
  static async downloadCoverImage(
    project: Project,
    style: CoverStyle = 'cinematic',
    filename?: string
  ): Promise<void> {
    const dataUrl = await this.generateCoverCanvas(project, { style, width: 1920, height: 1080 });
    const name = filename || `${(project.title || 'video').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_cover_art.png`;

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
