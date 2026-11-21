"""Generate original fictional catalog and SVG art; no provider access."""

from pathlib import Path
import json, math, html

R = Path(__file__).resolve().parents[1]
rows = [
    ("The Last Observatory", "English", "Science fiction", "movie"),
    ("Monsoon Letters", "Hindi", "Drama", "movie"),
    ("City of Quiet Signals", "English", "Thriller", "series"),
    ("The Paper Moon Club", "English", "Animation", "movie"),
    ("A Map of Small Wonders", "International", "Adventure", "series"),
    ("Midnight in Marigold", "Hindi", "Comedy", "movie"),
    ("Beyond the Blue Station", "English", "Science fiction", "series"),
    ("The Lantern Keepers", "International", "Drama", "movie"),
    ("Cloud Garden", "English", "Animation", "series"),
    ("One More Sunday", "Hindi", "Drama", "series"),
    ("The Ninth Platform", "English", "Thriller", "movie"),
    ("Notes from Tomorrow", "International", "Science fiction", "movie"),
    ("The Little Comet", "English", "Animation", "movie"),
    ("Harbour of Echoes", "International", "Thriller", "series"),
    ("Gully Number Seven", "Hindi", "Comedy", "series"),
    ("Where the River Turns", "English", "Adventure", "movie"),
    ("The Borrowed Summer", "International", "Drama", "series"),
    ("Chai at Sunrise", "Hindi", "Drama", "movie"),
    ("Tiny Planet Explorers", "English", "Animation", "series"),
    ("The Clockwork Coast", "International", "Adventure", "movie"),
    ("Signal Lost, Found Again", "English", "Thriller", "series"),
    ("The Mango Tree Mystery", "Hindi", "Adventure", "movie"),
    ("A Perfectly Ordinary Orbit", "English", "Comedy", "movie"),
    ("The Moonlight Post Office", "International", "Animation", "series"),
]
items = []
for i, (title, language, genre, kind) in enumerate(rows, 1):
    items.append(
        dict(
            id=f"demo-{i:03}",
            title=title,
            language=language,
            genre=genre,
            kind=kind,
            kids=genre == "Animation",
            year=2026,
            releaseDate=f"2026-11-{max(1, 22 - i):02}",
            rating=round(7.1 + (i % 9) * 0.17, 1),
            criticScore=72 + (i * 7) % 24,
            votes=200 + (i * 1879) % 32000,
            runtime=42 + (i % 3) * 6 if kind == "series" else 88 + (i * 7) % 53,
            platforms=[["Orbit Stream", "Lantern+", "Frame House"][i % 3]]
            + (["Frame House"] if i % 4 == 0 and i % 3 != 2 else []),
            description=f"An original fictional {genre.lower()} story created for this portfolio demonstration. Its characters follow an unexpected clue and discover what matters along the way. No actual film, availability or rating is represented.",
        )
    )
    colors = [
        ("#1d425a", "#f1c67a"),
        ("#51355c", "#ea9b83"),
        ("#214c49", "#9ed3a5"),
        ("#333b6c", "#b6bce9"),
        ("#68412e", "#e9c493"),
        ("#42385d", "#b8d9d3"),
    ]
    a, b = colors[i % len(colors)]
    stars = "".join(
        f'<circle cx="{(j * 83 + i * 19) % 300}" cy="{(j * 47 + i * 13) % 410}" r="{1 + j % 3}" fill="{b}" opacity=".35"/>'
        for j in range(20)
    )
    safe = html.escape(title)
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="300" height="440" viewBox="0 0 300 440"><title>{safe} — original demo artwork</title><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="{a}"/><stop offset="1" stop-color="#111c29"/></linearGradient></defs><rect width="300" height="440" fill="url(#g)"/>{stars}<circle cx="150" cy="160" r="{54 + i % 5 * 6}" fill="none" stroke="{b}" stroke-width="2" opacity=".8"/><path d="M0 330 Q80 {170 + i * 3} 150 280 T300 270 V440 H0" fill="{b}" opacity=".17"/><path d="M0 380 Q90 250 190 340 T300 320 V440 H0" fill="{b}" opacity=".2"/><text x="24" y="35" font-family="sans-serif" font-size="10" letter-spacing="3" fill="{b}">FRAMEFOLIO ORIGINAL STUDY</text><text x="24" y="374" font-family="sans-serif" font-size="48" font-weight="700" fill="#fff">{i:02}</text><text x="24" y="404" font-family="sans-serif" font-size="12" fill="{b}">{genre.upper()} · FICTIONAL TITLE</text></svg>'''
    (R / f"docs/assets/{i:03}.svg").write_text(svg)
payload = dict(
    schemaVersion=1,
    demo=True,
    generatedAt="2026-11-21T12:00:00Z",
    source="Original fictional fixture; not a live provider feed",
    items=items,
)
(R / "docs/data/catalog.json").write_text(json.dumps(payload, indent=2) + "\n")
print(f"Generated {len(items)} fictional titles and original SVGs")
