#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
ANDROID_RES = ROOT / 'android' / 'app' / 'src' / 'main' / 'res'
ICON_SOURCE = ROOT / 'public' / 'icons' / 'icon-1024.png'
MASKABLE_SOURCE = ROOT / 'public' / 'icons' / 'icon-maskable-512.png'

ICON_BACKGROUND = '#121212'

LAUNCHER_BUCKETS = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

ADAPTIVE_FOREGROUND_BUCKETS = {
    'mipmap-mdpi': 108,
    'mipmap-hdpi': 162,
    'mipmap-xhdpi': 216,
    'mipmap-xxhdpi': 324,
    'mipmap-xxxhdpi': 432,
}

PORTRAIT_SPLASH_BUCKETS = {
    'drawable-port-mdpi': (320, 480),
    'drawable-port-hdpi': (480, 800),
    'drawable-port-xhdpi': (720, 1280),
    'drawable-port-xxhdpi': (960, 1600),
    'drawable-port-xxxhdpi': (1280, 1920),
}

LANDSCAPE_SPLASH_BUCKETS = {
    'drawable-land-mdpi': (480, 320),
    'drawable-land-hdpi': (800, 480),
    'drawable-land-xhdpi': (1280, 720),
    'drawable-land-xxhdpi': (1600, 960),
    'drawable-land-xxxhdpi': (1920, 1280),
}

BASE_SPLASH_SIZE = (720, 1280)


def ensure_directory(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def save_png(image: Image.Image, destination: Path) -> None:
    ensure_directory(destination)
    image.save(destination, format='PNG', optimize=True)


def save_text(destination: Path, content: str) -> None:
    ensure_directory(destination)
    destination.write_text(content, encoding='utf-8')


def load_rgba(path: Path) -> Image.Image:
    with Image.open(path) as image:
        return image.convert('RGBA')


def resize_square(source: Image.Image, size: int) -> Image.Image:
    return source.resize((size, size), Image.Resampling.LANCZOS)


def make_round_icon(source: Image.Image, size: int) -> Image.Image:
    image = resize_square(source, size)
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size - 1, size - 1), fill=255)
    image.putalpha(ImageChops.multiply(image.getchannel('A'), mask))
    return image


def render_splash(source: Image.Image, canvas_size: tuple[int, int]) -> Image.Image:
    width, height = canvas_size
    icon_size = max(96, round(min(width, height) * 0.34))
    canvas = Image.new('RGBA', (width, height), ICON_BACKGROUND)
    icon = resize_square(source, icon_size)
    x = (width - icon.width) // 2
    y = (height - icon.height) // 2
    canvas.alpha_composite(icon, (x, y))
    return canvas


def write_icon_resources(launcher_source: Image.Image, maskable_source: Image.Image) -> None:
    for bucket, size in LAUNCHER_BUCKETS.items():
        save_png(resize_square(launcher_source, size), ANDROID_RES / bucket / 'ic_launcher.png')
        save_png(make_round_icon(launcher_source, size), ANDROID_RES / bucket / 'ic_launcher_round.png')

    for bucket, size in ADAPTIVE_FOREGROUND_BUCKETS.items():
        save_png(resize_square(maskable_source, size), ANDROID_RES / bucket / 'ic_launcher_foreground.png')

    adaptive_icon_xml = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
"""
    save_text(ANDROID_RES / 'mipmap-anydpi-v26' / 'ic_launcher.xml', adaptive_icon_xml)
    save_text(ANDROID_RES / 'mipmap-anydpi-v26' / 'ic_launcher_round.xml', adaptive_icon_xml)

    launcher_background_color = f"""<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">{ICON_BACKGROUND}</color>
</resources>
"""
    save_text(ANDROID_RES / 'values' / 'ic_launcher_background.xml', launcher_background_color)

    launcher_background_drawable = f"""<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="{ICON_BACKGROUND}" />
</shape>
"""
    save_text(ANDROID_RES / 'drawable' / 'ic_launcher_background.xml', launcher_background_drawable)


def write_splash_resources(splash_source: Image.Image) -> None:
    save_png(render_splash(splash_source, BASE_SPLASH_SIZE), ANDROID_RES / 'drawable' / 'splash.png')

    for bucket, size in PORTRAIT_SPLASH_BUCKETS.items():
        save_png(render_splash(splash_source, size), ANDROID_RES / bucket / 'splash.png')

    for bucket, size in LANDSCAPE_SPLASH_BUCKETS.items():
        save_png(render_splash(splash_source, size), ANDROID_RES / bucket / 'splash.png')


def main() -> None:
    launcher_source = load_rgba(ICON_SOURCE)
    maskable_source = load_rgba(MASKABLE_SOURCE)

    write_icon_resources(launcher_source, maskable_source)
    write_splash_resources(launcher_source)

    print('Generated Android launcher and splash assets from public/icons.')


if __name__ == '__main__':
    main()
