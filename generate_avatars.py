#!/usr/bin/env python3
"""
Generate 3D Glossy Avatar PNGs for A-Z
Uses numpy for correct gradient math.
Outputs optimized PNGs to:
  - frontend/public/avatars/
  - aqualyn-mobile/assets/images/avatars/
"""

import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SIZE = 256  # canvas size in pixels


# ── Palette (matches avatar.html) ──────────────────────────────────────────
C_SOFT   = np.array([109, 188, 225], dtype=np.float32)  # #6dbce1
C_LIGHT  = np.array([ 69, 159, 217], dtype=np.float32)  # #459fd9
C_MID    = np.array([ 41, 133, 204], dtype=np.float32)  # #2985cc
C_BASE   = np.array([  5,  87, 173], dtype=np.float32)  # #0557ad
C_DARK   = np.array([ 16,  69, 125], dtype=np.float32)  # #10457d
C_BG     = np.array([238, 247, 252], dtype=np.float32)  # #eef7fc (background/gloss)
C_WHITE  = np.array([255, 255, 255], dtype=np.float32)

GRAD_STOPS = [
    (0.00, C_SOFT),
    (0.25, C_LIGHT),
    (0.55, C_MID),
    (0.80, C_BASE),
    (1.00, C_DARK),
]


def sample_gradient(t_arr: np.ndarray) -> np.ndarray:
    """
    Vectorized multi-stop gradient sampler.
    t_arr: float32 array of shape (H, W), values 0-1
    Returns: uint8 array of shape (H, W, 3)
    """
    result = np.zeros((*t_arr.shape, 3), dtype=np.float32)
    for i in range(len(GRAD_STOPS) - 1):
        t0, c0 = GRAD_STOPS[i]
        t1, c1 = GRAD_STOPS[i + 1]
        mask = (t_arr >= t0) & (t_arr <= t1)
        if not np.any(mask):
            continue
        local_t = ((t_arr - t0) / (t1 - t0)).clip(0, 1)
        for ch in range(3):
            result[..., ch] = np.where(mask, result[..., ch] + local_t * (c1[ch] - c0[ch]) + c0[ch], result[..., ch])
    # Clamp and convert
    return result.clip(0, 255).astype(np.uint8)


def make_circle_mask(size: int, cx: int, cy: int, r: int, aa: int = 3) -> np.ndarray:
    """
    Anti-aliased circle mask. Returns float32 array 0-1 of shape (size, size).
    """
    scale = aa
    big = size * scale
    Y, X = np.ogrid[:big, :big]
    dist = np.sqrt((X - cx * scale) ** 2 + (Y - cy * scale) ** 2)
    mask_big = np.clip(r * scale - dist, 0, 1)
    # Downsample
    mask = mask_big.reshape(size, scale, size, scale).mean(axis=(1, 3))
    return mask.astype(np.float32)


