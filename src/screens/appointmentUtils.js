const MAKE_WEBHOOK_URL_GET_BOOKED_SLOTS = 'https://hook.us2.make.com/w9bcdifmbjyjxuty3dg4g2i8r2p0j37j';
const MAKE_WEBHOOK_URL_SCHEDULE = 'https://hook.us2.make.com/dbpaf6h4u3bqxkl41b8t7o6y3q8ni1yb';

export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export const generateAvailableSlots = (currentTime) => {
    const availableSlots = {};
    const startDate = new Date(currentTime);
    startDate.setHours(0, 0, 0, 0);

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const allHours = [9, 10, 11, 14, 15, 16];  // Available hours

    let daysAdded = 0;
    while (daysAdded < 5) {
        if (startDate.getDay() !== 0 && startDate.getDay() !== 6) {  // Skip weekends
            const dayKey = startDate.toISOString().split('T')[0];
            const dayName = daysOfWeek[startDate.getDay()];

            const availableSlotsForDay = [];

            // Generate all possible slots for the day
            allHours.forEach(hour => {
                const slotTime = new Date(startDate);
                slotTime.setHours(hour, 0, 0, 0);

                if (slotTime > currentTime) {
                    availableSlotsForDay.push({
                        time: slotTime,
                        type: hour < 12 ? 'morning' : 'afternoon'
                    });
                }
            });

            // Shuffle and limit to 3 slots
            if (availableSlotsForDay.length > 0) {
                const shuffledSlots = shuffleArray([...availableSlotsForDay]);
                availableSlots[dayKey] = {
                    dayName,
                    slots: shuffledSlots.slice(0, 3)
                };
                daysAdded++;
            }
        }
        startDate.setDate(startDate.getDate() + 1);
    }

    return availableSlots;
};

export const formatTimeSlot = (date) => {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

export const formatDateForWebhook = (date) => {
    return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).replace(',', '');
};

export const fetchAvailableSlots = async () => {
    try {
        return generateAvailableSlots(new Date());
    } catch (error) {
        console.error('Error generating available slots:', error);
        return {};
    }
};

export const scheduleAppointment = async (selectedSlot, userEmail, userName, messages) => {
    if (!selectedSlot || !userEmail || !userName) {
        throw new Error('Missing required appointment information');
    }

    if (!validateEmail(userEmail)) {
        throw new Error('Invalid email address');
    }

    const startTime = new Date(selectedSlot);
    const endTime = new Date(selectedSlot);
    endTime.setHours(endTime.getHours() + 1);

    const formattedStartDate = formatDateForWebhook(startTime);
    const formattedEndDate = formatDateForWebhook(endTime);

    const appointmentData = {
        email: userEmail,
        name: userName,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        conversation: messages.map(msg => `${msg.sender}: ${msg.text}`).join('\n\n')
    };

    try {
        const response = await fetch(MAKE_WEBHOOK_URL_SCHEDULE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(appointmentData)
        });

        if (!response.ok) {
            throw new Error('Failed to schedule appointment');
        }

        return {
            success: true,
            startDate: formattedStartDate
        };
    } catch (error) {
        console.error('Error scheduling appointment:', error);
        throw error;
    }
};