# Builds art/samu/anim/run-built.png from run.jpg (Riga's 4-frame strip, 15 nov).
# Frames 1, 2 and 4 of run.jpg are the same stride, so the cycle is:
# stride, airborne, stride with the trouser tones swapped, airborne swapped.
# Swapping the near (light beige) and far (brown) leg tones makes the eye read
# the other leg as the forward one. Run from art/samu/anim.
import numpy as np
from PIL import Image
LEGS_TOP = 135   # source row where the trousers start
THRESHOLD = 150  # luminance between the brown and the light beige leg
a = np.asarray(Image.open('run.jpg').convert('RGB'), dtype=float)
H = a.shape[0]
stride, airborne = a[:, 50:262].copy(), a[:, 554:778].copy()

def box_mean(mask, r):
    """Share of True pixels in the (2r+1)² square around each pixel."""
    p = np.pad(mask.astype(float), r)
    c = p.cumsum(0).cumsum(1)
    c = np.pad(c, ((1, 0), (1, 0)))
    k = 2 * r + 1
    return (c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]) / (k * k)

def swap_legs(f):
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    trousers = (r > g) & (g > b) & (r - b > 25) & ~((r - g > 70) & (b - g > 70))
    trousers[:LEGS_TOP] = False
    lum = (r + g + b) / 3
    dark_raw = trousers & (lum < THRESHOLD)
    # Each pixel follows its neighbourhood: no stray light dots on the dark leg.
    dark_share = box_mean(dark_raw, 3) / np.maximum(box_mean(trousers, 3), 1e-6)
    dark = trousers & (dark_share > 0.5)
    light = trousers & ~dark
    md, ml = np.median(f[dark_raw], axis=0), np.median(f[trousers & ~dark_raw], axis=0)
    out = f.copy()
    out[dark] = np.clip(f[dark] * (ml / md), 0, 255)
    out[light] = np.clip(f[light] * (md / ml), 0, 255)
    return out

gap = np.zeros((H, 60, 3)); gap[..., 0] = 255; gap[..., 2] = 255
frames = [stride, airborne, swap_legs(stride), swap_legs(airborne)]
strip = np.concatenate([frames[0], gap, frames[1], gap, frames[2], gap, frames[3]], axis=1)
Image.fromarray(strip.astype(np.uint8)).save('run-built.png')
