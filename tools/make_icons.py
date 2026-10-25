#!/usr/bin/env python3
"""Draws the app icon + splash art into ./assets (needs: pip install pillow).
Then run:  npm run android:icons   to turn them into every Android size."""
import math, os
from PIL import Image, ImageDraw, ImageFont

NAVY = (31, 42, 68, 255)
GOLD = (242, 177, 52, 255)
GOLD_DEEP = (185, 120, 11, 255)
CREAM = (248, 250, 252, 255)
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets')
os.makedirs(OUT, exist_ok=True)
S = 4  # supersampling for smooth edges

def font(size):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
              '/System/Library/Fonts/Supplemental/Arial Bold.ttf', 'C:\\Windows\\Fonts\\arialbd.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def gear_logo(size, scale=1.0):
    """Gold gear with a navy centre and a stitched 'T'. Transparent background."""
    n = size * S
    img = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = n / 2
    r_out = n * 0.5 * scale          # tooth tips
    r_body = r_out * 0.82
    teeth = 10
    pts = []
    for i in range(teeth * 4):
        a = 2 * math.pi * i / (teeth * 4) - math.pi / 2
        # square-ish teeth: pattern high,high,low,low
        r = r_out if (i % 4) in (0, 1) else r_body
        pts.append((c + r * math.cos(a), c + r * math.sin(a)))
    d.polygon(pts, fill=GOLD_DEEP)
    inset = 0.045 * n * scale
    pts2 = []
    for i in range(teeth * 4):
        a = 2 * math.pi * i / (teeth * 4) - math.pi / 2
        r = (r_out if (i % 4) in (0, 1) else r_body) - inset
        pts2.append((c + r * math.cos(a), c + r * math.sin(a)))
    d.polygon(pts2, fill=GOLD)
    d.ellipse([c - r_body * 0.9, c - r_body * 0.9, c + r_body * 0.9, c + r_body * 0.9], fill=GOLD)
    r_in = r_body * 0.64
    d.ellipse([c - r_in, c - r_in, c + r_in, c + r_in], fill=NAVY)
    # stitched ring (dashes) inside the centre
    r_st = r_in * 0.86
    for i in range(28):
        a0 = 2 * math.pi * i / 28
        a1 = a0 + 2 * math.pi / 28 * 0.55
        d.arc([c - r_st, c - r_st, c + r_st, c + r_st], math.degrees(a0), math.degrees(a1),
              fill=(159, 176, 196, 255), width=max(2, int(n * 0.008 * scale)))
    # the T
    f = font(int(r_in * 1.35))
    d.text((c, c + r_in * 0.04), 'T', font=f, fill=CREAM, anchor='mm')
    return img.resize((size, size), Image.LANCZOS)

def save(img, name):
    img.save(os.path.join(OUT, name))
    print('wrote', name, img.size)

# Full icon (also used on the web): gear on navy.
icon = Image.new('RGBA', (1024, 1024), NAVY)
icon.alpha_composite(gear_logo(1024, 0.78))
save(icon, 'icon-only.png')

# Adaptive icon layers: Android crops to a circle/squircle, so keep art inside the middle ~60%.
bg = Image.new('RGBA', (1024, 1024), NAVY)
save(bg, 'icon-background.png')
fg = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
fg.alpha_composite(gear_logo(1024, 0.94))  # capacitor-assets adds its own 16.7% inset
save(fg, 'icon-foreground.png')

# Splash: navy with the gear and the name.
for name in ('splash.png', 'splash-dark.png'):
    sp = Image.new('RGBA', (2732, 2732), NAVY)
    logo = gear_logo(760, 0.95)
    sp.alpha_composite(logo, ((2732 - 760) // 2, 880))
    d = ImageDraw.Draw(sp)
    d.text((2732 // 2, 1790), 'Tinker Town', font=font(150), fill=CREAM, anchor='mm')
    d.text((2732 // 2, 1960), 'FACTORY', font=font(110), fill=GOLD, anchor='mm')
    save(sp, name)
