"""
Vitra Promotional Graphics Generator
Generates high-resolution, pixel-perfect promotional graphics combining:
- 20% Claymorphism (tactile inflated 3D pills, inner shadows, soft clay badges)
- 40% Glassmorphism (frosted translucent cards, specular 1px border glows, diffused colored orbs)
- 40% Minimalism (Swiss typographic hierarchy, generous negative space, crisp editorial focus)
"""

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "exports")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def create_radial_glow(width, height, cx, cy, radius, color_rgba):
    """Creates a diffused luminous color orb for glassmorphism refraction."""
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    
    # Draw radial gradient
    r, g, b, max_a = color_rgba
    steps = 40
    for i in range(steps, 0, -1):
        current_rad = int(radius * (i / steps))
        alpha = int(max_a * ((steps - i + 1) / steps) * 0.4)
        draw.ellipse(
            [cx - current_rad, cy - current_rad, cx + current_rad, cy + current_rad],
            fill=(r, g, b, alpha)
        )
    return glow.filter(ImageFilter.GaussianBlur(radius=radius // 3))

def draw_glass_card(draw, box, border_color=(255, 255, 255, 45), fill_color=(255, 255, 255, 18), radius=28):
    """Draws a sleek frosted glass container with specular edge highlight."""
    x0, y0, x1, y1 = box
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill_color, outline=border_color, width=2)
    # Specular top edge shimmer
    draw.line([x0 + radius, y0, x1 - radius, y0], fill=(255, 255, 255, 90), width=2)

def draw_clay_pill(base_img, box, bg_color=(248, 216, 73), text_color=(17, 17, 17), text="ATS 98%", font=None, radius=24):
    """Draws a 3D inflated claymorphic pill with tactile dual inner and drop shadows."""
    x0, y0, x1, y1 = box
    pill_img = Image.new("RGBA", base_img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(pill_img)
    
    # Outer drop shadow
    shadow_offset = 6
    draw.rounded_rectangle(
        [x0 + shadow_offset, y0 + shadow_offset, x1 + shadow_offset, y1 + shadow_offset],
        radius=radius,
        fill=(0, 0, 0, 80)
    )
    pill_img = pill_img.filter(ImageFilter.GaussianBlur(radius=6))
    
    # Main Clay Surface
    draw_main = ImageDraw.Draw(pill_img)
    draw_main.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=bg_color)
    
    # Top-Left Clay Highlight (simulating 3D clay inflation)
    draw_main.arc([x0 + 2, y0 + 2, x1 - 2, y1 - 2], start=180, end=270, fill=(255, 255, 255, 160), width=4)
    # Bottom-Right Clay Shadow
    draw_main.arc([x0 + 2, y0 + 2, x1 - 2, y1 - 2], start=0, end=90, fill=(0, 0, 0, 60), width=4)
    
    if text and font:
        # Measure text using getbbox
        bbox = font.getbbox(text)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = x0 + (x1 - x0 - tw) // 2
        ty = y0 + (y1 - y0 - th) // 2 - 2
        draw_main.text((tx, ty), text, font=font, fill=text_color)
        
    return Image.alpha_composite(base_img, pill_img)

def get_font(size, bold=False):
    """Fallback-safe system font resolver."""
    possible_fonts = [
        "C:\\Windows\\Fonts\\segoeui.ttf" if not bold else "C:\\Windows\\Fonts\\segoeuib.ttf",
        "C:\\Windows\\Fonts\\arial.ttf" if not bold else "C:\\Windows\\Fonts\\arialbd.ttf",
        "C:\\Windows\\Fonts\\calibri.ttf" if not bold else "C:\\Windows\\Fonts\\calibrib.ttf",
    ]
    for fp in possible_fonts:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size)
            except Exception:
                continue
    return ImageFont.load_default()

