from PIL import Image
# from inky.mock import InkyMockImpression as Inky # Simulator
from inky_mod.inky_uc8159 import Inky  # Real display
import numpy as np
import sys

SATURATION = 0.5
UC8159_DRF = 0x12
UC8159_PON = 0x04
UC8159_POF = 0x02
UC8159_DTM1 = 0x10

DESATURATED_PALETTE = [
    [0, 0, 0],
    [255, 255, 255],
    [0, 255, 0],
    [0, 0, 255],
    [255, 0, 0],
    [255, 255, 0],
    [255, 140, 0],
    [255, 255, 255]
]

SATURATED_PALETTE = [
    [57, 48, 57],
    [255, 255, 255],
    [58, 91, 70],
    [61, 59, 94],
    [156, 72, 75],
    [208, 190, 71],
    [177, 106, 73],
    [255, 255, 255]
]


def palette_blend(saturation, dtype='uint8'):
    saturation = float(saturation)
    palette = []
    for i in range(7):
        rs, gs, bs = [c * saturation for c in SATURATED_PALETTE[i]]
        rd, gd, bd = [c * (1.0 - saturation) for c in DESATURATED_PALETTE[i]]
        palette.append((int(rs + rd), int(gs + gd), int(bs + bd)))
    palette.append((255, 255, 255))
    return palette


# palette = [
#     (50, 91, 85),
#     (246, 247, 243),
#     (106, 167, 91),
#     (83, 104, 138),
#     (183, 68, 56),
#     (226, 200, 60),
#     (196, 91, 6)
# ]

file = sys.argv[1]
saturation = sys.argv[2]

palette = palette_blend(saturation)
if 'mono' in sys.argv:
    palette = [
        [0, 0, 0],
        [255, 255, 255],
    ]
print('Palette', palette)
image = Image.open(file)
width, height = image.size

# pixels = list(image.getdata())
# pixels = [pixels[i * width:(i + 1) * width] for i in range(height)]
# pixels = np.array(pixels, shape=[width, height])
# print(image.getdata())

# for x in

# pixels = np.array(index)

inky = Inky()
# print(width, height)


def color_index(palette, color):
    # [r0, g1, b1] = color
    r1 = color[0]
    g1 = color[1]
    b1 = color[2]
    for i, rgba in enumerate(palette):
        # [r, g, b] = rgba
        r = rgba[0]
        g = rgba[1]
        b = rgba[2]
        if r == r1 and g == g1 and b == b1:
            return i
    return -1


index = []
# palette = palette_blend(0.5)
print(palette)
for x in range(width):
    for y in range(height):
        idx = color_index(palette, image.getpixel((x, y)))
        if idx == -1:
            idx = 1
        # index.append(idx)
        inky.set_pixel(x, y, idx)


box_size = 20
for i, p in enumerate(palette):
    for x in range(box_size):
        for y in range(box_size):
            inky.set_pixel(x + 5 + box_size * i, y +
                           height - 1 - 5 - box_size, i)

# print(dtype=numpy.uint8)
# inky.set_image_raw(pixels)
# print(inky.buf[5][2])


# pixel_set = set()
# for pixel in pixels:
# pixel_set.add(pixel[:3])
# print(palette_blend(0.5))


# region = inky.buf
# buf = region.flatten()
# buf = ((buf[::2] << 4) & 0xF0) | (buf[1::2] & 0x0F)
# buflist = buf.astype('uint8').tolist()

# inky.set_image(image, saturation=SATURATION)
# inky.setup()
inky.show()
# inky.wait_for_window_close()

# # inky._send_command(UC8159_DTM1, buflist)
# # inky._busy_wait()

# inky._send_command(UC8159_PON)
# inky._busy_wait()

# inky._send_command(UC8159_DRF)
# inky._busy_wait()

# inky._send_command(UC8159_POF)
# inky._busy_wait()
