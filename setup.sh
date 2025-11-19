#!/bin/bash
echo "Running setup for Mario Shooter Capacitor-ready project..."
echo "This will install npm packages and initialize Capacitor. Make sure Node.js and Android Studio are installed."
npm install
npx cap init com.yourcompany.marioshooter "Mario Shooter" --web-dir=www || true
npx cap add android || true
npx cap copy android || true
npx cap open android || true
echo "If Android Studio didn't open, launch it and open the 'android' folder inside this project."