# --------------------------------------------------------------------------
# GRAPHIC 01: HERO LAUNCH (1080x1080 Square - Instagram / LinkedIn Post)
# --------------------------------------------------------------------------
def render_graphic_01():
    w, h = 1080, 1080
    img = Image.new("RGBA", (w, h), (14, 18, 26, 255)) # Deep Obsidian
    
    # Ambient Light Orbs for Glassmorphism
    emerald_glow = create_radial_glow(w, h, 280, 260, 420, (16, 185, 129, 90))
    cobalt_glow = create_radial_glow(w, h, 820, 780, 440, (59, 130, 246, 80))
    amber_glow = create_radial_glow(w, h, 750, 250, 300, (245, 158, 11, 60))
    
    img = Image.alpha_composite(img, emerald_glow)
    img = Image.alpha_composite(img, cobalt_glow)
    img = Image.alpha_composite(img, amber_glow)
    
    draw = ImageDraw.Draw(img)
    
    # Minimalist Grid Lines (Subtle architectural drafting lines)
    for x in range(80, w, 160):
        draw.line([x, 0, x, h], fill=(255, 255, 255, 8), width=1)
    for y in range(80, h, 160):
        draw.line([0, y, w, y], fill=(255, 255, 255, 8), width=1)
        
    # 40% Glassmorphism Card (Center stage document mockup)
    glass_box = [100, 220, 980, 920]
    draw_glass_card(draw, glass_box, border_color=(255, 255, 255, 45), fill_color=(25, 32, 48, 140), radius=36)
    
    # Inner Frosted Header Bar
    draw_glass_card(draw, [140, 260, 940, 360], border_color=(255, 255, 255, 30), fill_color=(255, 255, 255, 12), radius=20)
    
    font_brand = get_font(32, bold=True)
    font_sub = get_font(18, bold=False)
    draw.text((170, 290), "VITRA CAREER STUDIO", font=font_brand, fill=(255, 255, 255, 240))
    draw.text((170, 325), "THOUGHTFUL ATS CV BUILDER · 2026 EDITION", font=font_sub, fill=(16, 185, 129, 220))
    
    # Big Minimalist Hero Typography
    font_hero = get_font(62, bold=True)
    font_hero_light = get_font(52, bold=False)
    
    # Top Brand Stamp
    font_top = get_font(22, bold=True)
    draw.text((100, 130), "VITRA // NEW RELEASE", font=font_top, fill=(16, 185, 129, 255))
    draw.text((100, 165), "crafting career stories that get out of your way", font=get_font(20, bold=False), fill=(160, 175, 195, 220))
    
    # Inside the Glass Panel - Clean Editorial CV Presentation
    draw.text((160, 410), "Built for Nigerian Roles &", font=font_hero, fill=(255, 255, 255, 255))
    draw.text((160, 485), "Global Remote Jobs.", font=font_hero, fill=(248, 216, 73, 255))
    
    desc_font = get_font(22, bold=False)
    desc_lines = [
        "• 9 Recruiter-approved ATS templates (Workday & Lever tested)",
        "• Deterministic ATS parsing engine — zero hallucinated credentials",
        "• First-class support for SSCE, ND, HND, BSc, SIWES & NYSC",
        "• Vector PDF & editable Word (.docx) instant export",
    ]
    dy = 590
    for line in desc_lines:
        draw.text((160, dy), line, font=desc_font, fill=(210, 220, 235, 240))
        dy += 46
        
    # 20% Claymorphism: Floating Tactile 3D Pills
    # Clay Pill 1: ATS 98% Score (Emerald Clay)
    font_pill = get_font(20, bold=True)
    img = draw_clay_pill(img, [720, 120, 980, 180], bg_color=(16, 185, 129), text_color=(255, 255, 255), text="★ 98% ATS PASS", font=font_pill, radius=24)
    
    # Clay Pill 2: Pricing Deal (Warm Sunshine Clay)
    img = draw_clay_pill(img, [160, 810, 460, 876], bg_color=(248, 216, 73), text_color=(17, 17, 17), text="START FROM ₦6,000", font=font_pill, radius=20)
    
    # Clay Pill 3: Instant DOCX/PDF
    img = draw_clay_pill(img, [500, 810, 820, 876], bg_color=(59, 130, 246), text_color=(255, 255, 255), text="PDF + DOCX INCLUDED", font=font_pill, radius=20)

    # Save
    out_path = os.path.join(OUTPUT_DIR, "01-launch-hero-square.png")
    img.save(out_path, "PNG", optimize=True)
    print(f"Saved {out_path} ({os.path.getsize(out_path) // 1024} KB)")

