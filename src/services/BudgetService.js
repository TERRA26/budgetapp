export const calculateBudgetProgress = (budget) => {
    if (!budget || typeof budget.currentSaved === 'undefined' || typeof budget.savingsGoal === 'undefined') {
        return {
            progress: 0,
            remaining: 0,
            isCompleted: false,
            monthlyRequired: 0
        };
    }

    const progress = (budget.currentSaved / budget.savingsGoal) * 100;
    const remaining = budget.savingsGoal - budget.currentSaved;
    const isCompleted = budget.currentSaved >= budget.savingsGoal;

    // Calculate monthly required savings based on income
    const monthlyRequired = budget.period === 'monthly'
        ? (remaining / getMonthsRemaining(budget.startDate))
        : remaining / 12;

    return {
        progress: Math.min(progress, 100),
        remaining,
        isCompleted,
        monthlyRequired
    };
};

const getMonthsRemaining = (startDate) => {
    if (!startDate) return 12;
    const start = new Date(startDate);
    const current = new Date();
    return Math.max(1,
        12 - (current.getMonth() - start.getMonth() +
            (12 * (current.getFullYear() - start.getFullYear())))
    );
};