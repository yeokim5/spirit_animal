import os
import base64
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Define the available animals from the frontend dataset
AVAILABLE_ANIMALS = {
    # Mammals
    'leopard', 'lion', 'tiger', 'elephant', 'panda', 'bear', 'koala', 'gorilla', 'orangutan',
    'dog', 'poodle', 'wolf', 'fox', 'raccoon', 'cat', 'cow', 'ox', 'buffalo', 'pig', 'boar', 'goat',
    'sheep', 'ram', 'deer', 'horse', 'zebra', 'giraffe', 'camel', 'llama', 'hippopotamus', 'rhinoceros',
    'kangaroo', 'bat', 'mouse', 'rat', 'rabbit', 'chipmunk', 'hedgehog',
    
    # Birds
    'chick', 'rooster', 'chicken', 'turkey', 'duck', 'swan','eagle', 'dove', 'flamingo',
    'peacock', 'parrot', 'penguin',
    
    # Aquatic
    'fish', 'tropical_fish', 'blowfish', 'shark', 'whale', 'octopus', 'crab',
    'lobster', 'shrimp', 'squid',
    
    # Insects & others
    'snail', 'butterfly', 'bug', 'ant', 'honeybee', 'cricket', 'spider', 'scorpion', 'mosquito',
    
    # Reptiles & Amphibians
    'turtle', 'crocodile', 'lizard', 'snake', 'frog',
    
    # Mythical
    'dragon', 'unicorn',
    
    # Extinct
    'dinosaur'
}

def normalize_animal_name(animal_name):
    """
    Normalize animal name to match the dataset exactly.
    Returns the normalized name if found, otherwise returns None.
    """
    if not animal_name:
        return None
    
    # Convert to lowercase and remove extra whitespace
    normalized = animal_name.lower().strip()
    
    # Direct match
    if normalized in AVAILABLE_ANIMALS:
        return normalized
    
    # Handle common variations
    variations = {
        'tiger': ['tiger', 'tigers'],
        'lion': ['lion', 'lions'],
        'elephant': ['elephant', 'elephants'],
        'bear': ['bear', 'bears', 'grizzly', 'polar_bear'],
        'cat': ['cat', 'cats', 'kitten', 'kitty'],
        'dog': ['dog', 'dogs', 'puppy', 'pup'],
        'fox': ['fox', 'foxes'],
        'wolf': ['wolf', 'wolves'],
        'deer': ['deer', 'deers'],
        'horse': ['horse', 'horses', 'pony'],
        'bird': ['bird', 'birds'],
        'fish': ['fish', 'fishes'],
        'butterfly': ['butterfly', 'butterflies'],
        'dragon': ['dragon', 'dragons'],
        'unicorn': ['unicorn', 'unicorns'],
        'dinosaur': ['dinosaur', 'dinosaurs', 't-rex', 'trex']
    }
    
    for standard_name, variants in variations.items():
        if normalized in variants and standard_name in AVAILABLE_ANIMALS:
            return standard_name
    
    return None

def extract_and_validate_animal(response_text):
    """
    Extract animal name from response and validate it against the dataset.
    Returns (animal_name, is_valid, original_response)
    """
    if not response_text:
        return None, False, response_text
    
    # Try to extract animal name from the response
    lines = response_text.split('\n')
    animal_name = None
    
    for line in lines:
        line = line.strip()
        # Look for patterns like "**animal:** lion" or "animal: lion"
        if '**animal:**' in line.lower() or 'animal:' in line.lower():
            # Extract the animal name after the colon
            parts = line.split(':', 1)
            if len(parts) > 1:
                animal_name = parts[1].strip()
                # Remove any remaining markdown formatting
                animal_name = animal_name.replace('**', '').replace('*', '').strip()
                break
    
    # If no structured format found, try to extract from first line
    if not animal_name and lines:
        first_line = lines[0].strip()
        # Remove markdown formatting
        first_line = first_line.replace('**', '').replace('*', '').strip()
        animal_name = first_line
    
    # Normalize the animal name
    normalized_name = normalize_animal_name(animal_name)
    
    return normalized_name, normalized_name is not None, response_text

# --- CONFIGURATION ---
# 1. SET YOUR IMAGE FILE PATH HERE
IMAGE_PATH = "image/jang_no.jpg"
# ---------------------


def analyze_animal(image_path: str):
    """
    Analyzes an image to uncover its main vibe and match it with a fun spirit animal.
    """
    # --- 1. Load API Key from environment variable ---
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ Oops! OPENAI_API_KEY environment variable not set. Please set it in your .env file!")
        return

    # Initialize OpenAI client
    client = OpenAI(api_key=api_key)

    # --- 2. Check and Encode Image ---
    if not os.path.exists(image_path):
        print(f"❌ Whoops! Image file '{image_path}' is missing. Double-check your IMAGE_PATH setting.")
        return

    try:
        with open(image_path, "rb") as image_file:
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')
    except Exception as e:
        print(f"❌ Bummer! Had trouble reading that image: {e}. Is it a valid picture?")
        return

    # --- 3. Define the Prompt ---
    # This prompt is designed to be punchy, fun, and directly lead to an entertaining spirit animal match.

    # Format the available animals for the prompt
    available_animals_text = """
    leopard, lion, tiger, elephant, panda, bear, koala, gorilla, orangutan, dog, poodle, wolf, fox, raccoon, cat, cow, ox, buffalo, pig, boar, goat, sheep, ram, deer, horse, zebra, giraffe, camel, llama, hippopotamus, rhinoceros, kangaroo, bat, mouse, rat, rabbit, chipmunk, hedgehog,chick, rooster, chicken, turkey, duck, swan, eagle, dove, flamingo, peacock, parrot, penguin,fish, tropical_fish, blowfish, shark, whale, seal, octopus, crab, lobster, shrimp, squid,snail, butterfly, bug, ant, honeybee, cricket, spider, scorpion, mosquito,turtle, crocodile, lizard, snake, frog,dragon, unicorn,dinosaur
    """

    prompt = f"""
VIBE ANIMAL MATCH

What animal best represents this energy and style? You MUST choose from the following predefined animals only:

{available_animals_text}

Please respond in the following format:

**animal:** [ANIMAL_NAME_FROM_THE_LIST_ABOVE]
**Explanation:** [Explanation of the vibe represented by the input]
**Connection:** [With simplified bullet points, Connection of the vibe and visual elements to the chosen animal. Elaborate on why this animal *feels right* for this aesthetic.]

IMPORTANT: You must choose an animal name that exactly matches one from the list above. Do not use variations or similar names.
"""

    # --- 4. Call the OpenAI API ---
    print(f"✨ Matching the vibe for: {os.path.basename(image_path)}...")
    print("=" * 50)

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=300 # Reduced tokens for shorter, snappier responses
        )

        # --- 5. Print the Result ---
        analysis_result = response.choices[0].message.content
        print(analysis_result)

    except Exception as e:
        print(f"❌ Whoops! The vibe detector hit a snag: {e}")

