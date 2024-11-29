import { Client, Databases, Query } from 'appwrite';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('67219ba6000047dbdc43');

const databases = new Databases(client);

async function updateUserBalances(userId, currentBalance, totalSavings) {
    try {
        const response = await databases.listDocuments(
            'budgetease',
            'profiles',
            [Query.equal('userId', userId)]
        );

        if (response.documents.length === 0) {
            throw new Error('User profile not found');
        }

        const profile = response.documents[0];

        await databases.updateDocument(
            'budgetease',
            'profiles',
            profile.$id,
            {
                currentBalance,
                totalSavings
            }
        );

        return { success: true, message: 'Balances updated successfully' };
    } catch (error) {
        console.error('Error updating balances:', error);
        throw error;
    }
}

const userId = process.argv[2];
const currentBalance = parseFloat(process.argv[3]);
const totalSavings = parseFloat(process.argv[4]);

if (!userId || isNaN(currentBalance) || isNaN(totalSavings)) {
    console.error('Usage: node updateBalances.js <userId> <currentBalance> <totalSavings>');
    process.exit(1);
}

updateUserBalances(userId, currentBalance, totalSavings)
    .then(result => {
        console.log(result.message);
        process.exit(0);
    })
    .catch(error => {
        console.error('Failed to update balances:', error);
        process.exit(1);
    });