# Odak uygulamasının simgelerini ve uygulama ikonunu çizer (Pillow).
# Kullanım: python tools/make-icons.py
# Saat her resmi ham bitmap'e çevirir; simgeler küçük tutulur.

import math
import os

from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(__file__), '..', 'watch', 'entry', 'src', 'main')
ICONS = os.path.join(ROOT, 'js', 'MainAbility', 'common', 'icons')
MEDIA = os.path.join(ROOT, 'resources', 'base', 'media')

SS = 4  # büyük çizip küçültme (kenar yumuşatma)

ORANGE = (255, 138, 61)
GREEN = (61, 220, 132)
BLUE = (77, 163, 255)
CYAN = (90, 240, 255)
WHITE = (240, 244, 248)
DARK = (14, 20, 26)


def canvas(n):
    return Image.new('RGBA', (n * SS, n * SS), (0, 0, 0, 0))


def done(img, n):
    return img.resize((n, n), Image.LANCZOS)


def play(n, col):
    im = canvas(n); d = ImageDraw.Draw(im); s = n * SS
    d.polygon([(s * 0.32, s * 0.2), (s * 0.32, s * 0.8), (s * 0.82, s * 0.5)], fill=col)
    return done(im, n)


def pause(n, col):
    im = canvas(n); d = ImageDraw.Draw(im); s = n * SS
    d.rounded_rectangle((s * 0.24, s * 0.2, s * 0.42, s * 0.8), radius=s * 0.05, fill=col)
    d.rounded_rectangle((s * 0.58, s * 0.2, s * 0.76, s * 0.8), radius=s * 0.05, fill=col)
    return done(im, n)


def skip(n, col):
    im = canvas(n); d = ImageDraw.Draw(im); s = n * SS
    d.polygon([(s * 0.18, s * 0.22), (s * 0.18, s * 0.78), (s * 0.56, s * 0.5)], fill=col)
    d.polygon([(s * 0.44, s * 0.22), (s * 0.44, s * 0.78), (s * 0.82, s * 0.5)], fill=col)
    return done(im, n)


def reset(n, col):
    im = canvas(n); d = ImageDraw.Draw(im); s = n * SS
    w = int(s * 0.1)
    d.arc((s * 0.2, s * 0.2, s * 0.8, s * 0.8), start=40, end=330, fill=col, width=w)
    # ok ucu
    a = math.radians(40)
    cx, cy, r = s * 0.5, s * 0.5, s * 0.3
    x, y = cx + r * math.cos(a), cy + r * math.sin(a)
    d.polygon([(x + s * 0.12, y - s * 0.02), (x - s * 0.06, y - s * 0.06), (x + s * 0.02, y + s * 0.13)], fill=col)
    return done(im, n)


def gear(n, col):
    im = canvas(n); d = ImageDraw.Draw(im); s = n * SS
    cx = cy = s / 2
    for i in range(8):
        a = i * math.pi / 4
        x, y = cx + math.cos(a) * s * 0.34, cy + math.sin(a) * s * 0.34
        d.ellipse((x - s * 0.08, y - s * 0.08, x + s * 0.08, y + s * 0.08), fill=col)
    d.ellipse((cx - s * 0.3, cy - s * 0.3, cx + s * 0.3, cy + s * 0.3), fill=col)
    d.ellipse((cx - s * 0.12, cy - s * 0.12, cx + s * 0.12, cy + s * 0.12), fill=(0, 0, 0, 0))
    return done(im, n)


def chart(n, col):
    im = canvas(n); d = ImageDraw.Draw(im); s = n * SS
    for i, h in enumerate([0.35, 0.6, 0.45, 0.8]):
        x = s * (0.16 + i * 0.18)
        d.rounded_rectangle((x, s * (0.85 - h), x + s * 0.13, s * 0.85), radius=s * 0.03, fill=col)
    return done(im, n)


def game(n, col):
    im = canvas(n); d = ImageDraw.Draw(im); s = n * SS
    d.rounded_rectangle((s * 0.1, s * 0.3, s * 0.9, s * 0.75), radius=s * 0.2, fill=col)
    d.rectangle((s * 0.25, s * 0.48, s * 0.43, s * 0.56), fill=DARK)
    d.rectangle((s * 0.3, s * 0.43, s * 0.38, s * 0.61), fill=DARK)
    d.ellipse((s * 0.62, s * 0.42, s * 0.71, s * 0.51), fill=DARK)
    d.ellipse((s * 0.68, s * 0.53, s * 0.77, s * 0.62), fill=DARK)
    return done(im, n)


def timer(n, col):
    im = canvas(n); d = ImageDraw.Draw(im); s = n * SS
    w = int(s * 0.09)
    d.ellipse((s * 0.16, s * 0.2, s * 0.84, s * 0.88), outline=col, width=w)
    d.rectangle((s * 0.43, s * 0.06, s * 0.57, s * 0.16), fill=col)
    d.line((s * 0.5, s * 0.54, s * 0.5, s * 0.34), fill=col, width=w)
    d.line((s * 0.5, s * 0.54, s * 0.64, s * 0.62), fill=col, width=w)
    return done(im, n)


def app_icon(n):
    # koyu zemin, turuncu ilerleme halkası, ortada yeşil-turuncu odak noktası
    im = Image.new('RGBA', (n * SS, n * SS), (0, 0, 0, 0)); d = ImageDraw.Draw(im); s = n * SS
    d.ellipse((0, 0, s - 1, s - 1), fill=(18, 22, 28, 255))
    w = int(s * 0.09)
    m = s * 0.13
    d.arc((m, m, s - m, s - m), start=0, end=360, fill=(60, 36, 20, 255), width=w)
    d.arc((m, m, s - m, s - m), start=-90, end=200, fill=ORANGE + (255,), width=w)
    c = s * 0.5; r = s * 0.13
    d.ellipse((c - r, c - r, c + r, c + r), fill=GREEN + (255,))
    return done(im, n)


def main():
    os.makedirs(ICONS, exist_ok=True)
    out = {
        'play': play(56, DARK), 'pause': pause(56, DARK),
        'skip': skip(40, WHITE), 'reset': reset(40, WHITE),
        'gear': gear(56, CYAN), 'chart': chart(56, GREEN), 'game': game(56, ORANGE), 'timer': timer(56, BLUE),
    }
    for name, img in out.items():
        img.save(os.path.join(ICONS, name + '.png'), optimize=True)
    # GT 6 iki uygulama simgesi ister: 104 ve 92 piksel
    app_icon(104).save(os.path.join(MEDIA, 'icon.png'), optimize=True)
    app_icon(92).save(os.path.join(MEDIA, 'icon_small.png'), optimize=True)
    print('simgeler:', ', '.join(sorted(out)), '+ icon.png, icon_small.png')


if __name__ == '__main__':
    main()
