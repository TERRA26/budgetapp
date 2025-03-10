import { Account, Client, Databases, ID, Query } from 'appwrite';
import {
    APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID,
    APPWRITE_DATABASE_ID,
    APPWRITE_TRANSACTIONS_COLLECTION,
    APPWRITE_BUDGETS_COLLECTION,
    APPWRITE_PROFILES_COLLECTION
} from '@env';

const client = new Client();
client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);

export const createAccount = async (email, password, name) => {
    try {
        console.log('Starting account creation...');

        try {
            await account.deleteSession('current');
        } catch (e) {
            console.log('No existing session to delete');
        }

        const response = await account.create(
            ID.unique(),
            email,
            password,
            name
        );
        console.log('Account created, attempting login...'); // Debug log

        await account.createEmailPasswordSession(email, password);
        console.log('Session created successfully'); // Debug log

        return response;
    } catch (error) {
        console.error('Appwrite service :: createAccount :: error: ', error);
        throw error;
    }
};

export const createUserProfile = async (profileData) => {
    try {
        console.log('Creating user profile...');

        return await databases.createDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_PROFILES_COLLECTION,
            ID.unique(),
            {
                ...profileData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: true
            }
        );
    } catch (error) {
        console.error('Appwrite service :: createUserProfile :: error: ', error);
        throw error;
    }
};

export const getUserProfile = async (userId) => {
    try {
        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_PROFILES_COLLECTION,
            [
                Query.equal('userId', userId),
                Query.equal('isActive', true),
                Query.orderDesc('$createdAt'),
                Query.limit(1)
            ]
        );

        return response.documents[0];
    } catch (error) {
        console.error('Appwrite service :: getUserProfile :: error: ', error);
        throw error;
    }
};

export const updateUserProfile = async (profileId, updateData) => {
    try {
        return await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_PROFILES_COLLECTION,
            profileId,
            {
                ...updateData,
                updatedAt: new Date().toISOString()
            }
        );
    } catch (error) {
        console.error('Appwrite service :: updateUserProfile :: error: ', error);
        throw error;
    }
};

export const login = async (email, password) => {
    try {
        try {
            await account.deleteSession('current');
        } catch (e) {
            console.log('No existing session to delete');
        }

        const session = await account.createEmailPasswordSession(email, password);
        const user = await account.get();
        const profile = await getUserProfile(user.$id);

        return { session, user, profile };
    } catch (error) {
        console.error('Appwrite service :: login :: error: ', error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await account.deleteSession('current');
    } catch (error) {
        console.error('Appwrite service :: logout :: error: ', error);
        throw error;
    }
};

export const createTransaction = async (transactionData) => {
    try {
        const user = await account.get();
        return await databases.createDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_TRANSACTIONS_COLLECTION,
            ID.unique(),
            {
                userId: user.$id,
                ...transactionData,
                createdAt: new Date().toISOString(),
            }
        );
    } catch (error) {
        console.error('Appwrite service :: createTransaction :: error: ', error);
        throw error;
    }
};

export const getBudgets = async () => {
    try {
        const user = await account.get();
        return await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_BUDGETS_COLLECTION,
            [Query.equal('userId', user.$id)]
        );
    } catch (error) {
        console.error('Appwrite service :: getBudgets :: error: ', error);
        throw error;
    }
};

export const createBudget = async (budgetData) => {
    try {
        const user = await account.get();
        return await databases.createDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_BUDGETS_COLLECTION,
            ID.unique(),
            {
                userId: user.$id,
                category: budgetData.category,
                savingsGoal: parseFloat(budgetData.amount) || 0,
                currentSaved: 0,
                startDate: new Date().toISOString(),
                period: budgetData.period || 'monthly',
                isActive: true,
                createdAt: new Date().toISOString(),
            }
        );
    } catch (error) {
        console.error('Appwrite service :: createBudget :: error: ', error);
        throw error;
    }
};

export const updateBudgetSavings = async (budgetId, amountSaved) => {
    try {
        const budget = await databases.getDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_BUDGETS_COLLECTION,
            budgetId
        );

        const newCurrentSaved = parseFloat(budget.currentSaved || 0) + parseFloat(amountSaved);

        return await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_BUDGETS_COLLECTION,
            budgetId,
            {
                currentSaved: newCurrentSaved,
                updatedAt: new Date().toISOString()
            }
        );
    } catch (error) {
        console.error('Appwrite service :: updateBudgetSavings :: error: ', error);
        throw error;
    }
};