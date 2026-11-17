import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

brain_dir = os.path.join(os.environ["USERPROFILE"], r".gemini\antigravity\brain\90baf1ef-15a8-44a8-a86f-8ceebcb2a41e")
target_dir = os.path.join(os.getcwd(), "promotional-graphics")
exports_dir = os.path.join(target_dir, "exports")

os.makedirs(exports_dir, exist_ok=True)

brand_logo_path = os.path.join(os.getcwd(), "public", "brand", "vitra-nav-logo-dark.png")
logo_orig = Image.open(brand_logo_path).convert("RGBA")

# Official Vitra Brand Colors:
# Forest Green: #173B30 / #0D261E
# Vitra Golden Yellow: #FECB0D / #F8D849
# Obsidian Dark: #09110E / #0D121A

def create_brand_badge(logo, target_height=38):
    aspect = logo.size[0] / logo.size[1]
    new_w = int(target_height * aspect)
    logo_resized = logo.resize((new_w, target_height), Image.Resampling.LANCZOS)
    
    pad_x = 18
    pad_y = 9
    badge_w = new_w + pad_x * 2
    badge_h = target_height + pad_y * 2
    
    scale = 2
    canvas = Image.new("RGBA", (badge_w * scale, badge_h * scale), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    radius = (badge_h * scale) // 2
    
    # Frosted pill in Vitra Forest/Obsidian tone with Vitra Golden Yellow hairline border
    draw.rounded_rectangle(
        [0, 0, badge_w * scale - 1, badge_h * scale - 1],
        radius=radius,
        fill=(13, 38, 30, 225),  # Deep Vitra Forest Green translucency
        outline=(254, 203, 13, 110),  # Vitra Golden Yellow border highlight
        width=scale * 1
    )
    badge = canvas.resize((badge_w, badge_h), Image.Resampling.LANCZOS)
    
    pad_shadow = 14
    shadow = Image.new("RGBA", (badge_w + pad_shadow * 2, badge_h + pad_shadow * 2), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rounded_rectangle(
        [pad_shadow, pad_shadow + 2, pad_shadow + badge_w - 1, pad_shadow + badge_h + 1],
        radius=badge_h // 2,
        fill=(0, 0, 0, 160)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(6))
    
    final_badge = Image.new("RGBA", shadow.size, (0, 0, 0, 0))
    final_badge.paste(shadow, (0, 0), shadow)
    final_badge.paste(badge, (pad_shadow, pad_shadow), badge)
    final_badge.paste(logo_resized, (pad_shadow + pad_x, pad_shadow + pad_y), logo_resized)
    
    return final_badge, pad_shadow

# Process 01 through 05 with the newly generated official brand color renders
primary_configs = [
    (
        "vitra_brand_color_hero_banner_1794921218672.jpg",
        "01-commercial-hero-banner.png",
        "top-left", 48, 42, 38
    ),
    (
        "vitra_brand_color_story_vertical_1794921219215.jpg",
        "02-commercial-story-vertical.png",
        "top-center", 0, 48, 38
    ),
    (
        "vitra_brand_color_square_post_1794921231084.jpg",
        "03-commercial-square-post.png",
        "top-left", 48, 42, 38
    ),
    (
        # Official brand color with strictly ONE single credit card
        "vitra_brand_color_pricing_showcase_1794921254344.jpg",
        "04-pricing-showcase-commercial.png",
        "top-left", 48, 42, 38
    ),
    (
        # Official brand color tactile quilling & clay relief
        "vitra_brand_color_sculptural_masterpiece_1794921265447.jpg",
        "05-tactile-sculptural-masterpiece.png",
        "top-left", 48, 42, 38
    ),
]

saved_assets = {}

for src_name, dst_name, pos_mode, ox, oy, logo_h in primary_configs:
    src_path = os.path.join(brain_dir, src_name)
    if not os.path.exists(src_path):
        print(f"ERROR: {src_path} not found!")
        continue
        
    base_img = Image.open(src_path).convert("RGBA")
    badge_img, pad_shadow = create_brand_badge(logo_orig, target_height=logo_h)
    
    w, h = base_img.size
    bw, bh = badge_img.size
    
    if pos_mode == "top-center":
        pos_x = (w - bw) // 2
        pos_y = oy - pad_shadow
    else:
        pos_x = ox - pad_shadow
        pos_y = oy - pad_shadow
        
    base_img.paste(badge_img, (pos_x, pos_y), badge_img)
    final_rgb = base_img.convert("RGB")
    
    export_path = os.path.join(exports_dir, dst_name)
    final_rgb.save(export_path, format="PNG", optimize=True)
    
    root_path = os.path.join(target_dir, dst_name)
    final_rgb.save(root_path, format="PNG", optimize=True)
    
    saved_assets[dst_name] = final_rgb
    print(f"SUCCESS: Finalized {dst_name} with Vitra Logo & Official Brand Colors ({w}x{h}px)")

# Now build 06-campaign-showcase-board.png composite using Vitra brand colors and actual renders
board_w, board_h = 768, 1376
board = Image.new("RGBA", (board_w, board_h), (13, 38, 30, 255)) # Deep Vitra Forest Green

# Create smooth gradient from #0D261E to #08120F
for y in range(board_h):
    factor = y / board_h
    r = int(13 * (1 - factor) + 8 * factor)
    g = int(38 * (1 - factor) + 18 * factor)
    b = int(30 * (1 - factor) + 15 * factor)
    draw_line = ImageDraw.Draw(board)
    draw_line.line([(0, y), (board_w, y)], fill=(r, g, b))

# Add radial golden ambient glow at top
glow = Image.new("RGBA", (board_w, board_h), (0, 0, 0, 0))
gdraw = ImageDraw.Draw(glow)
gdraw.ellipse([-100, -100, board_w + 100, 450], fill=(254, 203, 13, 22))
glow = glow.filter(ImageFilter.GaussianBlur(80))
board = Image.alpha_composite(board, glow)

bdraw = ImageDraw.Draw(board)

# Top Brand Badge
badge_img, pad_shadow = create_brand_badge(logo_orig, target_height=42)
bw, bh = badge_img.size
board.paste(badge_img, ((board_w - bw) // 2, 40 - pad_shadow), badge_img)

# Headline & Subtitle
try:
    font_title = ImageFont.truetype("arialbd.ttf", 26)
    font_sub = ImageFont.truetype("arial.ttf", 13)
    font_badge = ImageFont.truetype("arialbd.ttf", 11)
except:
    font_title = ImageFont.load_default()
    font_sub = ImageFont.load_default()
    font_badge = ImageFont.load_default()

title_text = "COMMERCIAL CAMPAIGN SUITE"
bbox_t = bdraw.textbbox((0, 0), title_text, font=font_title)
tw = bbox_t[2] - bbox_t[0]
bdraw.text(((board_w - tw) // 2, 115), title_text, fill=(255, 255, 255), font=font_title)

sub_text = "ATS OPTIMIZED · NIGERIAN CREDENTIAL PRESETS · PACKAGES FROM ₦6,000"
bbox_s = bdraw.textbbox((0, 0), sub_text, font=font_sub)
sw = bbox_s[2] - bbox_s[0]
bdraw.text(((board_w - sw) // 2, 150), sub_text, fill=(254, 203, 13), font=font_sub)

# Function to paste a mockup with shadow and border
def paste_mockup(canvas, img, x, y, target_w, target_h):
    aspect = img.size[0] / img.size[1]
    scaled = img.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # Shadow
    sh = Image.new("RGBA", (target_w + 24, target_h + 24), (0, 0, 0, 0))
    s_d = ImageDraw.Draw(sh)
    s_d.rounded_rectangle([12, 14, 12 + target_w - 1, 14 + target_h - 1], radius=16, fill=(0, 0, 0, 160))
    sh = sh.filter(ImageFilter.GaussianBlur(8))
    canvas.paste(sh, (x - 12, y - 12), sh)
    
    # Draw border on scaled image
    bordered = scaled.copy().convert("RGBA")
    b_d = ImageDraw.Draw(bordered)
    b_d.rounded_rectangle([0, 0, target_w - 1, target_h - 1], radius=14, outline=(254, 203, 13, 120), width=1)
    
    # Mask rounded corners
    mask = Image.new("L", (target_w, target_h), 0)
    m_d = ImageDraw.Draw(mask)
    m_d.rounded_rectangle([0, 0, target_w - 1, target_h - 1], radius=14, fill=255)
    
    canvas.paste(bordered, (x, y), mask)

# 1. Wide Hero Banner (Top)
if "01-commercial-hero-banner.png" in saved_assets:
    paste_mockup(board, saved_assets["01-commercial-hero-banner.png"], 48, 185, 672, 375)

# 2. Middle Row: Story (left) & Square Post (right)
if "02-commercial-story-vertical.png" in saved_assets:
    paste_mockup(board, saved_assets["02-commercial-story-vertical.png"], 48, 580, 240, 430)

if "03-commercial-square-post.png" in saved_assets:
    paste_mockup(board, saved_assets["03-commercial-square-post.png"], 310, 580, 410, 410)

# 3. Bottom Row: Pricing (left) & Tactile Sculptural Art (right)
if "04-pricing-showcase-commercial.png" in saved_assets:
    paste_mockup(board, saved_assets["04-pricing-showcase-commercial.png"], 48, 1030, 325, 235)

if "05-tactile-sculptural-masterpiece.png" in saved_assets:
    paste_mockup(board, saved_assets["05-tactile-sculptural-masterpiece.png"], 395, 1030, 325, 235)

# Footer Strip
fdraw = ImageDraw.Draw(board)
fdraw.rounded_rectangle([48, 1285, 720, 1335], radius=25, fill=(13, 38, 30, 240), outline=(254, 203, 13, 160), width=1)
footer_text = "VITRA.APP  ●  98% ATS PASS RATE  ●  PAYSTACK SECURED  ●  FROM ₦6,000"
bbox_f = fdraw.textbbox((0, 0), footer_text, font=font_badge)
fw = bbox_f[2] - bbox_f[0]
fdraw.text(((board_w - fw) // 2, 1302), footer_text, fill=(254, 203, 13), font=font_badge)

final_board_rgb = board.convert("RGB")
dst_name_06 = "06-campaign-showcase-board.png"
final_board_rgb.save(os.path.join(exports_dir, dst_name_06), format="PNG", optimize=True)
final_board_rgb.save(os.path.join(target_dir, dst_name_06), format="PNG", optimize=True)
print(f"SUCCESS: Finalized {dst_name_06} with Vitra Logo & Official Brand Colors ({board_w}x{board_h}px)")

print("ALL 6 PROMOTIONAL GRAPHICS NOW GLORIOUSLY EMBODY VITRA'S OFFICIAL BRAND COLORS (#FECB0D & #173B30)!")
