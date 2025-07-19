from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import stripe
from background_remover import remove_background
from animal_analyzer import analyze_animal

# Load environment variables
load_dotenv()

# Configure Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Aesthetic Matcher API is running'
    })

@app.route('/create-payment-intent', methods=['POST'])
def create_payment_intent():
    """Create a Stripe payment intent for 50 cents"""
    try:
        data = request.get_json()
        
        # Create a PaymentIntent with the order amount and currency
        intent = stripe.PaymentIntent.create(
            amount=50,  # 50 cents in cents
            currency='usd',
            automatic_payment_methods={
                'enabled': True,
            },
            metadata={
                'product_id': data.get('product_id', os.getenv('STRIPE_CREDIT_PRODUCT_ID')),
                'service': 'image_analysis'
            }
        )
        
        return jsonify({
            'clientSecret': intent.client_secret
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Payment intent creation failed',
            'message': str(e)
        }), 500

@app.route('/predict', methods=['POST'])
def predict():
    """
    Main prediction endpoint that:
    1. Accepts an image upload
    2. Removes background
    3. Analyzes the image for animal matching
    4. Returns the result
    """
    try:
        # Check if image file is present
        if 'image' not in request.files:
            return jsonify({
                'error': 'No image file provided',
                'message': 'Please upload an image file'
            }), 400
        
        file = request.files['image']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                'error': 'No file selected',
                'message': 'Please select an image file'
            }), 400
        
        # Check if file type is allowed
        if not allowed_file(file.filename):
            return jsonify({
                'error': 'Invalid file type',
                'message': f'Allowed file types: {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400
        
        # Save uploaded file to temporary location
        filename = secure_filename(file.filename)
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as temp_input:
            file.save(temp_input.name)
            input_path = temp_input.name
        
        # Create temporary output path for background-removed image
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_output:
            output_path = temp_output.name
        
        # Step 1: Remove background
        try:
            remove_background(input_path, output_path)
        except Exception as e:
            return jsonify({
                'error': 'Background removal failed',
                'message': str(e)
            }), 500
        
        # Step 2: Analyze animal
        try:
            # We need to modify analyze_animal to return the result instead of printing
            result = analyze_animal_api(output_path)
        except Exception as e:
            return jsonify({
                'error': 'Animal analysis failed',
                'message': str(e)
            }), 500
        
        # Clean up temporary files
        try:
            if os.path.exists(input_path):
                os.remove(input_path)
            if os.path.exists(output_path):
                os.remove(output_path)
        except Exception as e:
            print(f"Warning: Could not clean up temporary files: {e}")
            pass  # Don't fail if cleanup fails
        
        return jsonify({
            'success': True,
            'result': result,
            'message': 'Analysis completed successfully'
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@app.route('/predict_path', methods=['POST'])
def predict_path():
    """
    Alternative endpoint that accepts an image path instead of file upload
    """
    try:
        data = request.get_json()
        
        if not data or 'image_path' not in data:
            return jsonify({
                'error': 'No image path provided',
                'message': 'Please provide image_path in JSON body'
            }), 400
        
        input_path = data['image_path']
        
        # Check if file exists
        if not os.path.exists(input_path):
            return jsonify({
                'error': 'File not found',
                'message': f'Image file not found at: {input_path}'
            }), 404
        
        # Create temporary output path
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_output:
            output_path = temp_output.name
        
        # Step 1: Remove background
        try:
            remove_background(input_path, output_path)
        except Exception as e:
            return jsonify({
                'error': 'Background removal failed',
                'message': str(e)
            }), 500
        
        # Step 2: Analyze animal
        try:
            result = analyze_animal_api(output_path)
        except Exception as e:
            return jsonify({
                'error': 'Animal analysis failed',
                'message': str(e)
            }), 500
        
        # Clean up temporary file
        try:
            if os.path.exists(output_path):
                os.remove(output_path)
        except Exception as e:
            print(f"Warning: Could not clean up temporary file: {e}")
            pass
        
        return jsonify({
            'success': True,
            'result': result,
            'message': 'Analysis completed successfully'
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

def analyze_animal_api(image_path: str):
    """
    Modified version of analyze_animal that returns the result instead of printing
    """
    import base64
    from openai import OpenAI
    
    # Load API Key from environment variable
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return "Error: OPENAI_API_KEY environment variable not set"
    
    # Initialize OpenAI client
    client = OpenAI(api_key=api_key)
    
    # Check and encode image
    if not os.path.exists(image_path):
        return "Error: Image file not found"
    
    try:
        with open(image_path, "rb") as image_file:
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')
    except Exception as e:
        return f"Error reading image: {e}"
    
    # Define the prompt
    prompt = """
VIBE ANIMAL MATCH

What animal best represents this energy and style? Explain why!

Please respond in the following format:

[ANIMAL]
[Explanation of the vibe represented by the input]
[With simplified bullet points, Connection of the vibe and visual elements to the chosen animal. Elaborate on why this animal *feels right* for this aesthetic.]
"""
    
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
            max_tokens=300
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        return f"Error calling OpenAI API: {e}"

if __name__ == '__main__':
    print("Starting Aesthetic Matcher API Server...")
    print("Available endpoints:")
    print("- GET  /health - Health check")
    print("- POST /predict - Upload image for analysis")
    print("- POST /predict_path - Analyze image by path")
    
    # Get port from environment variable (for Railway) or default to 5000
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False) 