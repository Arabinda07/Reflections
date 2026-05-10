from __future__ import annotations

import json
import math
import shutil
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps, JpegImagePlugin


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "marketing" / "reflections-linkedin-carousel"
SLIDE_DIR = OUT_DIR / "slides"
SOURCE_DIR = OUT_DIR / "source"

W = H = 1080

PAPER = (247, 250, 243)
SAGE = (226, 240, 219)
BOTANICAL = (28, 103, 19)
DEEP = (34, 41, 34)
DARK_GREEN = (2, 47, 11)
SKY = (18, 104, 181)
HONEY = (164, 112, 12)
CLAY = (154, 70, 54)
MUTED = (102, 115, 101)
LINE = (211, 225, 204)

MANROPE = ROOT / "public" / "assets" / "fonts" / "Manrope-Variable.woff2"
SPECTRAL_REGULAR = ROOT / "public" / "assets" / "fonts" / "Spectral-Regular.woff2"
SPECTRAL_ITALIC = ROOT / "public" / "assets" / "fonts" / "Spectral-Italic.woff2"
SPECTRAL_BOLD = ROOT / "public" / "assets" / "fonts" / "Spectral-Bold.woff2"


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size)


F = {
    "label": font(MANROPE, 22),
    "label_small": font(MANROPE, 16),
    "h1": font(MANROPE, 78),
    "h1_big": font(MANROPE, 92),
    "h1_huge": font(MANROPE, 112),
    "h2": font(MANROPE, 58),
    "body": font(SPECTRAL_REGULAR, 31),
    "body_small": font(SPECTRAL_REGULAR, 25),
    "italic": font(SPECTRAL_ITALIC, 64),
    "italic_small": font(SPECTRAL_ITALIC, 39),
    "serif_bold": font(SPECTRAL_BOLD, 54),
}


SLIDES = [
    {
        "kicker": "DESIGN NOTE 01",
        "title": ["The product is", "not the AI."],
        "accent": "The note is.",
        "support": "Reflections is built around the act of writing, with AI kept as an explicit choice.",
        "theme": "paper",
    },
    {
        "kicker": "WHAT CHANGED",
        "title": ["I stopped asking", "what AI can do."],
        "accent": "I asked what it should wait for.",
        "support": "No background reading. No automatic interpretation. The user has to invite it in.",
        "theme": "green",
    },
    {
        "kicker": "THE CENTER",
        "title": ["Before mood.", "Before tags.", "Before insight."],
        "accent": "There is a blank page.",
        "support": "The writing surface has to earn more attention than every feature around it.",
        "theme": "paper",
    },
    {
        "kicker": "BOUNDARY",
        "title": ["Memory is useful", "only with limits."],
        "accent": "Life Wiki has to stay accountable.",
        "support": "It should help patterns become visible without making private writing feel watched.",
        "theme": "sage",
    },
    {
        "kicker": "ANTI-PATTERN",
        "title": ["Patterns are", "not scores."],
        "accent": "Insight is not a leaderboard.",
        "support": "No diagnosis. No performance metric. No emotional report card.",
        "theme": "dark",
    },
    {
        "kicker": "PRODUCT RULE",
        "title": ["Free should feel", "complete."],
        "accent": "Pro adds room, not pressure.",
        "support": "The free plan includes writing and AI features. Premium expands continuity.",
        "theme": "paper",
    },
    {
        "kicker": "BUILDING REFLECTIONS",
        "title": ["The hard part", "was restraint."],
        "accent": "Every feature had to answer one question.",
        "support": "Does this help someone write, return, or notice without being pushed?",
        "theme": "green",
    },
    {
        "kicker": "REFLECTIONS",
        "title": ["A private journal", "for writing,", "returning,", "and noticing."],
        "accent": "No streaks. No score. AI only when asked.",
        "support": "reflections-ebon.vercel.app",
        "theme": "final",
    },
]


CAPTION = """I do not want Reflections to be another AI wrapper.

That was the real design constraint.

The app has AI, mood labels, tags, prompts, Life Wiki, Insights, ambient audio, and a richer note editor.

But the note still has to feel like the center of the room.

So the product rule became:

AI should wait.

It should not hover over every sentence. It should not turn private writing into a performance dashboard. It should not pretend that a pattern is the same thing as a diagnosis.

When AI appears in Reflections, it appears because the user asked for it.

That one boundary affects almost every design choice:

the writing surface gets the strongest hierarchy,
insights stay observational,
privacy language has to be concrete,
and premium adds more room without making the free version feel punished.

This carousel is less about how I built the app and more about what I am refusing to build into it.

Because for this product, restraint is not a lack of ambition.
It is the point."""


