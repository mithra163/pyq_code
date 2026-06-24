'use client';

import { useEffect, useRef } from 'react';

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
}

export function VisualEffects() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Mouse Coordinate Tracking & Snapping Cursor & Magnetic Pull
  useEffect(() => {
    // Check if device supports touch
    const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    const cursor = cursorRef.current;
    if (isTouch && cursor) {
      cursor.style.display = 'none';
      return;
    }

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let snapEl: HTMLElement | null = null;
    let magneticEl: HTMLElement | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Track snapping & magnetic pull to interactive elements
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      const interactive = target.closest('a, button, input, select, textarea, .btn, .badge, .glass-card, [data-cursor-hover]');
      
      if (interactive && cursor) {
        // Designate magnetic element (within 25px threshold)
        const isMagnetic = interactive.closest('a, button, .btn, .badge, [data-cursor-hover]');
        if (isMagnetic) {
          magneticEl = isMagnetic as HTMLElement;
        }

        if (interactive.classList.contains('glass-card')) {
          snapEl = null;
          cursor.classList.add('cursor-card-hover');
          cursor.classList.remove('cursor-magnetic');
          cursor.style.width = '56px';
          cursor.style.height = '56px';
          cursor.style.borderRadius = '50%';
          cursor.style.backgroundColor = 'rgba(14, 147, 0, 0.06)';
          cursor.style.borderColor = 'rgba(14, 147, 0, 0.6)';
        } else {
          snapEl = interactive as HTMLElement;
          cursor.classList.add('cursor-magnetic');
          cursor.classList.remove('cursor-card-hover');
          const rect = interactive.getBoundingClientRect();
          const style = window.getComputedStyle(interactive);
          cursor.style.width = `${rect.width + 12}px`;
          cursor.style.height = `${rect.height + 12}px`;
          cursor.style.borderRadius = style.borderRadius || '8px';
          cursor.style.backgroundColor = 'rgba(14, 147, 0, 0.05)';
          cursor.style.borderColor = 'rgba(14, 147, 0, 0.9)';
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const interactive = target.closest('a, button, input, select, textarea, .btn, .badge, .glass-card, [data-cursor-hover]');
      
      if (interactive && cursor) {
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (!relatedTarget || !relatedTarget.closest('a, button, input, select, textarea, .btn, .badge, .glass-card, [data-cursor-hover]')) {
          snapEl = null;
          cursor.classList.remove('cursor-magnetic', 'cursor-card-hover');
          cursor.style.width = '24px';
          cursor.style.height = '24px';
          cursor.style.borderRadius = '50%';
          cursor.style.backgroundColor = 'rgba(14, 147, 0, 0.04)';
          cursor.style.borderColor = 'var(--green-neon)';
        }
      }

      // Reset magnetic offset
      if (magneticEl) {
        const relativeTarget = e.relatedTarget as HTMLElement;
        if (!relativeTarget || !relativeTarget.closest('a, button, .btn, .badge, [data-cursor-hover]')) {
          magneticEl.style.transform = 'translate3d(0px, 0px, 0px)';
          magneticEl.style.transition = 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)';
          magneticEl = null;
        }
      }
    };

    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mouseout', handleMouseOut);

    // Perform smooth damping & parallax grid rotation at 60fps
    let animId = 0;
    const updateLoop = () => {
      // 1. Move Custom Snapping Cursor
      if (cursor) {
        let targetX = mouseX;
        let targetY = mouseY;

        if (snapEl) {
          const rect = snapEl.getBoundingClientRect();
          targetX = rect.left + rect.width / 2;
          targetY = rect.top + rect.height / 2;
        }

        ringX += (targetX - ringX) * 0.16;
        ringY += (targetY - ringY) * 0.16;

        cursor.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate3d(-50%, -50%, 0)`;
      }

      // 2. Perform Parallax Tilt on the Quantum Grid along a 3D Z-axis
      const grid = gridRef.current;
      if (grid) {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const dx = mouseX - cx;
        const dy = mouseY - cy;
        const rx = (dy / cy) * 6; // max 6 degrees tilt
        const ry = -(dx / cx) * 6; // max 6 degrees tilt
        grid.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
      }

      // 3. Apply Magnetic Pull (Warp element subtly and scale 1.02x within 25px threshold)
      if (magneticEl) {
        const rect = magneticEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = mouseX - centerX;
        const dy = mouseY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 70) {
          const pullX = dx * 0.26;
          const pullY = dy * 0.26;
          magneticEl.style.transform = `translate3d(${pullX}px, ${pullY}px, 0) scale(1.02)`;
          magneticEl.style.transition = 'none';
        } else {
          magneticEl.style.transform = 'translate3d(0px, 0px, 0px)';
          magneticEl.style.transition = 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)';
        }
      }

      animId = requestAnimationFrame(updateLoop);
    };
    updateLoop();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(animId);
    };
  }, []);

  // HTML5 Canvas Neural Node Background with Shockwave ripples
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let ripples: Ripple[] = [];

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      text: string;
      baseAlpha: number;
      alpha: number;
      currentSpeedMultiplier: number;
      twinkleOffset: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = (Math.random() - 0.5) * 0.35;
        const codes = ['01', '10', 'CORE', 'DATA', 'HASH', 'SYS', 'NET', 'P2P', 'API', 'UPLINK', 'NODE', 'ARCHIVE', '0x93', '0x0E', '0x1E', '0xDB'];
        this.text = codes[Math.floor(Math.random() * codes.length)];
        this.baseAlpha = Math.random() * 0.12 + 0.05;
        this.alpha = this.baseAlpha;
        this.currentSpeedMultiplier = 1;
        this.twinkleOffset = Math.random() * Math.PI * 2;
      }

      update(mouseX: number, mouseY: number) {
        this.x += this.vx * this.currentSpeedMultiplier;
        this.y += this.vy * this.currentSpeedMultiplier;

        // Smoothly decay speed multiplier back to 1
        this.currentSpeedMultiplier += (1 - this.currentSpeedMultiplier) * 0.08;

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;

        // Mouse attraction
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 160) {
          const force = (160 - dist) / 160;
          const angle = Math.atan2(dy, dx);
          this.x += Math.cos(angle) * force * 0.45;
          this.y += Math.sin(angle) * force * 0.45;
          this.alpha = Math.min(0.55, this.baseAlpha + force * 0.3);
        } else {
          this.alpha += (this.baseAlpha - this.alpha) * 0.05;
        }
      }

      draw(c: CanvasRenderingContext2D, activeRipples: Ripple[]) {
        let currentAlpha = this.alpha;
        let sizeScale = 1;
        let speedBoost = 1;
        
        // Ripple proximity detection
        for (const r of activeRipples) {
          const dx = this.x - r.x;
          const dy = this.y - r.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < r.radius + 60 && dist > r.radius - 60) {
            const force = 1 - Math.abs(dist - r.radius) / 60;
            currentAlpha = Math.min(0.95, currentAlpha + force * 0.7);
            sizeScale = 1 + force * 0.45;
            speedBoost = 1 + force * 3.5;
          }
        }

        this.currentSpeedMultiplier = speedBoost;

        // Apply a twinkling sine wave
        const twinkle = Math.sin(Date.now() * 0.0025 + this.twinkleOffset) * 0.35 + 0.65;
        const finalAlpha = Math.max(0.02, currentAlpha * twinkle);

        c.save();
        c.strokeStyle = `rgba(14, 147, 0, ${finalAlpha})`;
        c.fillStyle = `rgba(14, 147, 0, ${finalAlpha * 0.8})`;
        c.lineWidth = 0.8;

        const size = 3.5 * sizeScale;

        // Draw dynamic glowing constellation star (four-pointed diamond star)
        c.beginPath();
        c.moveTo(this.x, this.y - size);
        c.lineTo(this.x + size / 2.2, this.y);
        c.lineTo(this.x, this.y + size);
        c.lineTo(this.x - size / 2.2, this.y);
        c.closePath();
        c.fill();

        // Draw crosshair intersection line for the tech map style
        c.beginPath();
        c.moveTo(this.x - size * 1.8, this.y);
        c.lineTo(this.x + size * 1.8, this.y);
        c.moveTo(this.x, this.y - size * 1.8);
        c.lineTo(this.x, this.y + size * 1.8);
        c.stroke();

        // Faint binary packet label
        c.font = `${Math.floor(7.5 * sizeScale)}px 'JetBrains Mono', monospace`;
        c.fillText(this.text, this.x + size + 4, this.y + 3);
        
        c.restore();
      }
    }

    class DustParticle {
      x: number;
      y: number;
      size: number;
      vx: number;
      vy: number;
      alpha: number;
      twinkleOffset: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 1.5 + 0.4;
        this.vx = (Math.random() - 0.5) * 0.06;
        this.vy = (Math.random() - 0.5) * 0.06;
        this.alpha = Math.random() * 0.12 + 0.03;
        this.twinkleOffset = Math.random() * Math.PI * 2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }

      draw(c: CanvasRenderingContext2D) {
        const twinkle = Math.sin(Date.now() * 0.0018 + this.twinkleOffset) * 0.35 + 0.65;
        c.fillStyle = `rgba(14, 147, 0, ${this.alpha * twinkle})`;
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fill();
      }
    }

    let particles: Particle[] = [];
    let dust: DustParticle[] = [];
    const initParticles = () => {
      const count = window.innerWidth < 768 ? 20 : 50;
      const dustCount = window.innerWidth < 768 ? 40 : 100;
      particles = [];
      dust = [];
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
      for (let i = 0; i < dustCount; i++) {
        dust.push(new DustParticle());
      }
    };

    initParticles();

    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    // Listen for shockwave click triggers
    const handleMouseDown = (e: MouseEvent) => {
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: 280,
        speed: 7,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mousedown', handleMouseDown);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    let animId = 0;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw soft glowing center-screen green nebula
      const centerGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, Math.max(width, height) * 0.7);
      centerGrad.addColorStop(0, 'rgba(14, 147, 0, 0.045)');
      centerGrad.addColorStop(0.5, 'rgba(14, 147, 0, 0.015)');
      centerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = centerGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw mouse-following soft green aura (space ambient connection)
      if (mouseX !== -1000 && mouseY !== -1000) {
        const mouseGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 280);
        mouseGrad.addColorStop(0, 'rgba(14, 147, 0, 0.045)');
        mouseGrad.addColorStop(0.5, 'rgba(14, 147, 0, 0.01)');
        mouseGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = mouseGrad;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 280, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Draw slowly drifting space dust particles
      for (let i = 0; i < dust.length; i++) {
        dust[i].update();
        dust[i].draw(ctx);
      }

      // Render ripples
      ctx.lineWidth = 1.5;
      ripples = ripples.filter((r) => {
        r.radius += r.speed;
        
        const progress = r.radius / r.maxRadius;
        const opacity = 1 - progress;
        if (opacity > 0) {
          ctx.strokeStyle = `rgba(30, 219, 6, ${opacity * 0.25})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(30, 219, 6, 0.4)';
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0; // reset shadow
        }
        
        return r.radius < r.maxRadius;
      });

      // Connections line properties
      const connectionDist = 120;
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update(mouseX, mouseY);
        p1.draw(ctx, ripples);

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            let opacity = (1 - dist / connectionDist) * 0.08 * ((p1.alpha + p2.alpha) / 2);
            
            // Check for ripple light up
            for (const r of ripples) {
              const rDx = p1.x - r.x;
              const rDy = p1.y - r.y;
              const rDist = Math.sqrt(rDx * rDx + rDy * rDy);
              if (rDist < r.radius + 50 && rDist > r.radius - 50) {
                const force = 1 - Math.abs(rDist - r.radius) / 50;
                opacity = Math.min(0.4, opacity + force * 0.25);
              }
            }

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(14, 147, 0, ${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();

            // Triangle mesh mapping for constellation star-cell layout
            for (let k = j + 1; k < particles.length; k++) {
              const p3 = particles[k];
              const dx2 = p2.x - p3.x;
              const dy2 = p2.y - p3.y;
              const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

              const dx3 = p3.x - p1.x;
              const dy3 = p3.y - p1.y;
              const dist3 = Math.sqrt(dx3 * dx3 + dy3 * dy3);

              if (dist < connectionDist && dist2 < connectionDist && dist3 < connectionDist) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(p3.x, p3.y);
                ctx.closePath();
                ctx.fillStyle = `rgba(14, 147, 0, ${0.015 * ((p1.alpha + p2.alpha + p3.alpha) / 3)})`;
                ctx.fill();
              }
            }
          }
        }
      }

      // Map lines ONLY to the closest 4 or 5 nodes within 200px of custom cursor
      if (mouseX !== -1000 && mouseY !== -1000) {
        const particlesWithDist = particles.map(p => {
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          return { p, dist };
        });

        const closeNodes = particlesWithDist
          .filter(item => item.dist < 200)
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 5);

        closeNodes.forEach(item => {
          const p = item.p;
          const opacity = (1 - item.dist / 200) * 0.16;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouseX, mouseY);
          ctx.strokeStyle = `rgba(14, 147, 0, ${opacity})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        });
      }

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Cryptographic Scramble Text Effect exclusively on Mount (Initial Load)
  useEffect(() => {
    const chars = '!@#$%^&*()_+~|{}[]:;?><,./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    function scrambleTextNode(node: Text, originalText: string, delay: number) {
      let frame = 0;
      const queue: Array<{ to: string; start: number; end: number; char?: string }> = [];
      
      for (let i = 0; i < originalText.length; i++) {
        const to = originalText[i];
        if (to === ' ' || to === '\n') {
          queue.push({ to, start: 0, end: 0 });
          continue;
        }
        const start = Math.floor(Math.random() * 6);
        const end = start + Math.floor(Math.random() * 8) + 4;
        queue.push({ to, start, end });
      }
      
      let timer: NodeJS.Timeout;
      function update() {
        let output = '';
        let complete = 0;
        
        for (let i = 0; i < queue.length; i++) {
          const { to, start, end } = queue[i];
          if (to === ' ' || to === '\n') {
            output += to;
            complete++;
          } else if (frame >= end) {
            complete++;
            output += to;
          } else if (frame >= start) {
            if (!queue[i].char || Math.random() < 0.28) {
              queue[i].char = chars[Math.floor(Math.random() * chars.length)];
            }
            output += queue[i].char;
          } else {
            output += ' ';
          }
        }
        
        node.nodeValue = output;
        
        if (complete < queue.length) {
          frame++;
          timer = setTimeout(update, 18);
        } else {
          node.nodeValue = originalText;
        }
      }
      
      timer = setTimeout(update, delay);
      return () => clearTimeout(timer);
    }

    const scrambleElement = (el: HTMLElement) => {
      const textNodes: Array<{ node: Text; text: string }> = [];
      const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      let node: Node | null;
      while (node = walk.nextNode()) {
        textNodes.push({ node: node as Text, text: node.nodeValue || '' });
      }
      
      const cleanups = textNodes.map(({ node, text }, idx) => {
        return scrambleTextNode(node, text, idx * 30 + 20);
      });

      return () => {
        cleanups.forEach(c => c());
      };
    };

    // Scramble items with class .scramble-text or attribute data-scramble exclusively on mount
    const elements = document.querySelectorAll('.scramble-text, [data-scramble]');
    const cleanups = Array.from(elements).map(el => scrambleElement(el as HTMLElement));

    return () => {
      cleanups.forEach(c => c());
    };
  }, []);

  return (
    <>
      {/* Layer 1: The Quantum Grid */}
      <div
        ref={gridRef}
        className="quantum-grid"
        style={{
          position: 'fixed',
          inset: '-8%',
          width: '116vw',
          height: '116vh',
          zIndex: -2,
          pointerEvents: 'none',
          backgroundSize: '45px 45px',
          backgroundImage: `
            linear-gradient(to right, rgba(14, 147, 0, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(14, 147, 0, 0.04) 1px, transparent 1px)
          `,
          transformStyle: 'preserve-3d',
          perspective: '1000px',
          transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)',
          willChange: 'transform',
          transition: 'transform 0.4s cubic-bezier(0.1, 0.75, 0.25, 1)',
        }}
      />

      {/* Layer 2: Neural Nodes Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />

      {/* Custom snuggled snapping cursor */}
      <div
        ref={cursorRef}
        className="custom-cursor-ring"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 24,
          height: 24,
          border: '1.5px solid var(--green-neon)',
          background: 'rgba(14, 147, 0, 0.04)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9999,
          transform: 'translate3d(-100px, -100px, 0) translate3d(-50%, -50%, 0)',
          willChange: 'transform, width, height, border-radius, background-color, border-color',
          transition: 'width 0.2s cubic-bezier(0.25, 1, 0.5, 1), height 0.2s cubic-bezier(0.25, 1, 0.5, 1), border-radius 0.2s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.2s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.2s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      />
    </>
  );
}
