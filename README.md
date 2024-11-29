# BudgetEase 💰

A powerful, AI-driven mobile application that revolutionizes personal finance management through intelligent budgeting and expense tracking.

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Appwrite](https://img.shields.io/badge/Appwrite-F02E65?style=for-the-badge&logo=Appwrite&logoColor=white)

## ✨ Features

- 🤖 **AI-Powered Financial Insights** - Get personalized financial advice and spending patterns analysis
- 📊 **Smart Budget Tracking** - Automatic categorization and intelligent expense monitoring
- 📈 **Predictive Analytics** - AI-driven expense forecasting and trend analysis
- 🏦 **Bank Integration** - Secure connection with multiple bank accounts
- 🎯 **Custom Savings Goals** - Set and track personalized financial objectives
- ⚡ **Real-time Monitoring** - Instant transaction updates and alerts
- 📅 **Flexible Planning** - Monthly and weekly budget management tools

## 🚀 Getting Started

### Prerequisites

- Node.js (latest stable version)
- React Native development environment
- Expo CLI
- Appwrite backend setup

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TERRA26/budgetapp.git
   cd budgetapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   
   Create a `.env` file in the root directory:
   ```env
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
   ```

4. **Start Development Server**
   ```bash
   npx expo start
   ```

## 📁 Project Structure

```
/src
├── /components    # Reusable UI components
├── /screens      # Application screens
├── /services     # API and service integrations
└── /assets       # Images and static resources
```

## 🖥️ Main Screens

| Screen | Description |
|--------|-------------|
| Welcome | Introduction and authentication options |
| Register | User registration with profile setup |
| Home | Dashboard with budget overview |
| Transactions | Add and track expenses |
| Budget Planning | Set and monitor budget goals |

## 🛠️ Technologies

- **Frontend Framework**: React Native
- **Development Platform**: Expo
- **Backend Service**: Appwrite
- **Navigation**: React Navigation
- **UI Components**: Expo Vector Icons
- **Data Visualization**: React Native Chart Kit

## 🔧 Environment Setup

1. **Install environment variable support**
   ```bash
   npm install react-native-dotenv
   ```

2. **Add .env to .gitignore**
   ```bash
   echo ".env" >> .gitignore
   ```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Commit your changes
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. Push to the branch
   ```bash
   git push origin feature/AmazingFeature
   ```
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
