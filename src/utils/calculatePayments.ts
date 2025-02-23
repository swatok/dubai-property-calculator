import { PaymentPlan, PaymentSchedule, PropertyDetails, Currency, CURRENCY_CONVERSION } from '../types/types';
import { addMonths, differenceInMonths } from 'date-fns';

const convertAmount = (amount: number, fromCurrency: Currency, toCurrency: Currency): number => {
    if (fromCurrency === toCurrency) return amount;
    if (fromCurrency === 'AED' && toCurrency === 'USD') {
        return amount * CURRENCY_CONVERSION.AED_TO_USD;
    }
    return amount * CURRENCY_CONVERSION.USD_TO_AED;
};

const calculateCompoundIncome = (
    initialAmount: number, 
    apr: number, 
    months: number
): { finalAmount: number; totalIncome: number } => {
    const monthlyRate = apr / 12 / 100;
    const finalAmount = initialAmount * Math.pow(1 + monthlyRate, months);
    const totalIncome = finalAmount - initialAmount;
    
    return {
        finalAmount: Math.round(finalAmount),
        totalIncome: Math.round(totalIncome)
    };
};

export const calculatePaymentSchedule = (propertyDetails: PropertyDetails): PaymentSchedule[] => {
    const { price, completionDate, selectedPlan, assetIncome } = propertyDetails;
    const schedule: PaymentSchedule[] = [];
    let currentAssetAmount = 0; // Починаємо з 0, бо актив ще не запущено
    let totalAdditionalFundsNeeded = 0;

    // Створюємо масив всіх дат платежів
    const allPaymentDates: { date: Date; amount: number; description: string; paymentType: string }[] = [];
    
    // Додаємо початковий внесок
    const downPaymentDate = new Date();
    const downPaymentAmount = Math.round((price * selectedPlan.downPaymentPercentage) / 100);
    allPaymentDates.push({
        date: downPaymentDate,
        amount: downPaymentAmount,
        description: 'Початковий внесок',
        paymentType: 'downPayment'
    });

    // Після першого внеску запускаємо актив
    currentAssetAmount = assetIncome?.initialAmount || 0;

    // Додаємо регулярні платежі
    if (selectedPlan.installmentMonths > 0) {
        const totalInstallmentPercentage = 100 - selectedPlan.downPaymentPercentage - selectedPlan.handoverPaymentPercentage;
        const totalInstallmentAmount = Math.round((price * totalInstallmentPercentage) / 100);
        const numberOfPayments = selectedPlan.installmentFrequency === 'monthly' 
            ? selectedPlan.installmentMonths 
            : Math.ceil(selectedPlan.installmentMonths / 3);
        
        const installmentAmount = Math.round(totalInstallmentAmount / numberOfPayments);
        let remainingAmount = totalInstallmentAmount;

        for (let i = 1; i <= numberOfPayments; i++) {
            const paymentDate = addMonths(
                downPaymentDate, 
                selectedPlan.installmentFrequency === 'monthly' ? i : i * 3
            );
            const currentPaymentAmount = i === numberOfPayments ? remainingAmount : installmentAmount;
            remainingAmount -= currentPaymentAmount;

            allPaymentDates.push({
                date: paymentDate,
                amount: currentPaymentAmount,
                description: `Платіж ${i}`,
                paymentType: 'installment'
            });
        }
    }

    // Додаємо платіж при передачі
    const handoverAmount = Math.round((price * selectedPlan.handoverPaymentPercentage) / 100);
    allPaymentDates.push({
        date: completionDate,
        amount: handoverAmount,
        description: 'Платіж при передачі',
        paymentType: 'handover'
    });

    // Сортуємо всі дати платежів
    allPaymentDates.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Розраховуємо щомісячний приріст активу та платежі
    let currentDate = new Date(downPaymentDate);
    const lastDate = new Date(completionDate);
    lastDate.setMonth(lastDate.getMonth() + 1); // Додаємо місяць для включення останньої дати

    while (currentDate < lastDate) {
        // Знаходимо платіж для поточної дати, якщо він є
        const payment = allPaymentDates.find(p => 
            p.date.getFullYear() === currentDate.getFullYear() && 
            p.date.getMonth() === currentDate.getMonth()
        );

        // Розраховуємо прибуток за місяць
        let incomeForPeriod = 0;
        if (assetIncome && currentAssetAmount > 0 && payment?.description !== 'Початковий внесок') {
            const { finalAmount, totalIncome } = calculateCompoundIncome(
                currentAssetAmount,
                assetIncome.apr,
                1 // завжди 1 місяць
            );
            currentAssetAmount = finalAmount;
            incomeForPeriod = totalIncome;
        }

        if (payment) {
            // Якщо є платіж, перевіряємо чи вистачає коштів
            let additionalFundsNeeded = 0;
            let assetAmountUsed = Math.min(currentAssetAmount, payment.amount);
            
            if (assetAmountUsed < payment.amount) {
                additionalFundsNeeded = payment.amount - assetAmountUsed;
                totalAdditionalFundsNeeded += additionalFundsNeeded;
            }
            
            currentAssetAmount = Math.max(0, currentAssetAmount - assetAmountUsed);

            schedule.push({
                date: new Date(currentDate),
                amount: payment.amount,
                description: payment.description,
                paymentType: payment.paymentType as any,
                incomeForPeriod,
                coverageRatio: payment.amount ? (incomeForPeriod / payment.amount) * 100 : 0,
                additionalFundsNeeded,
                reinvestedAmount: incomeForPeriod,
                assetAmountUsed,
                currentAssetValue: currentAssetAmount
            });
        } else {
            // Якщо немає платежу, просто додаємо інформацію про приріст активу
            schedule.push({
                date: new Date(currentDate),
                amount: 0,
                description: 'Реінвестиція прибутку',
                paymentType: 'installment',
                incomeForPeriod,
                coverageRatio: 0,
                additionalFundsNeeded: 0,
                reinvestedAmount: incomeForPeriod,
                assetAmountUsed: 0,
                currentAssetValue: currentAssetAmount
            });
        }

        // Переходимо до наступного місяця
        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Додаємо підсумковий рядок з загальною сумою додаткових коштів
    if (totalAdditionalFundsNeeded > 0) {
        schedule.push({
            date: completionDate,
            amount: totalAdditionalFundsNeeded,
            description: 'Загальна сума додаткових коштів',
            paymentType: 'downPayment',
            incomeForPeriod: 0,
            coverageRatio: 0,
            additionalFundsNeeded: totalAdditionalFundsNeeded,
            currentAssetValue: currentAssetAmount
        });
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

export const formatPercentage = (value: number): string => {
    return `${Math.round(value)}%`;
}; 