# --------------------------------------------------------------------------
# GRAPHIC 02: TWITTER / LINKEDIN BANNER (1200x630 Landscape)
# --------------------------------------------------------------------------
def render_graphic_02():
    w, h = 1200, 630
    img = Image.new("RGBA", (w, h), (11, 15, 23, 255))
    
    # Ambient glows
    img = Image.alpha_composite(img, create_radial_glow(w, h, 200, 300, 380, (16, 185, 129, 80)))
    img = Image.alpha_composite(img, create_radial_glow(w, h, 950, 320, 420, (59, 130, 246, 85)))
    img = Image.alpha_composite(img, create_radial_glow(w, h, 600, 100, 250, (236, 72, 153, 50)))
    
    draw = ImageDraw.Draw(img)
    
    # Minimalist Grid Background
    for x in range(60, w, 120):
        draw.line([x, 0, x, h], fill=(255, 255, 255, 6), width=1)
        
    # Left Column: Minimalist Typography & Brand Mission
    font_badge = get_font(18, bold=True)
    draw.text((80, 80), "VITRA CAREER STUDIO · ATS ENGINE 2.0", font=font_badge, fill=(16, 185, 129, 255))
    
    font_main = get_font(54, bold=True)
    draw.text((80, 130), "Stop getting filtered out", font=font_main, fill=(255, 255, 255, 255))
    draw.text((80, 195), "by robot recruiters.", font=font_main, fill=(248, 216, 73, 255))
    
    font_body = get_font(20, bold=False)
    draw.text((80, 280), "Precision-crafted for Nigerian graduates, NYSC corp", font=font_body, fill=(185, 198, 215, 230))
    draw.text((80, 312), "members & senior professionals pursuing global offers.", font=font_body, fill=(185, 198, 215, 230))
    
    # 40% Glassmorphism: Right-side Live Specimen Card
    glass_box = [670, 80, 1130, 550]
    draw_glass_card(draw, glass_box, border_color=(255, 255, 255, 40), fill_color=(20, 26, 40, 160), radius=32)
    
    # Inner glass metrics in card
    draw_glass_card(draw, [710, 120, 1090, 210], border_color=(255, 255, 255, 25), fill_color=(255, 255, 255, 10), radius=18)
    draw.text((740, 140), "READABILITY INDEX", font=get_font(16, bold=True), fill=(16, 185, 129, 230))
    draw.text((740, 165), "98 / 100 · Screener Approved", font=get_font(24, bold=True), fill=(255, 255, 255, 255))
    
    # Document Feature Rows
    features = [
        "✓ Single-column ATS parsing layer",
        "✓ Clean hanging-indent bullet hierarchy",
        "✓ Workday, Taleo & Lever compliance",
        "✓ Pay with Paystack in Nigerian Naira",
    ]
    fy = 240
    for f in features:
        draw.text((720, fy), f, font=get_font(18, bold=False), fill=(220, 230, 245, 240))
        fy += 42
        
    # 20% Claymorphism: CTA & Badges
    img = draw_clay_pill(img, [80, 420, 360, 488], bg_color=(248, 216, 73), text_color=(17, 17, 17), text="BUILD YOUR CV NOW", font=get_font(20, bold=True), radius=22)
    img = draw_clay_pill(img, [390, 420, 620, 488], bg_color=(255, 255, 255), text_color=(17, 17, 17), text="FROM ₦6,000", font=get_font(20, bold=True), radius=22)
    img = draw_clay_pill(img, [720, 440, 1080, 506], bg_color=(16, 185, 129), text_color=(255, 255, 255), text="● 100% RECRUITER VERIFIED", font=get_font(18, bold=True), radius=20)
    
    out_path = os.path.join(OUTPUT_DIR, "02-twitter-banner-landscape.png")
    img.save(out_path, "PNG", optimize=True)
    print(f"Saved {out_path} ({os.path.getsize(out_path) // 1024} KB)")

