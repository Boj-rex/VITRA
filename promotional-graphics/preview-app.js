/**
 * Vitra Commercial Promotional Graphics Studio
 * Interactive Workspace Controller
 * 3D Commercial Advertising Suite & Tactile Sculptural Relief
 */

(function () {
  'use strict';

  // --- Graphic Meta & Social Copy Playbooks ---
  const GRAPHICS_DATA = {
    'promo-01': {
      title: '01 · Hero Master Commercial Banner',
      ratio: '16:9 Landscape (1376 × 768 px)',
      exportFile: 'exports/01-commercial-hero-banner.png',
      caption: `🚀 Stop getting filtered out by robot recruiters. Build an ATS CV that actually lands interviews.

Most CV templates fail before a hiring manager ever sees them because automated applicant tracking systems (Workday, Lever, Greenhouse) can't parse nested tables, flashy multi-columns, or unreadable graphics.

Vitra is engineered for 98% ATS pass rates:
✅ Single-column deterministic parsing
✅ Native Nigerian presets: SSCE, ND, HND, BSc, SIWES & NYSC
✅ Gemini AI bullet writer with zero fake hallucinations
✅ Instant Word (.docx) & Vector PDF downloads
✅ Transparent pricing in Naira starting from ₦6,000 (via Paystack)

Get started at vitra.app — packages start at ₦6,000!

#Vitra #ATSResume #CareerNigeria #TechJobs #JobHunt #NYSC #LagosTech #Hiring2026`
    },
    'promo-02': {
      title: '02 · Commercial Story & Reels Vertical',
      ratio: '9:16 Vertical (768 × 1376 px)',
      exportFile: 'exports/02-commercial-story-vertical.png',
      caption: `Does your CV pass the robot screener? 👀📲

75% of CVs are thrown in the digital trash bin by automated applicant tracking filters before a human ever reads them.

Here is how Vitra changes the game:
1️⃣ Clean single-column layout screeners love
2️⃣ Formatted specifically for Nigerian institutions (SSCE, Poly, Uni, NYSC)
3️⃣ Real metrics that make recruiters call you back
4️⃣ Editable Word & PDF formats ready to send

🔗 Link in bio or visit vitra.app to get started! Packages start at ₦6,000.

#JobSearch #NigerianYouth #CareerAdvice #ATSResume #InterviewTips #ReelsNigeria #Vitra`
    },
    'promo-03': {
      title: '03 · Commercial Square Post',
      ratio: '1:1 Square (1024 × 1024 px)',
      exportFile: 'exports/03-commercial-square-post.png',
      caption: `“Why haven’t I heard back from any jobs I applied to?” 🤔

If you designed your CV with fancy 2-column tables, skill bars, or graphic icons, recruitment algorithms are likely reading it as blank gibberish.

Vitra is built with a verified 98% ATS pass rate:
• Single-column clean text layer that screeners index 100%
• Built-in Nigerian academic & service credential presets
• Ethical AI bullet polishing for real impact
• Pay once starting from ₦6,000 via Paystack — zero hidden monthly subscriptions

Build your recruiter-approved CV today at vitra.app.

#CareerGrowth #JobHunting #ATSResume #NigerianTech #RemoteWork #Vitra`
    },
    'promo-04': {
      title: '04 · Pricing & Deals Showcase',
      ratio: '1:1 Square (1024 × 1024 px)',
      exportFile: 'exports/04-pricing-showcase-commercial.png',
      caption: `Honest Nigerian pricing. No monthly recurring fees. No sneaky USD conversion rates. 💳✨

Transparent packages starting at ₦6,000. Choose the tier that matches your career momentum:

⭐️ STARTER (₦6,000): 2 Distinct CVs, 9 ATS templates, Word + PDF downloads. Perfect for graduates and entry-level talent.
🔥 PRO CAREER (₦15,000) [MOST POPULAR]: Up to 6 CVs with multi-role tailoring for mid-level professionals and career switchers.
👑 EXECUTIVE (₦20,000): Up to 13 CVs for leadership, executives, and multi-track consulting.

Secure Paystack checkout with Card, Bank Transfer, or USSD.

Get yours now at vitra.app!

#Vitra #PricingTransparency #Paystack #CareerTech #NigerianStartups #AffordableTech`
    },
    'promo-05': {
      title: '05 · 3D Tactile Sculptural Masterpiece',
      ratio: '1:1 Square (1024 × 1024 px)',
      exportFile: 'exports/05-tactile-sculptural-masterpiece.png',
      caption: `Crafted with intention. Engineered for precision. 🏛️✨

Behind every successful career is a story that deserves to be read. 

We crafted Vitra as a tactile, thoughtful studio where Nigerian graduates, NYSC corp members, and African leaders can build world-class CVs that command respect across Lagos, London, and Silicon Valley.

Featuring:
• 98% ATS Screener Pass Rate
• Single-column recruiter-verified typography
• Zero fabricated experience
• Native recognition of African degrees and service

Read the story and craft your document at vitra.app.

#DesignExcellence #VitraManifesto #CareerEmpowerment #AfricanTalent #GlobalOpportunity`
    },
    'promo-06': {
      title: '06 · Campaign Presentation Board',
      ratio: '9:16 Vertical (768 × 1376 px)',
      exportFile: 'exports/06-campaign-showcase-board.png',
      caption: `Introducing the Vitra 2026 Commercial Campaign Suite. 🚀

A complete promotional ecosystem spanning:
• Wide Master Banners for Twitter/X, LinkedIn & Web
• High-converting 9:16 Vertical Stories for Instagram & TikTok
• High-impact Square Commercial Posts for feeds
• Full transparent pricing showcases
• Bespoke 3D tactile brand artistry

Explore the complete campaign and build your ATS-ready CV at vitra.app.

#MarketingDesign #BrandCampaign #Vitra #ATSResume #ProductDesign #CaseStudy`
    }
  };

  // --- DOM Elements ---
  const navItems = document.querySelectorAll('.nav-item');
  const graphicCards = document.querySelectorAll('.graphic-card');
  const stageTitle = document.getElementById('current-graphic-title');
  const stageRatio = document.getElementById('current-graphic-ratio');
  const captionText = document.getElementById('caption-text');
  const copyCaptionBtn = document.getElementById('copy-caption-btn');
  const themeBtns = document.querySelectorAll('.theme-btn');
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const zoomFitBtn = document.getElementById('zoom-fit');
  const zoomLevelLabel = document.getElementById('zoom-level');
  const viewport = document.getElementById('viewport');
  const canvasWrapper = document.getElementById('canvas-wrapper');
  const downloadBtn = document.getElementById('download-current-png');

  // --- State Variables ---
  let currentTargetId = 'promo-01';
  let currentZoom = 0.65;

  // --- Initialize Studio ---
  function init() {
    setupNavListeners();
    setupThemeListeners();
    setupZoomListeners();
    setupCaptionCopy();
    setupDownloadListener();

    // Select initial graphic
    selectGraphic('promo-01', true);
  }

  // --- Graphic Selection & Stage Update ---
  function selectGraphic(targetId, isInitial = false) {
    if (!GRAPHICS_DATA[targetId]) return;
    currentTargetId = targetId;

    // Update Nav Items
    navItems.forEach(item => {
      if (item.getAttribute('data-target') === targetId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update Stage Cards
    graphicCards.forEach(card => {
      if (card.id === targetId) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // Update Metadata
    const data = GRAPHICS_DATA[targetId];
    if (stageTitle) stageTitle.textContent = data.title;
    if (stageRatio) stageRatio.textContent = data.ratio;
    if (captionText) captionText.value = data.caption;

    // Fit to screen on selection
    fitToScreen();
  }

  // --- Navigation Event Listeners ---
  function setupNavListeners() {
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetId = item.getAttribute('data-target');
        selectGraphic(targetId);
      });
    });
  }

  // --- Theme Toggling ---
  function setupThemeListeners() {
    themeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme');
        themeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Apply theme to body
        document.body.className = theme;
      });
    });
  }

  // --- Zoom & Fit Calculations ---
  function applyZoom(zoom) {
    currentZoom = Math.min(Math.max(zoom, 0.15), 1.8);
    if (canvasWrapper) {
      canvasWrapper.style.transform = `scale(${currentZoom})`;
    }
    if (zoomLevelLabel) {
      zoomLevelLabel.textContent = `${Math.round(currentZoom * 100)}%`;
    }
  }

  function fitToScreen() {
    if (!viewport) return;
    const activeCard = document.getElementById(currentTargetId);
    if (!activeCard) return;

    const vpWidth = viewport.clientWidth - 80;
    const vpHeight = viewport.clientHeight - 80;

    const cardWidth = parseInt(activeCard.getAttribute('data-w') || '1024', 10);
    const cardHeight = parseInt(activeCard.getAttribute('data-h') || '1024', 10);

    const scaleX = vpWidth / cardWidth;
    const scaleY = vpHeight / cardHeight;
    const fitScale = Math.min(scaleX, scaleY, 1.0);

    applyZoom(fitScale);
  }

  function setupZoomListeners() {
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        applyZoom(currentZoom + 0.1);
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        applyZoom(currentZoom - 0.1);
      });
    }

    if (zoomFitBtn) {
      zoomFitBtn.addEventListener('click', () => {
        fitToScreen();
      });
    }

    // Auto recalculate on window resize
    window.addEventListener('resize', () => {
      fitToScreen();
    });
  }

  // --- Copy Caption to Clipboard ---
  function setupCaptionCopy() {
    if (!copyCaptionBtn || !captionText) return;

    copyCaptionBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(captionText.value);
        const originalText = copyCaptionBtn.textContent;
        copyCaptionBtn.textContent = 'Copied!';
        copyCaptionBtn.classList.add('copied');

        setTimeout(() => {
          copyCaptionBtn.textContent = originalText;
          copyCaptionBtn.classList.remove('copied');
        }, 2200);
      } catch (err) {
        captionText.select();
        document.execCommand('copy');
        copyCaptionBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyCaptionBtn.textContent = 'Copy';
        }, 2000);
      }
    });
  }

  // --- PNG Download Handler ---
  function setupDownloadListener() {
    if (!downloadBtn) return;

    downloadBtn.addEventListener('click', () => {
      const data = GRAPHICS_DATA[currentTargetId];
      if (!data) return;

      const link = document.createElement('a');
      link.href = data.exportFile;
      link.download = data.exportFile.split('/').pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showDownloadToast(data.exportFile.split('/').pop());
    });
  }

  function showDownloadToast(fileName) {
    const toast = document.createElement('div');
    toast.className = 'download-toast';
    toast.innerHTML = `
      <span class="toast-dot"></span>
      <span>Downloading <strong>${fileName}</strong></span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3000);
  }

  // Start on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
