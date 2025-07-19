#!/usr/bin/env python3
"""
Script to check if the U2NET model is accessible
"""
import os
import sys

def check_model():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_dir = os.path.join(current_dir, 'model')
    model_file = os.path.join(model_dir, 'u2netp.onnx')
    
    print(f"Current directory: {current_dir}")
    print(f"Model directory: {model_dir}")
    print(f"Model file: {model_file}")
    
    if os.path.exists(model_dir):
        print("✅ Model directory exists")
    else:
        print("❌ Model directory does not exist")
        return False
    
    if os.path.exists(model_file):
        print("✅ Model file exists")
        file_size = os.path.getsize(model_file)
        print(f"   File size: {file_size:,} bytes ({file_size / (1024*1024):.1f} MB)")
    else:
        print("❌ Model file does not exist")
        return False
    
    # Check if we can set the environment variable
    os.environ['U2NET_HOME'] = model_dir
    print(f"✅ U2NET_HOME set to: {os.environ.get('U2NET_HOME')}")
    
    return True

if __name__ == "__main__":
    success = check_model()
    if success:
        print("\n🎉 Model check passed!")
        sys.exit(0)
    else:
        print("\n💥 Model check failed!")
        sys.exit(1) 