# --------------------------------------------------------------------------
# GRAPHIC 03: INSTAGRAM STORY / TIKTOK POSTER (1080x1920 Vertical)
# --------------------------------------------------------------------------
def render_graphic_03():
    w, h = 1080, 1920
    img = Image.new("RGBA", (w, h), (13, 17, 24, 255))
    
    # Ambient glows
    img = Image.alpha_composite(img, create_radial_glow(w, h, 540, 400, 550, (16, 185, 129, 90)))
    img = Image.alpha_composite(img, create_radial_glow(w, h, 300, 1300, 500, (59, 130, 246, 85)))
    img = Image.alpha_composite(img, create_radial_glow(w, h, 800, 900, 450, (236, 72, 153, 60)))
    
    draw = ImageDraw.Draw(img)
    
    # Top Minimalist Branding
    draw.text((90, 140), "VITRA // MOBILE STORY", font=get_font(24, bold=True), fill=(16, 185, 129, 255))
    draw.text((90, 180), "Nigeria's Thoughtful ATS Career Studio", font=get_font(22, bold=False), fill=(160, 175, 195, 220))
    
    # Big Punchy Editorial Headline
    font_story_hero = get_font(72, bold=True)
    draw.text((90, 260), "Does Your CV", font=font_story_hero, fill=(255, 255, 255, 255))
    draw.text((90, 350), "Actually Pass", font=font_story_hero, fill=(248, 216, 73, 255))
    draw.text((90, 440), "The ATS Scanner?", font=font_story_hero, fill=(255, 255, 255, 255))
    
    # 40% Glassmorphism: Center Floating Stat Panel
    glass_box = [90, 580, 990, 1360]
    draw_glass_card(draw, glass_box, border_color=(255, 255, 255, 40), fill_color=(22, 28, 42, 170), radius=40)
    
    # Internal Glass Card: Score Display
    draw_glass_card(draw, [140, 640, 940, 820], border_color=(255, 255, 255, 25), fill_color=(255, 255, 255, 12), radius=24)
    draw.text((180, 680), "ATS PARSER COMPLIANCE", font=get_font(20, bold=True), fill=(16, 185, 129, 240))
    draw.text((180, 720), "98 / 100", font=get_font(68, bold=True), fill=(255, 255, 255, 255))
    draw.text((540, 745), "· OPTIMAL RANKING", font=get_font(24, bold=True), fill=(248, 216, 73, 255))
    
    # Bullet Breakdown inside Glass
    bullets = [
        ("01", "Standard Single-Column Layout", "No multi-column parsing crashes in Workday"),
        ("02", "Nigerian Education Presets", "Full support for SSCE, ND, HND, SIWES & NYSC"),
        ("03", "Anti-Fabrication AI Assistance", "Punchy achievement metrics without fake jobs"),
        ("04", "Instant PDF & DOCX Downloads", "Recruiter-ready Word and vector PDF copies"),
    ]
    
    by = 880
    for num, title, subtitle in bullets:
        draw.text((160, by), num, font=get_font(28, bold=True), fill=(16, 185, 129, 255))
        draw.text((230, by), title, font=get_font(26, bold=True), fill=(255, 255, 255, 240))
        draw.text((230, by + 36), subtitle, font=get_font(18, bold=False), fill=(160, 175, 195, 220))
        by += 110
        
    # 20% Claymorphism: Floating Action Elements & Badges
    img = draw_clay_pill(img, [90, 1440, 990, 1540], bg_color=(248, 216, 73), text_color=(17, 17, 17), text="TAP TO BUILD YOUR CV — FROM ₦6,000", font=get_font(30, bold=True), radius=30)
    img = draw_clay_pill(img, [90, 1580, 520, 1660], bg_color=(16, 185, 129), text_color=(255, 255, 255), text="● 9 PRO TEMPLATES", font=get_font(22, bold=True), radius=24)
    img = draw_clay_pill(img, [560, 1580, 990, 1660], bg_color=(59, 130, 246), text_color=(255, 255, 255), text="⚡ INSTANT DOWNLOAD", font=get_font(22, bold=True), radius=24)
    
    # Bottom Minimalist URL
    draw_bottom = ImageDraw.Draw(img)
    draw_bottom.text((420, 1750), "vitra.app", font=get_font(32, bold=True), fill=(255, 255, 255, 220))
    draw_bottom.text((370, 1795), "Lagos · Abuja · Remote Global", font=get_font(20, bold=False), fill=(140, 155, 175, 200))
    
    out_path = os.path.join(OUTPUT_DIR, "03-instagram-story-portrait.png")
    img.save(out_path, "PNG", optimize=True)
    print(f"Saved {out_path} ({os.path.getsize(out_path) // 1024} KB)")

