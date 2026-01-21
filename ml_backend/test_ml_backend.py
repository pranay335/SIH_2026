#!/usr/bin/env python3
"""
ML Backend Test Script
Tests the model loading and prediction endpoint
"""

import requests
import json
from pathlib import Path

# Test Configuration
BASE_URL = "http://localhost:8000"
HEALTH_CHECK_URL = f"{BASE_URL}/"

def test_health_check():
    """Test if server is running"""
    print("\n" + "="*60)
    print("TEST 1: Health Check")
    print("="*60)
    try:
        response = requests.get(HEALTH_CHECK_URL, timeout=5)
        print(f"Status Code: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if data.get("status") == "ok":
            print("✓ Server is running")
            return True
        else:
            print("✗ Server responded but status not OK")
            return False
    except requests.ConnectionError:
        print("✗ Connection refused - Server not running")
        print("  Start server with: python app.py")
        return False
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False

def test_prediction():
    """Test prediction endpoint"""
    print("\n" + "="*60)
    print("TEST 2: Prediction Endpoint")
    print("="*60)
    
    # Find test image
    test_images = [
        Path("test_image.jpg"),
        Path("test.jpg"),
        Path("sample.jpg"),
    ]
    
    image_file = None
    for path in test_images:
        if path.exists():
            image_file = path
            break
    
    if not image_file:
        print("⚠ No test image found")
        print("  Place a test image as 'test_image.jpg' in the ML_models folder")
        return False
    
    try:
        with open(image_file, 'rb') as f:
            files = {
                'image': ('test_image.jpg', f, 'image/jpeg'),
            }
            data = {
                'description': 'There is a broken streetlight on Main Street causing darkness in the area'
            }
            
            print(f"Sending request to {BASE_URL}/predict")
            print(f"Description: {data['description']}")
            print(f"Image: {image_file.name}")
            
            response = requests.post(
                f"{BASE_URL}/predict",
                files=files,
                data=data,
                timeout=60
            )
            
            print(f"\nStatus Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"\nResponse:")
                print(json.dumps(result, indent=2))
                print("\n✓ Prediction successful!")
                return True
            else:
                print(f"Error Response: {response.text}")
                print("\n✗ Prediction failed")
                return False
                
    except FileNotFoundError:
        print(f"✗ Test image not found: {image_file}")
        return False
    except requests.exceptions.Timeout:
        print("✗ Request timed out - Models may be taking too long to load")
        return False
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("ML BACKEND TEST SUITE")
    print("="*60)
    
    results = []
    
    # Test 1: Health check
    health_ok = test_health_check()
    results.append(("Health Check", health_ok))
    
    if not health_ok:
        print("\n" + "="*60)
        print("TESTS STOPPED - Server not responding")
        print("="*60)
        return
    
    # Test 2: Prediction
    prediction_ok = test_prediction()
    results.append(("Prediction", prediction_ok))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{name}: {status}")
    
    all_passed = all(result[1] for result in results)
    print("="*60)
    if all_passed:
        print("✓ ALL TESTS PASSED")
    else:
        print("✗ SOME TESTS FAILED")
    print("="*60 + "\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user")
    except Exception as e:
        print(f"\n\nUnexpected error: {str(e)}")
