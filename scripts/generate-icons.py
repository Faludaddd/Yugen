#!/usr/bin/env python3
"""
Generate all required PNG icons and splash screens from the Yugen logo SVG.

Outputs:
  public/icon-192.png       — Android/PWA icon (192x192)
  public/icon-512.png       — PWA icon (512x512)
  public/apple-touch-icon.png — iOS home screen icon (180x180)
  public/icon-1024.png      — App Store icon (1024x1024)
  public/splash/*.png       — iOS launch screens for all device sizes
"""

import cairosvg
import os
from pathlib import Path

PUBLIC_DIR = Path("/home/z/my-project/public")
SPLASH_DIR = PUBLIC_DIR / "splash"
SPLASH_DIR.mkdir(exist_ok=True)

SVG_PATH = PUBLIC_DIR / "logo.svg"

# Read the SVG content
with open(SVG_PATH, "r") as f:
    svg_content = f.read()

def render_png(output_path: Path, size: int, bg: str = "#080808"):
    """Render the SVG to a PNG of the given size with a solid background."""
    # Wrap the SVG in a larger SVG with background
    wrapped = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">
      <rect width="{size}" height="{size}" fill="{bg}"/>
      <g transform="translate({size*0.15}, {size*0.15}) scale({size*0.7/512})">
        {svg_content.split('viewBox="0 0 512 512"')[1].split('</svg>')[0]}
      </g>
    </svg>'''
    cairosvg.svg2png(
        bytestring=wrapped.encode('utf-8'),
        write_to=str(output_path),
        output_width=size,
        output_height=size,
    )
    print(f"  ✓ {output_path.name} ({size}x{size})")

def render_splash(output_path: Path, width: int, height: int, bg: str = "#080808"):
    """Render a splash screen with centered logo."""
    logo_size = min(width, height) * 0.35
    offset_x = (width - logo_size) / 2
    offset_y = (height - logo_size) / 2
    wrapped = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
      <rect width="{width}" height="{height}" fill="{bg}"/>
      <g transform="translate({offset_x}, {offset_y}) scale({logo_size/512})">
        {svg_content.split('viewBox="0 0 512 512"')[1].split('</svg>')[0]}
      </g>
      <text x="{width/2}" y="{height - 80}" font-family="sans-serif" font-size="28" font-weight="700" fill="#b5a8ff" text-anchor="middle" letter-spacing="8">YUGEN</text>
      <text x="{width/2}" y="{height - 50}" font-family="sans-serif" font-size="14" fill="#696969" text-anchor="middle" letter-spacing="4">幽玄</text>
    </svg>'''
    cairosvg.svg2png(
        bytestring=wrapped.encode('utf-8'),
        write_to=str(output_path),
        output_width=width,
        output_height=height,
    )
    print(f"  ✓ splash/{output_path.name} ({width}x{height})")

print("🎨 Generating app icons...")
render_png(PUBLIC_DIR / "icon-192.png", 192)
render_png(PUBLIC_DIR / "icon-512.png", 512)
render_png(PUBLIC_DIR / "apple-touch-icon.png", 180)
render_png(PUBLIC_DIR / "icon-1024.png", 1024)

print("\n📱 Generating iOS splash screens...")
# iPhone and iPad splash screens
splash_sizes = [
    ("iphone-640x1136.png", 640, 1136),      # iPhone SE
    ("iphone-750x1334.png", 750, 1334),      # iPhone 8
    ("iphone-1242x2208.png", 1242, 2208),    # iPhone 8 Plus
    ("iphone-1125x2436.png", 1125, 2436),    # iPhone X
    ("iphone-1536x2048.png", 1536, 2048),    # iPad mini/Air
    ("iphone-1668x2224.png", 1668, 2224),    # iPad Pro 10.5"
    ("iphone-2048x2732.png", 2048, 2732),    # iPad Pro 12.9"
]

for filename, w, h in splash_sizes:
    render_splash(SPLASH_DIR / filename, w, h)

print("\n✅ All icons and splash screens generated!")
