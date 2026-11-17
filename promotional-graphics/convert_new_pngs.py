import os
from PIL import Image

brain_dir = os.path.join(os.environ["USERPROFILE"], r".gemini\antigravity\brain\90baf1ef-15a8-44a8-a86f-8ceebcb2a41e")
target_dir = os.path.join(os.getcwd(), "promotional-graphics")
exports_dir = os.path.join(target_dir, "exports")

os.makedirs(exports_dir, exist_ok=True)

image_mapping = [
    ("vitra_commercial_hero_banner_1794918939841.jpg", "01-commercial-hero-banner.png"),
    ("vitra_commercial_story_vertical_1794918832569.jpg", "02-commercial-story-vertical.png"),
    ("vitra_commercial_square_post_1794918852359.jpg", "03-commercial-square-post.png"),
    ("vitra_pricing_showcase_commercial_1794918892124.jpg", "04-pricing-showcase-commercial.png"),
    ("vitra_tactile_sculptural_masterpiece_1794919023590.jpg", "05-tactile-sculptural-masterpiece.png"),
    ("vitra_campaign_showcase_board_1794918943844.jpg", "06-campaign-showcase-board.png"),
]

for src_name, dst_name in image_mapping:
    src_path = os.path.join(brain_dir, src_name)
    if os.path.exists(src_path):
        with Image.open(src_path) as im:
            # Save into exports/
            export_path = os.path.join(exports_dir, dst_name)
            im.save(export_path, format="PNG")
            
            # Also save directly into promotional-graphics/ root for instant user convenience
            root_path = os.path.join(target_dir, dst_name)
            im.save(root_path, format="PNG")
            
            print(f"SUCCESS: Saved {dst_name} ({im.size[0]}x{im.size[1]}px) -> {export_path}")
    else:
        print(f"ERROR: {src_path} not found!")

print("All conversions complete!")
