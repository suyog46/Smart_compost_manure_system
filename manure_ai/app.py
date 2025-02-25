from flask import Flask, request, jsonify
import numpy as np
import pickle
from sklearn.preprocessing import StandardScaler

# Initialize the Flask application
app = Flask(__name__)

# Load the trained model and scaler
with open('model.pkl', 'rb') as model_file:
    model = pickle.load(model_file)

# Route for predicting compost readiness time
@app.route('/predict', methods=['POST'])
def predict():
    # Get JSON data from the POST request
    data = request.get_json()

    # Extract temperature and moisture values
    temperature = data.get('temperature')
    moisture = data.get('moisture')

    if temperature is None or moisture is None:
        return jsonify({"error": "Please provide both 'temperature' and 'moisture' values"}), 400

    # Preprocess (scale) the input data
    real_time_data = np.array([[temperature, moisture]])
    scaler = StandardScaler()
    real_time_data_scaled = scaler.fit_transform(real_time_data)  # Use the same scaler from training

    # Predict the compost readiness time
    predicted_days = model.predict(real_time_data_scaled)

    # Return the result
    return jsonify({
        "predicted_days": round(predicted_days[0] , 2)
    })

if __name__ == '__main__':
    app.run(debug=True)
