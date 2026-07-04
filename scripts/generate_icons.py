from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "icons"
SCALE = 2
CANVAS = 512 * SCALE


def px(value: int) -> int:
    return value * SCALE


image = Image.new("RGB", (CANVAS, CANVAS), "#123b2f")
draw = ImageDraw.Draw(image)

draw.ellipse((px(354), px(54), px(458), px(158)), fill="#2d765e")
draw.rounded_rectangle(
    (px(112), px(104), px(400), px(408)),
    radius=px(64),
    fill="#f3f7f4",
)

draw.polygon(
    [
        (px(160), px(322)),
        (px(160), px(172)),
        (px(204), px(172)),
        (px(256), px(247)),
        (px(308), px(172)),
        (px(352), px(172)),
        (px(352), px(322)),
        (px(300), px(322)),
        (px(300), px(252)),
        (px(277), px(286)),
        (px(235), px(286)),
        (px(212), px(252)),
        (px(212), px(322)),
    ],
    fill="#176c52",
)

draw.rounded_rectangle(
    (px(162), px(344), px(350), px(362)),
    radius=px(9),
    fill="#b6d5c7",
)

outputs = {
    "apple-touch-icon.png": 180,
    "icon-192.png": 192,
    "icon-512.png": 512,
    "icon-maskable-512.png": 512,
}

for filename, size in outputs.items():
    resized = image.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(ICON_DIR / filename, "PNG", optimize=True)

print(f"Created {len(outputs)} MiseNote icons")
