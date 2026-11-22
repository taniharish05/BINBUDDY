
from flask import Flask, render_template, request, jsonify
from tensorflow.keras.applications.mobilenet_v2 import (
    MobileNetV2,
    preprocess_input,
    decode_predictions
)
from PIL import Image, UnidentifiedImageError
import numpy as np
import io


app = Flask(__name__)


# ==========================================
# LOAD AI MODEL
# ==========================================

print("Loading AI model...")

model = MobileNetV2(weights="imagenet")

print("AI model loaded successfully!")


# ==========================================
# WASTE CATEGORY FUNCTION
# ==========================================

def get_waste_category(item):

    item = item.lower().replace("_", " ")

    # WET / ORGANIC WASTE
    wet_items = [
        "banana", "apple", "orange", "lemon",
        "broccoli", "cauliflower", "cucumber",
        "strawberry", "pineapple", "pomegranate",
        "mushroom", "potato", "corn", "pizza",
        "food", "guacamole", "fig", "jackfruit"
    ]

    # DRY / RECYCLABLE WASTE
    dry_items = [
        "bottle", "plastic", "paper", "cardboard",
        "carton", "can", "tin", "glass", "jar",
        "newspaper", "book", "envelope", "packet"
    ]

    # HAZARDOUS WASTE
    hazardous_items = [
        "battery", "chemical", "pesticide",
        "paint", "cleaner", "medicine",
        "syringe", "insecticide"
    ]

    # E-WASTE
    e_waste_items = [
        "cellular telephone", "cellphone",
        "mobile phone", "laptop", "computer",
        "keyboard", "mouse", "monitor",
        "television", "remote control"
    ]

    if any(word in item for word in wet_items):
        return {
            "category": "Wet / Organic Waste",
            "bin": "Green Bin / Compost",
            "icon": "🟢"
        }

    elif any(word in item for word in dry_items):
        return {
            "category": "Dry / Recyclable Waste",
            "bin": "Dry Waste / Recycling Bin",
            "icon": "🔵"
        }

    elif any(word in item for word in hazardous_items):
        return {
            "category": "Hazardous Waste",
            "bin": "Special Hazardous Waste Collection",
            "icon": "🔴"
        }

    elif any(word in item for word in e_waste_items):
        return {
            "category": "E-Waste",
            "bin": "Authorised E-Waste Collection Centre",
            "icon": "🟣"
        }

    else:
        return {
            "category": "Other / General Waste",
            "bin": "Check local waste disposal guidelines",
            "icon": "⚪"
        }


# ==========================================
# HOME PAGES
# ==========================================

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/login")
def login():
    return render_template("login.html")


@app.route("/signup")
def signup():
    return render_template("signup.html")


@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")


# ==========================================
# AI WASTE SCANNER API
# ==========================================

@app.route("/predict", methods=["POST"])
def predict():

    # Check image upload
    if "image" not in request.files:
        return jsonify({
            "error": "No image uploaded"
        }), 400

    file = request.files["image"]

    if file.filename == "":
        return jsonify({
            "error": "Please select an image"
        }), 400

    try:

        # Read uploaded image
        img = Image.open(
            io.BytesIO(file.read())
        ).convert("RGB")

        # Resize image
        img = img.resize((224, 224))

        # Convert image into array
        img_array = np.array(img)

        # Add batch dimension
        img_array = np.expand_dims(
            img_array, axis=0
        )

        # Preprocess image
        img_array = preprocess_input(img_array)

        # Predict image
        predictions = model.predict(
            img_array,
            verbose=0
        )

        # Get top 5 predictions
        decoded = decode_predictions(
            predictions,
            top=5
        )[0]

        # Display predictions in terminal
        print("\n========== AI PREDICTIONS ==========")

        for result in decoded:
            print(
                result[1],
                round(float(result[2]) * 100, 2),
                "%"
            )

        print("====================================\n")

        # Get highest prediction
        predicted_item = decoded[0][1]

        confidence = float(
            decoded[0][2] * 100
        )

        # Check confidence
        CONFIDENCE_THRESHOLD = 20

        if confidence < CONFIDENCE_THRESHOLD:

            return jsonify({
                "item": "Unknown Item",
                "confidence": round(confidence, 2),
                "category": "Unable to Classify",
                "bin": "Please upload a clearer image",
                "icon": "⚠️",
                "message": "The AI could not identify this item confidently. Please try another image."
            })

        # Get waste category
        waste_info = get_waste_category(
            predicted_item
        )

        # Return result
        return jsonify({
            "item": predicted_item.replace(
                "_", " "
            ).title(),

            "confidence": round(
                confidence, 2
            ),

            "category": waste_info["category"],

            "bin": waste_info["bin"],

            "icon": waste_info["icon"]
        })

    except (UnidentifiedImageError, OSError):

        return jsonify({
            "error": "Invalid image. Please upload a valid image."
        }), 400

    except Exception as error:

        print("Scanner Error:", error)

        return jsonify({
            "error": "Something went wrong while scanning the image."
        }), 500


# ==========================================
# RUN APPLICATION
# ==========================================

if __name__ == "__main__":

    app.run(debug=True)
