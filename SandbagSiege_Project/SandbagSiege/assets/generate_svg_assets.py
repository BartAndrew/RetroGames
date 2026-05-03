"""
Generate simple retro-style SVG sprite sheets for Sandbag Siege.

Why generate the art with code?
- It keeps the assets reproducible.
- Students can see that programming can make pictures too.
- The same small drawing tools can build many different sprites.
"""

from pathlib import Path


OUTPUT = Path(__file__).resolve().parent


class Sheet:
    def __init__(self, cols, rows, cell_w, cell_h, pixel):
        self.cols = cols
        self.rows = rows
        self.cell_w = cell_w
        self.cell_h = cell_h
        self.pixel = pixel
        self.width = cols * cell_w
        self.height = rows * cell_h
        self.parts = []

    def rect(self, x, y, w, h, fill):
        self.parts.append(
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" />'
        )

    def pixel_rect(self, frame_x, frame_y, px, py, pw, ph, fill):
        x = frame_x * self.cell_w + px * self.pixel
        y = frame_y * self.cell_h + py * self.pixel
        self.rect(x, y, pw * self.pixel, ph * self.pixel, fill)

    def save(self, filename):
        svg = [
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.width}" height="{self.height}" viewBox="0 0 {self.width} {self.height}" shape-rendering="crispEdges">'
        ]
        svg.extend(self.parts)
        svg.append("</svg>")
        (OUTPUT / filename).write_text("\n".join(svg), encoding="utf-8")


