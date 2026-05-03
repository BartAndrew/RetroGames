"""
Generate modernized SVG sprite sheets for Sandbag Siege V2.

These sprites are still simple enough for students to follow,
but they use cleaner shading and a less retro-pixel-heavy look.
"""

from pathlib import Path


OUT = Path(__file__).resolve().parent


def svg_document(width, height, content):
    return "\n".join(
        [
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
            "<defs>",
            '<linearGradient id="skyBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#b8e7ff"/><stop offset="100%" stop-color="#4b82b1"/></linearGradient>',
            '<linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#7e8ea2"/><stop offset="100%" stop-color="#304055"/></linearGradient>',
            '<linearGradient id="armorOlive" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6b8f79"/><stop offset="100%" stop-color="#2e473a"/></linearGradient>',
            '<linearGradient id="armorBrown" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8a5f53"/><stop offset="100%" stop-color="#4c2f29"/></linearGradient>',
            '<linearGradient id="armorBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6fc8ff"/><stop offset="100%" stop-color="#234f74"/></linearGradient>',
            '<radialGradient id="blast" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff7d6"/><stop offset="45%" stop-color="#ffb15e"/><stop offset="100%" stop-color="#d8563e"/></radialGradient>',
            "</defs>",
            *content,
            "</svg>",
        ]
    )


def shadow(x, y, w, h, opacity=0.22):
    return f'<ellipse cx="{x}" cy="{y}" rx="{w}" ry="{h}" fill="rgba(0,0,0,{opacity})" />'


def person_frame(cell_x, cell_y, primary, secondary, accent, pose):
    ox = cell_x * 96
    oy = cell_y * 96
    sway = [0, 2, 0, -2][pose]
    arm = [0, -1, 1, 0][pose]
    return [
        shadow(ox + 48, oy + 82, 18, 6),
        f'<path d="M {ox+30} {oy+72} Q {ox+48} {oy+20} {ox+66} {oy+72}" fill="{primary}" />',
        f'<circle cx="{ox+48}" cy="{oy+24}" r="12" fill="#f1c8a4" />',
        f'<path d="M {ox+36} {oy+22} Q {ox+48} {oy+8} {ox+60} {oy+22} L {ox+58} {oy+30} Q {ox+48} {oy+20} {ox+38} {oy+30} Z" fill="{secondary}" />',
        f'<rect x="{ox+36+arm}" y="{oy+36}" width="24" height="24" rx="10" fill="{primary}" />',
        f'<rect x="{ox+56}" y="{oy+40+sway}" width="18" height="7" rx="3" fill="{accent}" />',
        f'<rect x="{ox+70}" y="{oy+42+sway}" width="10" height="3" rx="1" fill="#232d39" />',
        f'<rect x="{ox+40-sway}" y="{oy+60}" width="10" height="22" rx="4" fill="{secondary}" />',
        f'<rect x="{ox+50+sway}" y="{oy+60}" width="10" height="22" rx="4" fill="{secondary}" />',
        f'<rect x="{ox+38-sway}" y="{oy+80}" width="12" height="4" rx="2" fill="#202733" />',
        f'<rect x="{ox+50+sway}" y="{oy+80}" width="12" height="4" rx="2" fill="#202733" />',
    ]


def build_units():
    shapes = []
    colors = [
        ("url(#armorOlive)", "#223629", "#4fd1ff"),
        ("url(#armorBrown)", "#37211e", "#ffd06d"),
        ("url(#armorBlue)", "#18384f", "#d2f6ff"),
    ]
    for pose in range(4):
        shapes.extend(person_frame(pose, 0, *colors[0], pose))
        shapes.extend(person_frame(pose, 1, *colors[1], pose))
        shapes.extend(person_frame(pose, 2, *colors[2], pose))

    pickup_base = [
        ('ammo', 0, '#355d84', '#9fe4ff', '#d9f5ff'),
        ('medkit', 1, '#45685e', '#73e6b0', '#ebfff6'),
        ('power', 2, '#5f4c2d', '#ffd26d', '#fff6cd'),
        ('grenade', 3, '#5c4440', '#ff8b5d', '#fff0e8'),
    ]
    for _, col, base, accent, glow in pickup_base:
        ox = col * 96
        oy = 3 * 96
        shapes.extend(
            [
                shadow(ox + 48, oy + 82, 20, 6, 0.14),
                f'<rect x="{ox+27}" y="{oy+28}" width="42" height="42" rx="12" fill="{base}" />',
                f'<rect x="{ox+33}" y="{oy+34}" width="30" height="30" rx="9" fill="{accent}" />',
                f'<circle cx="{ox+48}" cy="{oy+49}" r="8" fill="{glow}" />',
            ]
        )

    (OUT / "modern_units.svg").write_text(svg_document(384, 384, shapes), encoding="utf-8")