# --------------------------------------------------------------------------
# GRAPHIC 04: DETERMINISTIC ATS ENGINE SHOWCASE (1080x1080 Square)
# --------------------------------------------------------------------------
def render_graphic_04():
    w, h = 1080, 1080
    img = Image.new("RGBA", (w, h), (10, 14, 22, 255))
    
    # Ambient glows
    img = Image.alpha_composite(img, create_radial_glow(w, h, 850, 250, 450, (59, 130, 246, 90)))
    img = Image.alpha_composite(img, create_radial_glow(w, h, 200, 800, 400, (16, 185, 129, 80)))
    
    draw = ImageDraw.Draw(img)
    
    # Minimalist Grid Lines
    for x in range(90, w, 180):
        draw.line([x, 0, x, h], fill=(255, 255, 255, 7), width=1)
        
    font_badge = get_font(20, bold=True)
    draw.text((90, 90), "FEATURE SPOTLIGHT // ENGINE SPECS", font=font_badge, fill=(59, 130, 246, 255))
    
    font_title = get_font(56, bold=True)
    draw.text((90, 140), "Engineered for Screeners.", font=font_title, fill=(255, 255, 255, 255))
    draw.text((90, 210), "Designed for Humans.", font=font_title, fill=(16, 185, 129, 255))
    
    # 40% Glassmorphism: Two Layered Glass Inspection Cards
    draw_glass_card(draw, [90, 310, 990, 770], border_color=(255, 255, 255, 35), fill_color=(19, 25, 38, 150), radius=32)
    
    # Internal comparison grid
    draw_glass_card(draw, [130, 350, 530, 730], border_color=(239, 68, 68, 50), fill_color=(239, 68, 68, 12), radius=22)
    draw.text((160, 380), "TRADITIONAL CVS ✗", font=get_font(20, bold=True), fill=(248, 113, 113, 255))
    draw.text((160, 430), "• Complex 2-column tables", font=get_font(18, bold=False), fill=(220, 220, 220, 220))
    draw.text((160, 470), "• Parser clips skills section", font=get_font(18, bold=False), fill=(220, 220, 220, 220))
    draw.text((160, 510), "• AI fabricates fake roles", font=get_font(18, bold=False), fill=(220, 220, 220, 220))
    draw.text((160, 550), "• Ignores Nigerian degrees", font=get_font(18, bold=False), fill=(220, 220, 220, 220))
    draw.text((160, 590), "• Rejection rate: >75%", font=get_font(18, bold=True), fill=(248, 113, 113, 240))
    
    draw_glass_card(draw, [550, 350, 950, 730], border_color=(16, 185, 129, 60), fill_color=(16, 185, 129, 14), radius=22)
    draw.text((580, 380), "VITRA ATS STUDIO ✓", font=get_font(20, bold=True), fill=(52, 211, 153, 255))
    draw.text((580, 430), "• Clean single-column text", font=get_font(18, bold=False), fill=(220, 240, 230, 240))
    draw.text((580, 470), "• 100% readable text layer", font=get_font(18, bold=False), fill=(220, 240, 230, 240))
    draw.text((580, 510), "• Verified factual integrity", font=get_font(18, bold=False), fill=(220, 240, 230, 240))
    draw.text((580, 550), "• Native NYSC & SIWES fields", font=get_font(18, bold=False), fill=(220, 240, 230, 240))
    draw.text((580, 590), "• Interview score: 98/100", font=get_font(18, bold=True), fill=(52, 211, 153, 255))
    
    # 20% Claymorphism: Floating Tactile CTA Cards
    img = draw_clay_pill(img, [90, 820, 520, 896], bg_color=(248, 216, 73), text_color=(17, 17, 17), text="AUDIT YOUR CV FREE", font=get_font(22, bold=True), radius=24)
    img = draw_clay_pill(img, [560, 820, 990, 896], bg_color=(16, 185, 129), text_color=(255, 255, 255), text="WORKDAY & LEVER TESTED", font=get_font(20, bold=True), radius=24)
    
    draw_footer = ImageDraw.Draw(img)
    draw_footer.text((90, 960), "Try it free at vitra.app · No payment required to build and preview", font=get_font(20, bold=False), fill=(160, 175, 195, 200))
    
    out_path = os.path.join(OUTPUT_DIR, "04-ats-engine-square.png")
    img.save(out_path, "PNG", optimize=True)
    print(f"Saved {out_path} ({os.path.getsize(out_path) // 1024} KB)")

