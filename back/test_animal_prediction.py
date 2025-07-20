#!/usr/bin/env python3
"""
Test script for animal prediction system
Tests the animal validation and normalization functions
"""

from animal_analyzer import normalize_animal_name, extract_and_validate_animal, AVAILABLE_ANIMALS

def test_animal_validation():
    """Test the animal validation system"""
    print("Testing Animal Validation System")
    print("=" * 50)
    
    # Test cases for normalization
    test_cases = [
        ("lion", "lion"),
        ("LION", "lion"),
        (" Lion ", "lion"),
        ("tigers", "tiger"),
        ("cats", "cat"),
        ("kitten", "cat"),
        ("puppy", "dog"),
        ("dragon", "dragon"),
        ("unicorn", "unicorn"),
        ("dinosaur", "dinosaur"),
        ("t-rex", "dinosaur"),
        ("butterfly", "butterfly"),
        ("invalid_animal", None),
        ("", None),
        (None, None),
    ]
    
    print("Testing animal name normalization:")
    for input_name, expected in test_cases:
        result = normalize_animal_name(input_name)
        status = "✅" if result == expected else "❌"
        print(f"{status} '{input_name}' -> '{result}' (expected: '{expected}')")
    
    print("\n" + "=" * 50)
    
    # Test cases for response extraction and validation
    test_responses = [
        ("**animal:** lion\n**Explanation:** This represents...", "lion", True),
        ("**animal:** cat\n**Explanation:** The vibe is...", "cat", True),
        ("animal: tiger\nExplanation: This shows...", "tiger", True),
        ("**animal:** invalid_animal\n**Explanation:** ...", None, False),
        ("lion\nThis represents...", "lion", True),
        ("Some random text without animal", None, False),
        ("", None, False),
    ]
    
    print("Testing response extraction and validation:")
    for response, expected_animal, expected_valid in test_responses:
        animal_name, is_valid, _ = extract_and_validate_animal(response)
        status = "✅" if animal_name == expected_animal and is_valid == expected_valid else "❌"
        print(f"{status} Response: '{response[:30]}...' -> Animal: '{animal_name}', Valid: {is_valid}")
    
    print("\n" + "=" * 50)
    print(f"Total available animals in dataset: {len(AVAILABLE_ANIMALS)}")
    print("Available animals:", sorted(list(AVAILABLE_ANIMALS)))

if __name__ == "__main__":
    test_animal_validation() 