def text_size(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def draw_tracking(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, fnt, fill, tracking=3):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += text_size(draw, ch, fnt)[0] + tracking


def rounded_rect(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def paper_texture(base: tuple[int, int, int]) -> Image.Image:
    img = Image.new("RGB", (W, H), base)
    px = img.load()
    for y in range(H):
        for x in range(W):
            n = int(3 * math.sin(x * 0.027 + y * 0.011) + 2 * math.sin((x + y) * 0.018))
            px[x, y] = tuple(max(0, min(255, c + n)) for c in base)
    return img


def add_header(draw, kicker: str, dark=False):
    color = SAGE if dark else BOTANICAL
    draw_tracking(draw, (78, 72), kicker.upper(), F["label_small"], color, tracking=3)
    draw.line((78, 118, 1002, 118), fill=(90, 130, 82) if dark else LINE, width=2)


def add_footer(draw, index: int, dark=False):
    color = (145, 169, 139) if dark else (139, 151, 135)
    draw.text((78, 1006), "REFLECTIONS / PRIVATE JOURNALING", font=F["label_small"], fill=color)
    draw.text((965, 1006), f"{index:02d}/08", font=F["label_small"], fill=color)


def wrap_words(draw, text: str, fnt, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        if text_size(draw, trial, fnt)[0] <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_support(draw, text: str, x: int, y: int, max_width: int, dark=False):
    color = (210, 226, 204) if dark else MUTED
    for line in wrap_words(draw, text, F["body_small"], max_width):
        draw.text((x, y), line, font=F["body_small"], fill=color)
        y += 39


def draw_title(draw, lines: list[str], x: int, y: int, fnt, fill, leading: int):
    for line in lines:
        draw.text((x, y), line, font=fnt, fill=fill)
        y += leading
    return y


def add_editor_panel(img: Image.Image, x: int, y: int, w: int, h: int, tone="paper") -> None:
    draw = ImageDraw.Draw(img, "RGBA")
    fill = (252, 253, 248, 235) if tone == "paper" else (237, 247, 231, 235)
    rounded_rect(draw, (x, y, x + w, y + h), 32, fill, (197, 217, 188, 220), 2)
    draw.text((x + 34, y + 32), "Today", font=F["label_small"], fill=(94, 120, 89, 230))
    draw.line((x + 34, y + 80, x + w - 34, y + 80), fill=(210, 226, 204, 220), width=2)
    for i, width in enumerate([w - 110, w - 180, w - 145, w - 260]):
        yy = y + 126 + i * 48
        rounded_rect(draw, (x + 34, yy, x + 34 + width, yy + 12), 6, (184, 205, 174, 90))
    rounded_rect(draw, (x + w - 198, y + h - 82, x + w - 34, y + h - 34), 18, (28, 103, 19, 230))
    draw.text((x + w - 172, y + h - 70), "Reflect", font=F["label_small"], fill=(248, 252, 244, 255))


def add_wiki_nodes(img: Image.Image, dark=False) -> None:
    draw = ImageDraw.Draw(img, "RGBA")
    line_color = (98, 149, 88, 120) if not dark else (127, 174, 112, 110)
    fill = (247, 250, 243, 238) if not dark else (15, 74, 20, 230)
    outline = (191, 216, 181, 230) if not dark else (111, 159, 102, 180)
    nodes = [(705, 265, 230, 84, "people"), (610, 428, 260, 84, "places"), (766, 592, 210, 84, "themes")]
    centers = []
    for x, y, w, h, label in nodes:
        centers.append((x + w // 2, y + h // 2))
    for a, b in [(0, 1), (1, 2), (0, 2)]:
        draw.line((centers[a][0], centers[a][1], centers[b][0], centers[b][1]), fill=line_color, width=3)
    for x, y, w, h, label in nodes:
        rounded_rect(draw, (x, y, x + w, y + h), 26, fill, outline, 2)
        draw.text((x + 28, y + 29), label, font=F["label"], fill=(42, 77, 38, 255) if not dark else (225, 242, 218, 255))


def add_score_crossout(img: Image.Image) -> None:
    draw = ImageDraw.Draw(img, "RGBA")
    items = [(650, 280, "7 day streak"), (604, 416, "mood score 82"), (666, 552, "complete today")]
    for x, y, label in items:
        rounded_rect(draw, (x, y, x + 300, y + 74), 26, (248, 252, 244, 205), (196, 216, 187, 210), 2)
        draw.text((x + 34, y + 23), label, font=F["label"], fill=(87, 104, 83, 230))
        draw.line((x + 24, y + 58, x + 276, y + 16), fill=(154, 70, 54, 210), width=5)


def add_slide_image_reference(img: Image.Image, source_name: str, box: tuple[int, int, int, int], opacity=0.2) -> None:
    source = ROOT / "docs" / "marketing" / "reflections-pdf-reference" / source_name
    if not source.exists():
        return
    ref = Image.open(source).convert("RGB")
    x1, y1, x2, y2 = box
    ref = ImageOps.fit(ref, (x2 - x1, y2 - y1), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
    ref = ImageEnhance.Color(ref).enhance(0.55)
    ref = ImageEnhance.Contrast(ref).enhance(0.85)
    alpha = Image.new("L", ref.size, int(255 * opacity))
    img.paste(ref, (x1, y1), alpha)


def compose_slide(data: dict, index: int) -> Image.Image:
    theme = data["theme"]
    dark = theme in {"green", "dark", "final"}
    if theme == "green":
        img = paper_texture((20, 100, 10))
    elif theme == "dark":
        img = paper_texture(DARK_GREEN)
    elif theme == "sage":
        img = paper_texture(SAGE)
    elif theme == "final":
        img = paper_texture((15, 87, 11))
    else:
        img = paper_texture(PAPER)

    draw = ImageDraw.Draw(img, "RGBA")
    add_header(draw, data["kicker"], dark=dark)
    add_footer(draw, index, dark=dark)

    if index == 1:
        add_slide_image_reference(img, "page-1.png", (574, 186, 1046, 776), opacity=0.18)
        add_editor_panel(img, 592, 395, 370, 302, tone="paper")
        y = draw_title(draw, data["title"], 78, 262, F["h1_big"], DEEP, 94)
        draw.text((80, y + 26), data["accent"], font=F["italic"], fill=BOTANICAL)
        draw_support(draw, data["support"], 82, 742, 470)
    elif index == 2:
        add_score_crossout(img)
        y = draw_title(draw, data["title"], 78, 265, F["h1"], (244, 251, 238), 82)
        draw.text((82, y + 25), data["accent"], font=F["italic_small"], fill=(205, 232, 195))
        draw_support(draw, data["support"], 84, 774, 514, dark=True)
    elif index == 3:
        add_editor_panel(img, 610, 240, 354, 450, tone="paper")
        y = draw_title(draw, data["title"], 78, 236, F["h2"], DEEP, 72)
        draw.text((82, y + 36), data["accent"], font=F["italic_small"], fill=BOTANICAL)
        draw_support(draw, data["support"], 84, 778, 520)
    elif index == 4:
        add_wiki_nodes(img)
        y = draw_title(draw, data["title"], 78, 250, F["h1"], DEEP, 84)
        draw.text((82, y + 32), data["accent"], font=F["italic_small"], fill=BOTANICAL)
        draw_support(draw, data["support"], 84, 766, 496)
    elif index == 5:
        add_wiki_nodes(img, dark=True)
        y = draw_title(draw, data["title"], 78, 252, F["h1_big"], (244, 251, 238), 92)
        draw.text((82, y + 28), data["accent"], font=F["italic_small"], fill=(204, 230, 195))
        draw_support(draw, data["support"], 84, 780, 530, dark=True)
    elif index == 6:
        add_slide_image_reference(img, "page-7.png", (592, 202, 1040, 700), opacity=0.2)
        rounded_rect(draw, (618, 520, 968, 626), 28, (244, 249, 239, 225), (198, 219, 190, 230), 2)
        draw.text((650, 555), "AI included", font=F["label"], fill=BOTANICAL)
        draw.line((650, 590, 900, 590), fill=(205, 220, 198, 220), width=2)
        y = draw_title(draw, data["title"], 78, 250, F["h1"], DEEP, 84)
        draw.text((82, y + 30), data["accent"], font=F["italic_small"], fill=HONEY)
        draw_support(draw, data["support"], 84, 768, 496)
    elif index == 7:
        add_editor_panel(img, 624, 326, 336, 356, tone="paper")
        y = draw_title(draw, data["title"], 78, 260, F["h1"], (244, 251, 238), 84)
        draw.text((82, y + 30), data["accent"], font=F["italic_small"], fill=(209, 233, 198))
        draw_support(draw, data["support"], 84, 770, 500, dark=True)
    else:
        add_slide_image_reference(img, "page-8.png", (590, 176, 1050, 812), opacity=0.18)
        y = draw_title(draw, data["title"], 78, 214, F["h2"], (244, 251, 238), 67)
        draw.text((82, y + 36), data["accent"], font=F["body"], fill=(211, 235, 202))
        draw.line((82, 780, 418, 780), fill=(166, 204, 150), width=3)
        draw.text((82, 812), data["support"], font=F["italic_small"], fill=(235, 247, 230))

    return img


def write_pptx(slide_paths: list[Path], out_path: Path) -> None:
    tmp = OUT_DIR / "_pptx_tmp"
    if tmp.exists():
        shutil.rmtree(tmp)
    (tmp / "_rels").mkdir(parents=True)
    (tmp / "ppt" / "_rels").mkdir(parents=True)
    (tmp / "ppt" / "slides" / "_rels").mkdir(parents=True)
    (tmp / "ppt" / "media").mkdir(parents=True)
    (tmp / "docProps").mkdir(parents=True)

    for i, p in enumerate(slide_paths, 1):
        shutil.copyfile(p, tmp / "ppt" / "media" / f"image{i}.png")

    content_types = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
        '<Default Extension="xml" ContentType="application/xml"/>',
        '<Default Extension="png" ContentType="image/png"/>',
        '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>',
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
        '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
    ]
    for i in range(1, len(slide_paths) + 1):
        content_types.append(f'<Override PartName="/ppt/slides/slide{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>')
    content_types.append("</Types>")
    (tmp / "[Content_Types].xml").write_text("\n".join(content_types), encoding="utf-8")

    (tmp / "_rels" / ".rels").write_text(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>'
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'
        '</Relationships>',
        encoding="utf-8",
    )

    sld_ids = "".join(f'<p:sldId id="{255+i}" r:id="rId{i}"/>' for i in range(1, len(slide_paths) + 1))
    presentation = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldSz cx="9144000" cy="9144000" type="custom"/>
  <p:notesSz cx="6858000" cy="9144000"/>
  <p:sldIdLst>{sld_ids}</p:sldIdLst>
</p:presentation>'''
    (tmp / "ppt" / "presentation.xml").write_text(presentation, encoding="utf-8")

    pres_rels = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
                 '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">']
    for i in range(1, len(slide_paths) + 1):
        pres_rels.append(f'<Relationship Id="rId{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{i}.xml"/>')
    pres_rels.append("</Relationships>")
    (tmp / "ppt" / "_rels" / "presentation.xml.rels").write_text("\n".join(pres_rels), encoding="utf-8")

    for i in range(1, len(slide_paths) + 1):
        slide_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      <p:pic>
        <p:nvPicPr><p:cNvPr id="2" name="slide-{i}.png"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>
        <p:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="9144000" cy="9144000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
      </p:pic>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>'''
        (tmp / "ppt" / "slides" / f"slide{i}.xml").write_text(slide_xml, encoding="utf-8")
        (tmp / "ppt" / "slides" / "_rels" / f"slide{i}.xml.rels").write_text(
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            f'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image{i}.png"/>'
            '</Relationships>',
            encoding="utf-8",
        )

    (tmp / "docProps" / "core.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
        'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" '
        'xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        '<dc:title>Reflections LinkedIn Carousel</dc:title><dc:creator>Codex</dc:creator>'
        '</cp:coreProperties>',
        encoding="utf-8",
    )
    (tmp / "docProps" / "app.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" '
        'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
        f'<Application>Codex</Application><Slides>{len(slide_paths)}</Slides></Properties>',
        encoding="utf-8",
    )

    if out_path.exists():
        out_path.unlink()
    with zipfile.ZipFile(out_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
        for p in tmp.rglob("*"):
            if p.is_file():
                z.write(p, p.relative_to(tmp).as_posix())
    shutil.rmtree(tmp)


def main() -> None:
    SLIDE_DIR.mkdir(parents=True, exist_ok=True)
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)

    slide_paths = []
    images = []
    for i, slide in enumerate(SLIDES, 1):
        img = compose_slide(slide, i)
        path = SLIDE_DIR / f"reflections-carousel-{i:02d}.png"
        img.save(path, quality=95)
        slide_paths.append(path)
        images.append(img.convert("RGB"))

    pdf_path = OUT_DIR / "reflections-linkedin-carousel.pdf"
    images[0].save(pdf_path, save_all=True, append_images=images[1:], resolution=144)

    pptx_path = OUT_DIR / "reflections-linkedin-carousel.pptx"
    write_pptx(slide_paths, pptx_path)

    (OUT_DIR / "linkedin-caption.txt").write_text(CAPTION + "\n", encoding="utf-8")
    (SOURCE_DIR / "slide-copy.json").write_text(json.dumps(SLIDES, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({
        "slides": [str(p) for p in slide_paths],
        "pdf": str(pdf_path),
        "pptx": str(pptx_path),
        "caption": str(OUT_DIR / "linkedin-caption.txt"),
    }, indent=2))


if __name__ == "__main__":
    main()