def draw_checker_shadow(sheet, frame_x, frame_y, shadow="#00000022"):
    for py in range(sheet.cell_h // sheet.pixel):
        for px in range(sheet.cell_w // sheet.pixel):
            if (px + py) % 5 == 0 and py > 11:
                sheet.pixel_rect(frame_x, frame_y, px, py, 1, 1, shadow)


def draw_soldier(sheet, frame_x, frame_y, body, trim, skin, frame_step):
    draw_checker_shadow(sheet, frame_x, frame_y)
    shift = [0, 1, 0, -1][frame_step]
    # helmet
    sheet.pixel_rect(frame_x, frame_y, 5, 2, 6, 2, trim)
    # face
    sheet.pixel_rect(frame_x, frame_y, 6, 4, 4, 2, skin)
    # torso
    sheet.pixel_rect(frame_x, frame_y, 5, 6, 6, 4, body)
    # arm
    sheet.pixel_rect(frame_x, frame_y, 10, 6, 3, 2, trim)
    sheet.pixel_rect(frame_x, frame_y, 12, 7, 2, 1, "#2e2416")
    # rifle
    sheet.pixel_rect(frame_x, frame_y, 13, 7, 2, 1, "#2f313b")
    # legs
    sheet.pixel_rect(frame_x, frame_y, 5, 10, 2, 3, trim)
    sheet.pixel_rect(frame_x, frame_y, 9, 10, 2, 3, trim)
    sheet.pixel_rect(frame_x, frame_y, 5 + shift, 13, 2, 2, "#2f313b")
    sheet.pixel_rect(frame_x, frame_y, 9 - shift, 13, 2, 2, "#2f313b")


def draw_sniper(sheet, frame_x, frame_y, body, trim, skin, frame_step):
    draw_checker_shadow(sheet, frame_x, frame_y)
    shift = [0, 1, 0, -1][frame_step]
    sheet.pixel_rect(frame_x, frame_y, 4, 3, 6, 2, trim)
    sheet.pixel_rect(frame_x, frame_y, 5, 5, 4, 2, skin)
    sheet.pixel_rect(frame_x, frame_y, 4, 7, 7, 3, body)
    sheet.pixel_rect(frame_x, frame_y, 10, 8, 4, 1, "#303448")
    sheet.pixel_rect(frame_x, frame_y, 3, 10, 3, 2, trim)
    sheet.pixel_rect(frame_x, frame_y, 6 + shift, 10, 4, 2, trim)
    sheet.pixel_rect(frame_x, frame_y, 10, 10, 4, 1, "#2f313b")
    sheet.pixel_rect(frame_x, frame_y, 4 + shift, 12, 3, 1, "#2f313b")


def draw_player(sheet, frame_x, frame_y, frame_step):
    sand = "#d8a364"
    body = "#2c5ca8"
    trim = "#11213f"
    skin = "#f2c28d"
    pop = [0, 2, 4, 6][frame_step]

    # sandbags
    for offset in range(0, 16, 4):
      sheet.pixel_rect(frame_x, frame_y, offset // 1, 12, 4, 2, sand)
    sheet.pixel_rect(frame_x, frame_y, 2, 10, 11, 2, "#bf824f")

    # player
    sheet.pixel_rect(frame_x, frame_y, 6, 8 - pop, 4, 2, trim)
    sheet.pixel_rect(frame_x, frame_y, 6, 10 - pop, 4, 2, skin)
    sheet.pixel_rect(frame_x, frame_y, 5, 12 - pop, 6, 3, body)
    sheet.pixel_rect(frame_x, frame_y, 10, 12 - pop, 4, 1, "#313446")
    sheet.pixel_rect(frame_x, frame_y, 13, 12 - pop, 2, 1, "#171717")


def draw_pickup(sheet, frame_x, frame_y, kind):
    draw_checker_shadow(sheet, frame_x, frame_y, "#00000014")
    if kind == "ammo":
        sheet.pixel_rect(frame_x, frame_y, 5, 5, 6, 6, "#5473c9")
        sheet.pixel_rect(frame_x, frame_y, 6, 3, 4, 2, "#79c9ff")
        sheet.pixel_rect(frame_x, frame_y, 7, 7, 2, 4, "#d7f0ff")
    elif kind == "health":
        sheet.pixel_rect(frame_x, frame_y, 5, 5, 6, 6, "#f5dfb0")
        sheet.pixel_rect(frame_x, frame_y, 7, 4, 2, 8, "#ff6e52")
        sheet.pixel_rect(frame_x, frame_y, 5, 6, 6, 2, "#ff6e52")
    elif kind == "power":
        sheet.pixel_rect(frame_x, frame_y, 5, 5, 6, 6, "#18393d")
        sheet.pixel_rect(frame_x, frame_y, 7, 3, 2, 10, "#77f0ad")
        sheet.pixel_rect(frame_x, frame_y, 5, 7, 6, 2, "#77f0ad")
    elif kind == "support":
        sheet.pixel_rect(frame_x, frame_y, 5, 5, 6, 6, "#6a492f")
        sheet.pixel_rect(frame_x, frame_y, 4, 8, 8, 2, "#ffbf57")
        sheet.pixel_rect(frame_x, frame_y, 6, 4, 4, 2, "#ffe8a6")


def draw_wheel(sheet, frame_x, frame_y, px, py):
    sheet.pixel_rect(frame_x, frame_y, px, py, 3, 3, "#242734")
    sheet.pixel_rect(frame_x, frame_y, px + 1, py + 1, 1, 1, "#8b97a8")


def draw_vehicle_body(sheet, frame_x, frame_y, base, trim):
    draw_checker_shadow(sheet, frame_x, frame_y, "#00000010")
    sheet.pixel_rect(frame_x, frame_y, 6, 16, 18, 6, base)
    sheet.pixel_rect(frame_x, frame_y, 10, 12, 8, 4, trim)


def draw_jeep(sheet, frame_x, frame_y, frame_step):
    draw_vehicle_body(sheet, frame_x, frame_y, "#497051", "#32493a")
    draw_wheel(sheet, frame_x, frame_y, 8, 22)
    draw_wheel(sheet, frame_x, frame_y, 20, 22)
    sheet.pixel_rect(frame_x, frame_y, 18 + frame_step, 10, 3, 2, "#2b2e38")
    sheet.pixel_rect(frame_x, frame_y, 22, 14, 5, 1, "#2b2e38")


def draw_truck(sheet, frame_x, frame_y, frame_step):
    draw_vehicle_body(sheet, frame_x, frame_y, "#846246", "#5d4530")
    draw_wheel(sheet, frame_x, frame_y, 8, 22)
    draw_wheel(sheet, frame_x, frame_y, 18, 22)
    draw_wheel(sheet, frame_x, frame_y, 24, 22)
    sheet.pixel_rect(frame_x, frame_y, 18, 12, 8, 6, "#8d745a")
    sheet.pixel_rect(frame_x, frame_y, 24, 14 + frame_step, 3, 2, "#2b2e38")


def draw_tank(sheet, frame_x, frame_y, frame_step):
    draw_checker_shadow(sheet, frame_x, frame_y, "#00000010")
    sheet.pixel_rect(frame_x, frame_y, 5, 18, 20, 5, "#5f6f42")
    sheet.pixel_rect(frame_x, frame_y, 9, 14, 8, 4, "#7f9158")
    sheet.pixel_rect(frame_x, frame_y, 16, 15, 8, 2, "#2f313b")
    sheet.pixel_rect(frame_x, frame_y, 23 + frame_step, 16, 5, 1, "#2f313b")
    for px in range(6, 24, 4):
        draw_wheel(sheet, frame_x, frame_y, px, 22)


def draw_helicopter(sheet, frame_x, frame_y, frame_step):
    draw_checker_shadow(sheet, frame_x, frame_y, "#00000010")
    sheet.pixel_rect(frame_x, frame_y, 8, 16, 14, 5, "#6d7057")
    sheet.pixel_rect(frame_x, frame_y, 18, 17, 8, 2, "#91977c")
    sheet.pixel_rect(frame_x, frame_y, 26, 17, 6, 1, "#434852")
    rotor_shift = [0, 2, -2, 1][frame_step]
    sheet.pixel_rect(frame_x, frame_y, 6 + rotor_shift, 11, 22, 1, "#2d303a")
    sheet.pixel_rect(frame_x, frame_y, 14, 12, 3, 4, "#2d303a")


def draw_gunship(sheet, frame_x, frame_y, frame_step):
    draw_checker_shadow(sheet, frame_x, frame_y, "#00000010")
    sheet.pixel_rect(frame_x, frame_y, 6, 13, 20, 7, "#3d5662")
    sheet.pixel_rect(frame_x, frame_y, 11, 10, 10, 3, "#6d8790")
    sheet.pixel_rect(frame_x, frame_y, 24, 15, 7, 2, "#202530")
    sheet.pixel_rect(frame_x, frame_y, 4, 16, 4, 2, "#202530")
    rotor_shift = [0, 2, 0, -2][frame_step]
    sheet.pixel_rect(frame_x, frame_y, 3 + rotor_shift, 8, 26, 1, "#232a34")
    sheet.pixel_rect(frame_x, frame_y, 15, 9, 3, 4, "#232a34")
    sheet.pixel_rect(frame_x, frame_y, 10, 20, 12, 2, "#202530")


def draw_muzzle(sheet, frame_x, frame_y, frame_step):
    colors = ["#ffe8a6", "#ffbf57", "#ff6e52"]
    for index, color in enumerate(colors):
        size = 5 - index
        sheet.pixel_rect(frame_x, frame_y, 8 - index, 7 - index, size, size, color)
        sheet.pixel_rect(frame_x, frame_y, 12 + index + frame_step, 8, 3, 1, color)


def draw_spark(sheet, frame_x, frame_y, frame_step):
    colors = ["#fff6dc", "#ffbf57", "#79c9ff"]
    for index, color in enumerate(colors):
        sheet.pixel_rect(frame_x, frame_y, 8, 8, 1 + frame_step, 1, color)
        sheet.pixel_rect(frame_x, frame_y, 8 - index, 8 - index, 1, 1, color)
        sheet.pixel_rect(frame_x, frame_y, 8 + index, 8 + index, 1, 1, color)
        sheet.pixel_rect(frame_x, frame_y, 8 + index, 8 - index, 1, 1, color)


def draw_blast(sheet, frame_x, frame_y, frame_step):
    sizes = [5, 7, 9, 11]
    color_sets = [
        ("#fff6dc", "#ffbf57", "#ff6e52"),
        ("#fff6dc", "#ffd880", "#ff9c52"),
        ("#ffe8a6", "#ffbf57", "#ff6e52"),
        ("#ffd880", "#ff9c52", "#d75a38"),
    ]
    size = sizes[frame_step]
    outer, middle, inner = color_sets[frame_step]
    sheet.pixel_rect(frame_x, frame_y, 8 - size // 2, 8 - size // 2, size, size, outer)
    sheet.pixel_rect(frame_x, frame_y, 9 - size // 3, 9 - size // 3, size - 2, size - 2, middle)
    sheet.pixel_rect(frame_x, frame_y, 10 - size // 4, 10 - size // 4, size - 4, size - 4, inner)


def draw_flame(sheet, frame_x, frame_y, frame_step):
    height = [7, 9, 8, 6][frame_step]
    sheet.pixel_rect(frame_x, frame_y, 7, 10 - height // 2, 4, height, "#ff6e52")
    sheet.pixel_rect(frame_x, frame_y, 8, 9 - height // 3, 2, height - 2, "#ffbf57")
    sheet.pixel_rect(frame_x, frame_y, 8, 8 - height // 5, 1, height - 4, "#fff6dc")


def build_units():
    sheet = Sheet(cols=4, rows=4, cell_w=32, cell_h=32, pixel=2)
    for frame in range(4):
        draw_soldier(sheet, frame, 0, "#497051", "#32493a", "#f1c48c", frame)
        draw_sniper(sheet, frame, 1, "#7d5448", "#563830", "#f0c28d", frame)
        draw_player(sheet, frame, 2, frame)

    draw_pickup(sheet, 0, 3, "ammo")
    draw_pickup(sheet, 1, 3, "health")
    draw_pickup(sheet, 2, 3, "power")
    draw_pickup(sheet, 3, 3, "support")
    sheet.save("units.svg")


def build_vehicles():
    sheet = Sheet(cols=4, rows=3, cell_w=64, cell_h=48, pixel=2)
    for frame in range(2):
        draw_jeep(sheet, frame, 0, frame)
        draw_truck(sheet, frame + 2, 0, frame)
        draw_tank(sheet, frame, 1, frame)
        draw_helicopter(sheet, frame + 2, 1, frame)

    for frame in range(4):
        draw_gunship(sheet, frame, 2, frame)
    sheet.save("vehicles.svg")


def build_effects():
    sheet = Sheet(cols=4, rows=4, cell_w=32, cell_h=32, pixel=2)
    for frame in range(3):
        draw_muzzle(sheet, frame, 0, frame)
        draw_spark(sheet, frame, 1, frame)
    for frame in range(4):
        draw_blast(sheet, frame, 2, frame)
        draw_flame(sheet, frame, 3, frame)
    sheet.save("effects.svg")


if __name__ == "__main__":
    build_units()
    build_vehicles()
    build_effects()
    print("Sprite sheets generated in", OUTPUT)
