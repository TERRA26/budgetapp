# BudgetEase

BudgetEase is a mobile budgeting application powered by AI that helps users manage their finances through smart financial planning and tracking.

## Features

- AI-Powered Financial Insights
- Smart Budget Tracking and Categorization
- Predictive Analytics for Expenses
- Bank Account Integration
- Customizable Savings Goals
- Real-time Transaction Monitoring
- Monthly and Weekly Budget Planning

## Prerequisites

- Node.js (latest stable version)
- React Native development environment
- Expo CLI
- Appwrite backend setup

## Setup Instructions

1. Clone the repository:
git clone https://github.com/TERRA26/budgetapp.git
cd budgetapp

Install dependencies:
npm install
Configure Appwrite:
Create a .env file in the root directory and add the following environment variables:
env
# Appwrite Configuration
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=67219ba6000047dbdc43

# Database Configuration
APPWRITE_DATABASE_ID=budgetease

# Collection IDs
APPWRITE_TRANSACTIONS_COLLECTION=transactions
APPWRITE_BUDGETS_COLLECTION=budgets
APPWRITE_USERS_COLLECTION=users
APPWRITE_PROFILES_COLLECTION=profiles
Note: Make sure to keep your .env file secure and never commit it to version control. Add .env to your .gitignore file.

Start the development server:
npx expo start
Project Structure
/src
/components - Reusable UI components
/screens - Application screens
/services - API and service integrations
/assets - Images and static resources
Main Screens
Welcome Screen - Introduction and authentication options
Register Screen - User registration with profile setup
Home Screen - Dashboard with budget overview
Transaction Management - Add and track expenses
Budget Planning - Set and monitor budget goals
Technologies Used
React Native
Expo
Appwrite Backend
React Navigation
Expo Vector Icons
React Native Chart Kit
Environment Setup
Create a .env file in the project root
Add the following environment variables:
env
# Appwrite Configuration
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=67219ba6000047dbdc43

# Database Configuration
APPWRITE_DATABASE_ID=budgetease

# Collection IDs
APPWRITE_TRANSACTIONS_COLLECTION=transactions
APPWRITE_BUDGETS_COLLECTION=budgets
APPWRITE_USERS_COLLECTION=users
APPWRITE_PROFILES_COLLECTION=profiles
Install environment variable support:
npm install react-native-dotenv
Add .env to your .gitignore:
echo ".env" >> .gitignore
Contributing
Fork the repository
Create your feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request
License
This project is licensed under the MIT License
