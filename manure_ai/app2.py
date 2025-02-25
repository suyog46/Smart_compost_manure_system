import pickle
import pandas as pd
from flask import Flask, request, jsonify
from sklearn.preprocessing import StandardScaler, OneHotEncoder

# Initialize Flask app
app = Flask(__name__)

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
        # Get JSON data from request
        data = request.get_json()

        material_type = "Food Waste"
        temperature = float(data.get('Temperature (°C)'))  # Convert to float
        humidity = float(data.get('Humidity (%)'))  # Convert to float

        # Ensure all required inputs exist
        if material_type is None or temperature is None or humidity is None:
            return jsonify({"error": "Missing required input fields"}), 400

        # Create DataFrame
        real_time_data = pd.DataFrame({
            'Material Type': [material_type],
            'Temperature (°C)': [temperature],
            'Humidity (%)': [humidity]
        })

        # One-hot encode Material Type
        encoded_material = encoder.fit_transform(real_time_data[['Material Type']])
        encoded_material_df = pd.DataFrame(encoded_material, columns=encoder.get_feature_names_out(['Material Type']))

        # Scale Temperature & Humidity
        scaled_temp_humidity = scaler.transform(real_time_data[['Temperature (°C)', 'Humidity (%)']])
    

        # Combine encoded data
        final_input_data = pd.DataFrame(scaled_temp_humidity, columns=['Temperature (°C)', 'Humidity (%)'])
        final_input_data = pd.concat([final_input_data, encoded_material_df], axis=1)

        # Ensure correct column order
        train_columns = train_cols # Columns of the training data

        missing_cols = set(train_columns) - set(final_input_data.columns)

        # Add missing columns with default value 0 (to ensure the prediction matches training data columns)
        for col in missing_cols:
            final_input_data[col] = 0

        # Predict
        final_input_data = final_input_data[train_columns]
        prediction = rf_model.predict(final_input_data)

        # Return response
        return jsonify({"predicted_days": round(prediction[0] , 2)})

# Run Flask app
if __name__ == '__main__':
    app.run(debug=True)
