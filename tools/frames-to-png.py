# render-frames.js çıktısını saat için PNG karelerine çevirir.
# Kullanım: python tools/frames-to-png.py <frames.json> <çıktı klasörü>
# Pillow gerekir: python -m pip install pillow

import json
import os
import sys

from PIL import Image, ImageDraw, ImageFilter

SIZE = 160           # saatte gösterilen boyut; saat her kareyi SIZE*SIZE*4 baytlık bitmap'e çevirir
SS = 3               # kenar yumuşatma için büyük çizip küçültme
SCALE = 0.46         # -1..1 koordinatın ekrandaki yarıçapı (SIZE oranı)

# yakından uzağa: parlaktan sönüğe (prototipteki hologram rengi)
COLORS = [(90, 240, 255), (58, 168, 180), (34, 101, 109), (18, 58, 64)]


def bucket(d):
    k = int(((d + 1) * 0.5) * len(COLORS))
    return max(0, min(len(COLORS) - 1, k))


def draw_frame(segs):
    big = SIZE * SS
    c = big / 2
    s = big * SCALE
    layers = [[] for _ in COLORS]
    for x1, y1, x2, y2, d in segs:
        layers[bucket(d)].append((c + x1 * s, c + y1 * s, c + x2 * s, c + y2 * s))

    lines = Image.new('RGB', (big, big), (0, 0, 0))
    dr = ImageDraw.Draw(lines)
    # uzaktan yakına: yakın çizgiler üstte kalsın
    for b in range(len(COLORS) - 1, -1, -1):
        for x1, y1, x2, y2 in layers[b]:
            dr.line((x1, y1, x2, y2), fill=COLORS[b], width=2 * SS)

    # hafif parıltı: bulanık kopya altta
    glow = lines.filter(ImageFilter.GaussianBlur(4 * SS))
    img = Image.blend(glow, lines, 0.75)
    img = Image.eval(img, lambda v: min(255, int(v * 1.25)))
    return img.resize((SIZE, SIZE), Image.LANCZOS)


def diff(a, b):
    # iki karenin ortalama piksel farkı (0 = aynı)
    pa, pb = a.convert('L').tobytes(), b.convert('L').tobytes()
    return sum(abs(x - y) for x, y in zip(pa, pb)) / float(len(pa))


def main():
    data = json.load(open(sys.argv[1], encoding='utf8'))
    out = sys.argv[2]
    total = 0
    for shape in data['shapes']:
        folder = os.path.join(out, shape['id'])
        os.makedirs(folder, exist_ok=True)
        frames = shape['frames']
        first = draw_frame(frames[0])
        # son kare (period kadar dönmüş) ilk kareyle aynı olmalı, yoksa döngü sıçrar
        loop = diff(first, draw_frame(frames[-1]))
        step = diff(first, draw_frame(frames[1]))
        for i, segs in enumerate(frames[:-1]):
            img = first if i == 0 else draw_frame(segs)
            img.save(os.path.join(folder, '%d.png' % i), optimize=True)
            total += 1
        print('%-9s %2d kare  dongu farki %.2f  kare farki %.2f%s' % (
            shape['id'], len(frames) - 1, loop, step, '  <-- SICRAR' if loop > step * 0.3 else ''))
    print('toplam', total, 'kare')


if __name__ == '__main__':
    main()
