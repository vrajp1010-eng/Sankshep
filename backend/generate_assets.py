from PIL import Image
import os, shutil

src_path = r'C:\Users\DELL 7559\Downloads\symbol.png'
dest_public = r'c:\Users\DELL 7559\Desktop\Sankshep\frontend\public'

# 1. Copy full logo to public/logo.png
shutil.copy(src_path, os.path.join(dest_public, 'logo.png'))

img = Image.open(src_path).convert('RGBA')
width, height = img.size
print(f'Original image dimensions: {width}x{height}')

# Find bounding box of non-white pixels
def is_colored(rgba):
    r, g, b, a = rgba
    return a > 50 and not (r > 245 and g > 245 and b > 245)

# Bounding box of full content
bbox = img.getbbox()
print('Full image bbox:', bbox)

# Scan vertically to find where the icon ends and where the wordmark starts
y_colored = []
for y in range(height):
    has_colored = any(is_colored(img.getpixel((x, y))) for x in range(width))
    if has_colored:
        y_colored.append(y)

min_y, max_y = min(y_colored), max(y_colored)
print('Content Y range:', min_y, 'to', max_y)

# Find vertical gap
gaps = []
for y in range(min_y, max_y):
    has_colored = any(is_colored(img.getpixel((x, y))) for x in range(width))
    if not has_colored:
        gaps.append(y)

print('Vertical gaps found:', gaps)
# The gap between icon and wordmark
gap_y = gaps[len(gaps)//2] if gaps else height // 2
print('Splitting icon at Y =', gap_y)

# Crop icon only
icon_box = (0, min_y, width, gap_y)
icon_img = img.crop(icon_box)

# Crop to non-white bounding box of icon
x_colored = []
y_icon_colored = []
for y in range(icon_img.height):
    for x in range(icon_img.width):
        if is_colored(icon_img.getpixel((x, y))):
            x_colored.append(x)
            y_icon_colored.append(y)

icon_cropped = icon_img.crop((min(x_colored), min(y_icon_colored), max(x_colored), max(y_icon_colored)))
print('Cropped icon size:', icon_cropped.size)

# Create square padded icon for favicon / app icons with transparent or white background
def make_square_icon(cropped, size, bg_color=(255, 255, 255, 0), padding_pct=0.1):
    sq = Image.new('RGBA', (size, size), bg_color)
    max_dim = int(size * (1 - 2 * padding_pct))
    ratio = min(max_dim / cropped.width, max_dim / cropped.height)
    new_w = int(cropped.width * ratio)
    new_h = int(cropped.height * ratio)
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    offset_x = (size - new_w) // 2
    offset_y = (size - new_h) // 2
    sq.paste(resized, (offset_x, offset_y), resized)
    return sq

# Save favicons and app icons
favicon_32 = make_square_icon(icon_cropped, 32, padding_pct=0.05)
favicon_32.save(os.path.join(dest_public, 'favicon.png'))

favicon_ico = make_square_icon(icon_cropped, 48, padding_pct=0.05)
favicon_ico.save(os.path.join(dest_public, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])

apple_touch = make_square_icon(icon_cropped, 180, bg_color=(255, 255, 255, 255), padding_pct=0.12)
apple_touch.save(os.path.join(dest_public, 'apple-touch-icon.png'))

pwa_192 = make_square_icon(icon_cropped, 192, bg_color=(255, 255, 255, 255), padding_pct=0.12)
pwa_192.save(os.path.join(dest_public, 'pwa-192x192.png'))

pwa_512 = make_square_icon(icon_cropped, 512, bg_color=(255, 255, 255, 255), padding_pct=0.12)
pwa_512.save(os.path.join(dest_public, 'pwa-512x512.png'))

# Create OpenGraph social card (1200x630)
og_card = Image.new('RGBA', (1200, 630), (255, 255, 255, 255))
logo_aspect = img.width / img.height
target_w = 600
target_h = int(target_w / logo_aspect)
logo_resized = img.resize((target_w, target_h), Image.Resampling.LANCZOS)
og_card.paste(logo_resized, ((1200 - target_w) // 2, (630 - target_h) // 2), logo_resized)
og_card.save(os.path.join(dest_public, 'og-image.png'))

print('All branding assets generated successfully in frontend/public!')
