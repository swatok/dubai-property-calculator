import { PaymentPlan, PaymentSchedule, PropertyDetails, Currency, CURRENCY_CONVERSION } from '../types/types';
import { addMonths } from 'date-fns';

const convertAmount = (amount: number, fromCurrency: Currency, toCurrency: Currency): number => {
    if (fromCurrency === toCurrency) return amount;
    if (fromCurrency === 'AED' && toCurrency === 'USD') {
        return amount * CURRENCY_CONVERSION.AED_TO_USD;
    }
    return amount * CURRENCY_CONVERSION.USD_TO_AED;
};

export const calculatePaymentSchedule = (propertyDetails: PropertyDetails): PaymentSchedule[] => {
    const { price, completionDate, selectedPlan } = propertyDetails;
    const schedule: PaymentSchedule[] = [];

    // Розрахунок початкового внеску
    const downPaymentAmount = Math.round((price * selectedPlan.downPaymentPercentage) / 100);
    schedule.push({
        date: new Date(),
        amount: downPaymentAmount,
        description: 'Початковий внесок',
        paymentType: 'downPayment'
    });

    // Розрахунок регулярних платежів до передачі
    if (selectedPlan.installmentMonths > 0) {
        const totalInstallmentPercentage = 100 - selectedPlan.downPaymentPercentage - selectedPlan.handoverPaymentPercentage - (selectedPlan.postHandoverPercentage || 0);
        const totalInstallmentAmount = Math.round((price * totalInstallmentPercentage) / 100);
        
        const numberOfPayments = selectedPlan.installmentFrequency === 'monthly' 
            ? selectedPlan.installmentMonths 
            : Math.ceil(selectedPlan.installmentMonths / 3);
            
        const installmentAmount = Math.round(totalInstallmentAmount / numberOfPayments);
        const roundingDifference = totalInstallmentAmount - (installmentAmount * numberOfPayments);

        let remainingAmount = totalInstallmentAmount;
        const startDate = new Date();

        for (let i = 1; i <= numberOfPayments; i++) {
            const paymentDate = addMonths(
                startDate, 
                selectedPlan.installmentFrequency === 'monthly' ? i : i * 3
            );

            // Для останнього платежу використовуємо залишок
            let currentAmount;
            if (i === numberOfPayments) {
                currentAmount = remainingAmount;
            } else {
                currentAmount = installmentAmount;
                remainingAmount -= installmentAmount;
            }

            schedule.push({
                date: paymentDate,
                amount: currentAmount,
                description: `Платіж ${i}`,
                paymentType: 'installment'
            });
        }
    }

    // Розрахунок платежу при передачі
    const handoverAmount = Math.round((price * selectedPlan.handoverPaymentPercentage) / 100);
    schedule.push({
        date: completionDate,
        amount: handoverAmount,
        description: 'Платіж при передачі',
        paymentType: 'handover'
    });

    // Перевірка загальної суми
    const totalAmount = schedule.reduce((sum, payment) => sum + payment.amount, 0);
    if (totalAmount !== price) {
        const difference = price - totalAmount;
        const lastPayment = schedule[schedule.length - 1];
        lastPayment.amount += difference;
    }

    return schedule;
};

export const formatCurrency = (amount: number, currency: Currency): string => {
    const options = {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    };

    return new Intl.NumberFormat('en-US', options).format(amount);
}; 