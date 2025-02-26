import pickle
import pandas as pd
from flask import Flask, request, jsonify
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Allow all origins

# Load model and preprocessing objects
with open('model10000.pkl', 'rb') as model_file:
    rf_model = pickle.load(model_file)

with open('scaler.pkl', 'rb') as scaler_file:
    scaler = pickle.load(scaler_file)  # Load trained StandardScaler

with open('encoder.pkl', 'rb') as encoder_file:
    encoder = pickle.load(encoder_file)  # Load trained OneHotEncoder

with open('train_columns.pkl', 'rb') as train_column_file:
    train_cols = pickle.load(train_column_file)  # Load training column names

# Define prediction endpoint
@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get JSON data from request
        data = request.get_json()

        # Validate input data
        if not data or 'Temperature (°C)' not in data or 'Humidity (%)' not in data:
            return jsonify({"error": "Missing required input fields: 'Temperature (°C)' and 'Humidity (%)'"}), 400

        # Extract and validate inputs
        material_type = "Food Waste"  # Default material type
        temperature = float(data.get('Temperature (°C)'))  # Convert to float
        humidity = float(data.get('Humidity (%)'))  # Convert to float

        # Create DataFrame
        real_time_data = pd.DataFrame({
            'Material Type': [material_type],
            'Temperature (°C)': [temperature],
            'Humidity (%)': [humidity]
        })

        # One-hot encode Material Type (use transform, not fit_transform, since encoder is already trained)
        encoded_material = encoder.transform(real_time_data[['Material Type']])
        encoded_material_df = pd.DataFrame(encoded_material, columns=encoder.get_feature_names_out(['Material Type']))

        # Scale Temperature & Humidity
        scaled_temp_humidity = scaler.transform(real_time_data[['Temperature (°C)', 'Humidity (%)']])

        # Combine encoded data
        final_input_data = pd.DataFrame(scaled_temp_humidity, columns=['Temperature (°C)', 'Humidity (%)'])
        final_input_data = pd.concat([final_input_data, encoded_material_df], axis=1)

        # Ensure correct column order
        missing_cols = set(train_cols) - set(final_input_data.columns)

        # Add missing columns with default value 0 (to ensure the prediction matches training data columns)
        for col in missing_cols:
            final_input_data[col] = 0

        # Reorder columns to match training data
        final_input_data = final_input_data[train_cols]

        # Predict
        prediction = rf_model.predict(final_input_data)

        # Return response
        return jsonify({"predicted_days": round(prediction[0], 2)})

    except Exception as e:
        # Handle any unexpected errors
        return jsonify({"error": str(e)}), 500

# Run Flask app
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)  # Bind to all IPs on the device