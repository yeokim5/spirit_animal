import os
import tempfile
import rembg
from PIL import Image

# Set U2NET_HOME to the model directory relative to this file
current_dir = os.path.dirname(os.path.abspath(__file__))
model_dir = os.path.join(current_dir, 'model')
os.environ['U2NET_HOME'] = model_dir

def remove_background(input_image_path, output_image_path):
    input_image = Image.open(input_image_path)
    session = rembg.new_session(model_name='u2netp')
    output_image = rembg.remove(input_image, session=session)
    
    # Check if the output image has transparency (RGBA)
    if output_image.mode == 'RGBA':
        # Convert to RGB by compositing with white background
        rgb_image = Image.new('RGB', output_image.size, (255, 255, 255))
        rgb_image.paste(output_image, mask=output_image.split()[-1])  # Use alpha channel as mask
        rgb_image.save(output_image_path, 'JPEG', quality=95)
    else:
        # If it's already RGB, save directly
        output_image.save(output_image_path, 'JPEG', quality=95)
