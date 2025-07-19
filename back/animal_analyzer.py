import os
import base64
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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

    prompt = """
VIBE ANIMAL MATCH

What animal best represents this energy and style? Explain why!

Please respond in the following format:

[ANIMAL]
[Explanation of the vibe represented by the input]
[With simplified bullet points, Connection of the vibe and visual elements to the chosen animal. Elaborate on why this animal *feels right* for this aesthetic.]
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

