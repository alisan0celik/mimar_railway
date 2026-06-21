from PIL import Image
import numpy as np

img = Image.open('onboard.png')
# Crop logo region
logo_crop = img.crop((59, 158, 160, 249))
data = np.array(logo_crop)
h, w, _ = data.shape

# Let's find what the pixel values look like.
# Let's print pixel rows that contain logo lines and background.
# Row y = 30 in the logo crop is around y = 188 in original.
print("Luminance of logo crop row y=30:")
for x in range(w):
    r, g, b, a = data[30, x]
    lum = 0.299*r + 0.587*g + 0.114*b
    # Print if it's bright or every 5 pixels
    if lum > 60:
        print(f"x={x:03d}: RGB=[{r},{g},{b}] Lum={lum:.1f} (Bright)")
    elif x % 10 == 0:
        print(f"x={x:03d}: RGB=[{r},{g},{b}] Lum={lum:.1f}")
