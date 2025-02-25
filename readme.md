Smart Compost Manure System

🌿 Project Overview

The Smart Compost Manure System is an automated, AI-powered solution designed to optimize the composting process while reducing environmental impact. By leveraging IoT, AI, sensors, and real-time data analytics, the system ensures efficient decomposition of organic waste, captures methane gas, and promotes sustainable waste management practices.

✨ Key Features

🌡️ Automated Monitoring

Sensors: Continuously measure temperature, humidity, and methane levels inside the compost container.

Real-time Analysis: Ensures optimal conditions for decomposition.

🤖 AI Integration

Condition Analysis: AI models analyze sensor data to maintain ideal composting conditions.

Decomposition Prediction: Machine learning predicts the number of days required for complete decomposition.

Smart Recommendations: AI suggests when to add water, open vents, or capture methane.

⚡ Automated Control System

Aeration: Automatically adjusts airflow using a fan to maintain aerobic conditions, reducing methane production.

Moisture Control: Activates the water pump when the compost is too dry, enhancing microbial activity.

Temperature Regulation: Maintains optimal temperature through automated heating or cooling mechanisms.

🔄 Dual Mode Operation

Automatic Mode: System autonomously controls all components based on AI predictions and sensor data.

Manual Mode: Users can manually toggle the fan and water pump through the app interface.

🔥 Methane Capture & Sustainable Use

Methane Detection: Gas sensors in a connected methane container detect and analyze methane levels.

Biogas Storage: Captured methane is stored for sustainable use, such as cooking, heating, or electricity generation.

📱 Mobile App for Monitoring & Control

Real-time Data: Users can monitor temperature, humidity, methane levels, and decomposition progress.

Notifications: Alerts for high methane levels, compost readiness, and maintenance reminders.

Control Panel: Toggle fan and pump operations in manual mode directly from the app.

🌎 Sustainability Impact

Reduces methane emissions and optimizes composting conditions.

Produces nutrient-rich compost for agricultural and gardening use.

Promotes responsible organic waste management.

🛠️ System Architecture & Technologies

🔗 Backend (Node.js & MongoDB)

Node.js & Express.js: Handles real-time communication and RESTful APIs.

MongoDB: Stores sensor data, user interactions, and composting statistics.

WebSocket: Enables real-time data updates between ESP32 and the mobile app.

🌐 IoT Integration (ESP32 & Sensors)

ESP32: Controls fan and water pump based on sensor readings.

Sensors: Temperature, humidity, and gas sensors for environmental monitoring.

Communication: WebSocket used for real-time data transmission to the backend.

📱 Frontend (Mobile App)

Features: Real-time monitoring, manual control of pump/fan, and alerts.

Technologies: Built using cross-platform technologies for accessibility.

🚀 Installation & Setup

🔄 Clone the Repository

git clone https://github.com/suyog46/Smart_compost_manure_system
cd smart-compost-manure

🖧 Backend Setup

cd backend
npm install

Create a .env file in /backend/env/:

PORT=3000
MONGO_URI=your_mongodb_uri

Start the server:

npm run dev

🌐 ESP32 & IoT Setup

Connect ESP32 to the PC.

Upload firmware code using Arduino IDE.

Verify real-time data transfer using WebSocket connections.

📱 Mobile App Setup

Navigate to /mobile-app/.

Install dependencies:

npm install

Run the app:

npm expo start

⚙️ Technologies Used

IoT: ESP32, Temperature & Humidity Sensors, Gas Sensor

Backend: Node.js, Express.js, MongoDB, WebSocket

Frontend: Cross-platform Mobile Framework

AI: Machine Learning for decomposition prediction

🚀 Usage Guide

Power on the compost system and ESP32 module.

Launch the mobile app and monitor live sensor data.

Select either Automatic or Manual mode.

In manual mode, control the fan and water pump as needed.

Utilize captured methane for sustainable energy purposes.

💡 Contributing

Fork the repository.

Create your feature branch:

git checkout -b feature-name

Commit your changes:

git commit -m 'Add feature description'

Push to the branch:

git push origin feature-name

Open a pull request.

📜 License

Distributed under the MIT License. See LICENSE for more details.

📞 Contact

Developer: Suyog Lamsal

Email: lmssuyog@gmail.com

Project: Smart Compost Manure System