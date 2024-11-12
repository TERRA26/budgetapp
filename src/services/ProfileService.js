import { databases, ID, Query } from '../services/appwrite';
import { APPWRITE_DATABASE_ID, APPWRITE_PROFILES_COLLECTION } from '@env';

export const PROFILE_TYPES = {
    PERSONAL: 'personal',
    BUSINESS: 'business',
    SAVINGS: 'savings',
    INVESTMENT: 'investment',
    STUDENT: 'student'
};

export const SAVING_GOALS = {
    EMERGENCY: 'emergency',
    HOUSE: 'house',
    CAR: 'car',
    EDUCATION: 'education',
    RETIREMENT: 'retirement',
    VACATION: 'vacation',
    WEDDING: 'wedding',
    BUSINESS: 'business',
    OTHER: 'other'
};

export const RISK_TOLERANCE_LEVELS = {
    CONSERVATIVE: 'conservative',
    MODERATE: 'moderate',
    AGGRESSIVE: 'aggressive'
};

export const BUDGET_INTERVALS = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly'
};

export const EXPENSE_CATEGORIES = {
    HOUSING: {
        id: 'housing',
        name: 'Housing',
        icon: 'home',
        color: '#4CAF50',
        subcategories: ['Rent', 'Mortgage', 'Utilities', 'Insurance', 'Maintenance']
    },
    TRANSPORTATION: {
        id: 'transportation',
        name: 'Transportation',
        icon: 'directions-car',
        color: '#2196F3',
        subcategories: ['Car Payment', 'Gas', 'Public Transit', 'Maintenance', 'Insurance']
    },
    FOOD: {
        id: 'food',
        name: 'Food',
        icon: 'restaurant',
        color: '#FF9800',
        subcategories: ['Groceries', 'Dining Out', 'Delivery', 'Snacks']
    },
    ENTERTAINMENT: {
        id: 'entertainment',
        name: 'Entertainment',
        icon: 'local-movies',
        color: '#9C27B0',
        subcategories: ['Movies', 'Games', 'Sports', 'Hobbies', 'Streaming Services']
    },
    SHOPPING: {
        id: 'shopping',
        name: 'Shopping',
        icon: 'shopping-bag',
        color: '#F44336',
        subcategories: ['Clothing', 'Electronics', 'Home Goods', 'Personal Care']
    },
    HEALTH: {
        id: 'health',
        name: 'Health',
        icon: 'healing',
        color: '#00BCD4',
        subcategories: ['Insurance', 'Medications', 'Doctor Visits', 'Gym']
    },
    EDUCATION: {
        id: 'education',
        name: 'Education',
        icon: 'school',
        color: '#795548',
        subcategories: ['Tuition', 'Books', 'Supplies', 'Courses']
    },
    SAVINGS: {
        id: 'savings',
        name: 'Savings',
        icon: 'savings',
        color: '#607D8B',
        subcategories: ['Emergency Fund', 'Retirement', 'Investments', 'Goals']
    }
};

export const calculateSavingProgress = (targetAmount, currentAmount) => {
    return {
        percentage: (currentAmount / targetAmount) * 100,
        remaining: targetAmount - currentAmount,
        isCompleted: currentAmount >= targetAmount
    };
};

export const generateBudgetRecommendation = (monthlyIncome, savingGoal, riskTolerance) => {
    let savingRate;

    // Determine saving rate based on risk tolerance and goal
    switch (riskTolerance) {
        case RISK_TOLERANCE_LEVELS.CONSERVATIVE:
            savingRate = 0.15; // 15%
            break;
        case RISK_TOLERANCE_LEVELS.MODERATE:
            savingRate = 0.25; // 25%
            break;
        case RISK_TOLERANCE_LEVELS.AGGRESSIVE:
            savingRate = 0.35; // 35%
            break;
        default:
            savingRate = 0.20; // 20% default
    }

    // Adjust saving rate based on goal type
    if (savingGoal === SAVING_GOALS.EMERGENCY) {
        savingRate += 0.05; // Additional 5% for emergency fund
    } else if (savingGoal === SAVING_GOALS.RETIREMENT) {
        savingRate += 0.10; // Additional 10% for retirement
    }

    const monthlySavings = monthlyIncome * savingRate;
    const remainingIncome = monthlyIncome - monthlySavings;

    // Generate recommended budget breakdown
    return {
        savings: monthlySavings,
        housing: remainingIncome * 0.35,
        transportation: remainingIncome * 0.15,
        food: remainingIncome * 0.15,
        utilities: remainingIncome * 0.10,
        healthcare: remainingIncome * 0.10,
        entertainment: remainingIncome * 0.08,
        other: remainingIncome * 0.07
    };
};

export const calculatePointsForSavings = (targetSpending, actualSpending) => {
    if (actualSpending <= targetSpending) {
        // Calculate savings percentage
        const savingsPercent = ((targetSpending - actualSpending) / targetSpending) * 100;

        // Award points based on savings percentage
        if (savingsPercent >= 20) return 100; // Max points for 20%+ savings
        if (savingsPercent >= 15) return 75;
        if (savingsPercent >= 10) return 50;
        if (savingsPercent >= 5) return 25;
        return 10; // Minimum points for staying under budget
    }
    return 0; // No points if over budget
};

export const getRewardTiers = () => {
    return {
        BRONZE: {
            name: 'Bronze',
            minPoints: 0,
            maxPoints: 999,
            benefits: ['Basic budget insights', 'Monthly savings report']
        },
        SILVER: {
            name: 'Silver',
            minPoints: 1000,
            maxPoints: 4999,
            benefits: ['Advanced budget insights', 'Weekly savings report', 'Custom savings goals']
        },
        GOLD: {
            name: 'Gold',
            minPoints: 5000,
            maxPoints: 9999,
            benefits: ['Premium budget insights', 'Daily savings report', 'Investment recommendations']
        },
        PLATINUM: {
            name: 'Platinum',
            minPoints: 10000,
            maxPoints: Infinity,
            benefits: ['VIP budget insights', 'Real-time alerts', 'Personal finance advisor']
        }
    };
};

export const getCurrentRewardTier = (points) => {
    const tiers = getRewardTiers();

    if (points >= tiers.PLATINUM.minPoints) return tiers.PLATINUM;
    if (points >= tiers.GOLD.minPoints) return tiers.GOLD;
    if (points >= tiers.SILVER.minPoints) return tiers.SILVER;
    return tiers.BRONZE;
};