

from PIL import Image, ImageOps
# from inky.mock import InkyMockImpression as Inky  # Simulator

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


def load_icon(icon):
    return Image.open(icon).convert("RGBA")


width = 600
height = 448
saturation = 0.5

palette = palette_blend(saturation)
# palette_image = Image.new("P", (1, 1))
# palette_image.putpalette(palette + [0, 0, 0] * 248)


print(palette)

# image = Image.open('viewer/53000004.png')
# size = (width, height)
# image = ImageOps.fit(image, size, Image.ANTIALIAS)

# image.load()
# result = image.im.convert("P", True, palette_image.im)
# print(result.save)

# image.save('test.png')
# palette = palette_blend(0.5)
# print(palette)

# Load all .png files from current directory
# icons = [load_icon(icon) for icon in glob.glob("*.png")]


# inky = Inky()
# print(inky.WIDTH, inky.HEIGHT)

# image = Image.new("RGB", (inky.WIDTH, inky.HEIGHT), (255, 255, 255))

# inky.set_image(image, saturation=SATURATION)
# inky.show()
# inky.wait_for_window_close()