def find_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    paths = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
        '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',
        '/usr/share/fonts/truetype/ubuntu/Ubuntu-B.ttf',
        '/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf',
        '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
    ]
    for p in paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def create_avatar(letter: str, size: int = SIZE) -> Image.Image:
    """
    Produces a 3D glossy ball avatar with `letter` centered on it.
    Transparent PNG background.
    """
    cx = size // 2
    cy = size // 2 - 10  # ball slightly lifted
    r  = int(size * 0.385)

    # ── Base canvas (RGBA, transparent) ───────────────────────────────────
    canvas = np.zeros((size, size, 4), dtype=np.float32)

    # ── 1. Ball gradient ────────────────────────────────────────────────
    # t = (x + y) / (size * 1.8)  — diagonal gradient from top-left (light) to bottom-right (dark)
    Y_idx, X_idx = np.mgrid[0:size, 0:size]
    t_grad = ((X_idx + Y_idx) / (size * 1.8)).astype(np.float32).clip(0, 1)
    grad_rgb = sample_gradient(t_grad).astype(np.float32)  # (H,W,3)

    ball_mask = make_circle_mask(size, cx, cy, r)  # (H,W) float 0-1

    # Composite ball onto canvas
    for ch in range(3):
        canvas[..., ch] += grad_rgb[..., ch] * ball_mask
    canvas[..., 3] += 255.0 * ball_mask

    # ── 2. Top gloss highlight ──────────────────────────────────────────
    # Soft white ellipse in the upper-left quarter of the ball
    gloss_cx = cx - int(r * 0.12)
    gloss_cy = cy - int(r * 0.38)
    gloss_rx = int(r * 0.70)
    gloss_ry = int(r * 0.42)

    Y_g, X_g = np.mgrid[0:size, 0:size]
    dist_gloss = np.sqrt(((X_g - gloss_cx) / gloss_rx) ** 2 + ((Y_g - gloss_cy) / gloss_ry) ** 2)
    # Smooth falloff: 1 at center, 0 at dist=1
    gloss_alpha = np.clip(1.0 - dist_gloss, 0, 1) ** 1.5 * 0.82  # max 82% opacity
    gloss_alpha *= ball_mask  # clip to ball area

    for ch in range(3):
        target = C_BG[ch]  # near-white gloss color
        canvas[..., ch] = canvas[..., ch] * (1 - gloss_alpha) + target * gloss_alpha

    # ── 3. Bottom inner rim glow ────────────────────────────────────────
    rim_cx = cx
    rim_cy = cy + int(r * 0.68)
    rim_rx = int(r * 0.65)
    rim_ry = int(r * 0.22)

    dist_rim = np.sqrt(((X_g - rim_cx) / max(rim_rx, 1)) ** 2 + ((Y_g - rim_cy) / max(rim_ry, 1)) ** 2)
    rim_alpha = np.clip(1.0 - dist_rim, 0, 1) ** 2 * 0.55
    rim_alpha *= ball_mask

    for ch in range(3):
        canvas[..., ch] = canvas[..., ch] * (1 - rim_alpha) + C_SOFT[ch] * rim_alpha

    # ── 4. Outer drop shadow ────────────────────────────────────────────
    # We'll do this AFTER converting to PIL by blurring a copy
    # For now just ensure alpha is clean
    canvas[..., 3] = np.clip(canvas[..., 3], 0, 255)
    canvas_rgb = canvas[..., :3].clip(0, 255).astype(np.uint8)
    canvas_a   = canvas[..., 3].clip(0, 255).astype(np.uint8)

    pil_img = Image.fromarray(
        np.dstack([canvas_rgb, canvas_a]), 'RGBA'
    )

    # ── 4b. Outer glow shadow via blur ──────────────────────────────────
    shadow = pil_img.filter(ImageFilter.GaussianBlur(radius=10))
    shadow_arr = np.array(shadow, dtype=np.float32)
    # Tint shadow blue and reduce opacity
    shadow_arr[..., 0] = 5
    shadow_arr[..., 1] = 60
    shadow_arr[..., 2] = 140
    shadow_arr[..., 3] = shadow_arr[..., 3] * 0.45
    shadow_img = Image.fromarray(shadow_arr.clip(0, 255).astype(np.uint8), 'RGBA')

    final = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    final = Image.alpha_composite(final, shadow_img)
    final = Image.alpha_composite(final, pil_img)

    # ── 5. Letter rendering ─────────────────────────────────────────────
    font_size = int(size * 0.46)
    font = find_font(font_size)

    draw = ImageDraw.Draw(final)

    # Measure
    bbox = font.getbbox(letter)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = cx - tw // 2 - bbox[0]
    ty = cy - th // 2 - bbox[1] - 6  # slightly above center to match ball lift

    # Shadow pass (dark blue, slightly offset + blurred)
    shadow_text_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    std = ImageDraw.Draw(shadow_text_img)
    std.text((tx + 3, ty + 5), letter, font=font, fill=(*tuple(C_DARK.astype(int)), 160))
    shadow_text_img = shadow_text_img.filter(ImageFilter.GaussianBlur(radius=2))
    final = Image.alpha_composite(final, shadow_text_img)

    # Main letter: solid bright white with very slight gradient from pure white top to #eef7fc bottom
    # We use a mask approach so we can apply the gradient
    letter_mask_img = Image.new('L', (size, size), 0)
    lm = ImageDraw.Draw(letter_mask_img)
    lm.text((tx, ty), letter, font=font, fill=255)

    letter_mask = np.array(letter_mask_img, dtype=np.float32) / 255.0

    final_arr = np.array(final, dtype=np.float32)

    # White → near-white gradient over letter pixels
    y_norm = (Y_g - ty) / max(th, 1)
    letter_r = C_WHITE[0] * (1 - y_norm * 0.08)  # barely changes — stays white
    letter_g = C_WHITE[1] * (1 - y_norm * 0.03)
    letter_b = C_WHITE[2]                          # pure white throughout

    for ch, lc in enumerate([letter_r, letter_g, letter_b]):
        target_c = np.clip(lc, 0, 255)
        final_arr[..., ch] = final_arr[..., ch] * (1 - letter_mask) + target_c * letter_mask

    # Where letter pixels are, make alpha = 255
    final_arr[..., 3] = np.clip(final_arr[..., 3] + letter_mask * 255, 0, 255)

    return Image.fromarray(final_arr.clip(0, 255).astype(np.uint8), 'RGBA')


def main():
    output_dirs = [
        '/home/harsh/Aqualyn/frontend/public/avatars',
        '/home/harsh/Aqualyn/aqualyn-mobile/assets/images/avatars',
    ]

    for d in output_dirs:
        os.makedirs(d, exist_ok=True)

    letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for letter in letters:
        print(f'  {letter}...', end=' ', flush=True)
        img = create_avatar(letter, SIZE)
        for d in output_dirs:
            img.save(os.path.join(d, f'avatar_{letter}.png'), 'PNG', optimize=True, compress_level=6)
        print('✓')

    print(f'\n✅ All {len(letters)} avatars saved to:')
    for d in output_dirs:
        print(f'   {d}')


if __name__ == '__main__':
    main()
