import sys
from PIL import Image

def crop_transparent(input_path, output_path):
    try:
        img = Image.open(input_path).convert("RGBA")
        # getbbox() finds the bounding box of non-zero alpha in the image
        bbox = img.getbbox()
        if bbox:
            # Crop the image to the bounding box
            cropped_img = img.crop(bbox)
            cropped_img.save(output_path, "PNG")
            print(f"Successfully cropped {input_path} to {output_path}")
        else:
            print("Image is entirely transparent.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python crop_logo.py <input> <output>")
        sys.exit(1)
    
    crop_transparent(sys.argv[1], sys.argv[2])