def build_vehicles():
    shapes = []
    for pose in range(4):
        ox = pose * 160
        oy = 0
        rotor = [0, 3, 0, -3][pose]
        shapes.extend(
            [
                shadow(ox + 80, oy + 84, 48, 10),
                f'<path d="M {ox+28} {oy+56} L {ox+122} {oy+56} L {ox+132} {oy+66} L {ox+40} {oy+76} Z" fill="url(#steel)" />',
                f'<path d="M {ox+52} {oy+40} L {ox+100} {oy+40} L {ox+116} {oy+56} L {ox+44} {oy+56} Z" fill="#50667f" />',
                f'<rect x="{ox+24}" y="{oy+48}" width="112" height="5" rx="2" fill="#1f2935" />',
                f'<rect x="{ox+76}" y="{oy+22}" width="8" height="22" rx="3" fill="#2a3947" />',
                f'<rect x="{ox+34+rotor}" y="{oy+18}" width="92" height="4" rx="2" fill="#121920" />',
                f'<rect x="{ox+14}" y="{oy+62}" width="22" height="4" rx="2" fill="#1a222b" />',
                f'<rect x="{ox+126}" y="{oy+62}" width="22" height="4" rx="2" fill="#1a222b" />',
            ]
        )

    (OUT / "modern_vehicles.svg").write_text(svg_document(640, 96, shapes), encoding="utf-8")


def build_fx():
    shapes = []
    for pose in range(4):
        ox = pose * 96
        spread = [14, 18, 22, 12][pose]
        shapes.extend(
            [
                f'<circle cx="{ox+48}" cy="48" r="{spread}" fill="rgba(255,230,180,0.22)" />',
                f'<polygon points="{ox+48},18 {ox+62},48 {ox+48},78 {ox+34},48" fill="#fff7d6" />',
                f'<polygon points="{ox+48},24 {ox+58},48 {ox+48},72 {ox+38},48" fill="#ffba60" />',
            ]
        )

        oy = 96
        shapes.extend(
            [
                f'<circle cx="{ox+48}" cy="{oy+48}" r="18" fill="rgba(111,208,255,0.18)" />',
                f'<path d="M {ox+24} {oy+48} L {ox+72} {oy+48} M {ox+48} {oy+24} L {ox+48} {oy+72} M {ox+30} {oy+30} L {ox+66} {oy+66} M {ox+66} {oy+30} L {ox+30} {oy+66}" stroke="#d5f3ff" stroke-width="5" stroke-linecap="round" />',
            ]
        )

        oy = 192
        radius = [24, 30, 36, 26][pose]
        shapes.extend(
            [
                f'<circle cx="{ox+48}" cy="{oy+48}" r="{radius}" fill="url(#blast)" />',
                f'<circle cx="{ox+48}" cy="{oy+48}" r="{radius * 0.46}" fill="#fff7d6" opacity="0.9" />',
            ]
        )

    (OUT / "modern_fx.svg").write_text(svg_document(384, 288, shapes), encoding="utf-8")


def build_weapon():
    shapes = []

    # Rifle
    ox = 0
    oy = 0
    shapes.extend(
        [
            f'<path d="M {ox+24} {oy+126} Q {ox+92} {oy+92} {ox+158} {oy+101} L {ox+230} {oy+108} L {ox+266} {oy+90} L {ox+304} {oy+98} L {ox+304} {oy+124} L {ox+218} {oy+134} L {ox+130} {oy+147} L {ox+58} {oy+156} Z" fill="#2b3948" />',
            f'<rect x="{ox+144}" y="{oy+96}" width="112" height="18" rx="7" fill="#5f6d7d" />',
            f'<rect x="{ox+182}" y="{oy+80}" width="36" height="18" rx="5" fill="#101923" />',
            f'<rect x="{ox+94}" y="{oy+112}" width="36" height="46" rx="8" fill="#1b2733" />',
            f'<rect x="{ox+74}" y="{oy+126}" width="26" height="22" rx="7" fill="#d39a67" />',
        ]
    )

    # Auto rifle
    ox = 320
    shapes.extend(
        [
            f'<path d="M {ox+20} {oy+128} Q {ox+76} {oy+90} {ox+148} {oy+102} L {ox+220} {oy+106} L {ox+286} {oy+112} L {ox+286} {oy+132} L {ox+214} {oy+140} L {ox+148} {oy+152} L {ox+70} {oy+160} Z" fill="#203342" />',
            f'<rect x="{ox+130}" y="{oy+96}" width="98" height="16" rx="6" fill="#4e6880" />',
            f'<rect x="{ox+188}" y="{oy+114}" width="22" height="40" rx="7" fill="#121c26" />',
            f'<rect x="{ox+92}" y="{oy+122}" width="28" height="32" rx="7" fill="#101923" />',
            f'<rect x="{ox+60}" y="{oy+130}" width="24" height="18" rx="6" fill="#cb8f61" />',
        ]
    )

    (OUT / "modern_weapon.svg").write_text(svg_document(640, 180, shapes), encoding="utf-8")


if __name__ == "__main__":
    build_units()
    build_vehicles()
    build_fx()
    build_weapon()
    print("Generated modern Sandbag Siege V2 assets in", OUT)
