from background_remover import remove_background
from animal_analyzer import analyze_animal

input_image_path = 'image/suit.png'
output_image_path = 'image/suit_no.png'

remove_background(input_image_path, output_image_path)

analyze_animal(output_image_path)