# --------------------------------------------------------------------------
# GRAPHIC 05: PRICING DEAL & LAUNCH OFFER (1080x1080 Square)
# --------------------------------------------------------------------------
def render_graphic_05():
    w, h = 1080, 1080
    img = Image.new("RGBA", (w, h), (12, 16, 24, 255))
    
    # Ambient glows
    img = Image.alpha_composite(img, create_radial_glow(w, h, 300, 300, 450, (245, 158, 11, 80)))
    img = Image.alpha_composite(img, create_radial_glow(w, h, 800, 750, 420, (16, 185, 129, 85)))
    
    draw = ImageDraw.Draw(img)
    
    font_badge = get_font(20, bold=True)
    draw.text((90, 90), "TRANSPARENT PRICING // NO HIDDEN FEES", font=font_badge, fill=(245, 158, 11, 255))
    
    font_title = get_font(58, bold=True)
    draw.text((90, 140), "Professional ATS CVs.", font=font_title, fill=(255, 255, 255, 255))
    draw.text((90, 210), "Honest Nigerian Pricing.", font=font_title, fill=(248, 216, 73, 255))
    
    # 40% Glassmorphism: Pricing Card Comparison
    draw_glass_card(draw, [90, 310, 990, 780], border_color=(255, 255, 255, 35), fill_color=(20, 27, 42, 150), radius=32)
    
    plans = [
        ("STARTER", "₦6,000", "2 Full CVs", "Perfect for targeted applications", (255, 255, 255)),
        ("PRO", "₦15,000", "Up to 6 CVs", "Multi-industry & career switch", (248, 216, 73)),
        ("EXECUTIVE", "₦20,000", "Up to 13 CVs", "Senior leadership & multi-track", (16, 185, 129)),
    ]
    
    px = 120
    for name, price, cvs, desc, accent in plans:
        draw_glass_card(draw, [px, 350, px + 260, 740], border_color=(255, 255, 255, 25), fill_color=(255, 255, 255, 10), radius=22)
        draw.text((px + 24, 380), name, font=get_font(18, bold=True), fill=accent)
        draw.text((px + 24, 420), price, font=get_font(38, bold=True), fill=(255, 255, 255, 255))
        draw.text((px + 24, 480), cvs, font=get_font(20, bold=True), fill=(16, 185, 129, 255))
        draw.text((px + 24, 530), desc, font=get_font(16, bold=False), fill=(170, 185, 205, 220))
        draw.text((px + 24, 610), "✓ All 9 Templates\n✓ PDF & Word\n✓ Gemini AI\n✓ Paystack Ready", font=get_font(16, bold=False), fill=(200, 215, 230, 220))
        px += 290
        
    # 20% Claymorphism: Large Bottom Button
    img = draw_clay_pill(img, [90, 830, 990, 920], bg_color=(248, 216, 73), text_color=(17, 17, 17), text="PAY ONCE · NEVER RECURRING · START AT VITRA.APP", font=get_font(24, bold=True), radius=26)
    
    draw_footer = ImageDraw.Draw(img)
    draw_footer.text((90, 980), "Instant Quota Activation via Paystack · 256-bit Bank Grade Encryption", font=get_font(20, bold=False), fill=(160, 175, 195, 200))
    
    out_path = os.path.join(OUTPUT_DIR, "05-pricing-deal-square.png")
    img.save(out_path, "PNG", optimize=True)
    print(f"Saved {out_path} ({os.path.getsize(out_path) // 1024} KB)")

# --------------------------------------------------------------------------
# GRAPHIC 06: MANIFESTO / EDITORIAL CARD (1080x1080 Square)
# --------------------------------------------------------------------------
def render_graphic_06():
    w, h = 1080, 1080
    img = Image.new("RGBA", (w, h), (9, 13, 20, 255))
    
    # Ambient glowing orbs
    img = Image.alpha_composite(img, create_radial_glow(w, h, 250, 400, 480, (16, 185, 129, 90)))
    img = Image.alpha_composite(img, create_radial_glow(w, h, 850, 700, 450, (59, 130, 246, 80)))
    
    draw = ImageDraw.Draw(img)
    
    # Minimalist Grid Lines
    for x in range(100, w, 200):
        draw.line([x, 0, x, h], fill=(255, 255, 255, 7), width=1)
        
    # 40% Glassmorphism: Big Editorial Manifesto Pane
    draw_glass_card(draw, [100, 140, 980, 940], border_color=(255, 255, 255, 35), fill_color=(18, 24, 36, 160), radius=36)
    
    draw.text((160, 200), "THE VITRA MANIFESTO", font=get_font(20, bold=True), fill=(16, 185, 129, 255))
    
    font_quote = get_font(52, bold=True)
    draw.text((160, 270), "“Too many qualified", font=font_quote, fill=(255, 255, 255, 255))
    draw.text((160, 345), "candidates are overlooked", font=font_quote, fill=(255, 255, 255, 255))
    draw.text((160, 420), "simply because ATS", font=font_quote, fill=(248, 216, 73, 255))
    draw.text((160, 495), "systems can't parse them.”", font=font_quote, fill=(248, 216, 73, 255))
    
    font_body = get_font(24, bold=False)
    draw.text((160, 600), "We built Vitra to give every graduate, job seeker,", font=font_body, fill=(200, 215, 235, 230))
    draw.text((160, 640), "and corporate leader an unfair advantage with clean,", font=font_body, fill=(200, 215, 235, 230))
    draw.text((160, 680), "un-hallucinated documents that recruiters actually open.", font=font_body, fill=(200, 215, 235, 230))
    
    # 20% Claymorphism: Signature Stamp
    img = draw_clay_pill(img, [160, 780, 520, 856], bg_color=(16, 185, 129), text_color=(255, 255, 255), text="VISIT VITRA.APP", font=get_font(22, bold=True), radius=24)
    img = draw_clay_pill(img, [560, 780, 920, 856], bg_color=(255, 255, 255), text_color=(17, 17, 17), text="FROM ₦6,000 NGN", font=get_font(22, bold=True), radius=24)
    
    out_path = os.path.join(OUTPUT_DIR, "06-manifesto-editorial-square.png")
    img.save(out_path, "PNG", optimize=True)
    print(f"Saved {out_path} ({os.path.getsize(out_path) // 1024} KB)")

if __name__ == "__main__":
    print("Generating Vitra Promotional Graphics Collection...")
    render_graphic_01()
    render_graphic_02()
    render_graphic_03()
    render_graphic_04()
    render_graphic_05()
    render_graphic_06()
    print("All 6 high-resolution promotional graphics successfully generated in promotional-graphics/exports/!")
