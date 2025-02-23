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
    let currentAssetAmount = assetIncome?.initialAmount || 0;
    let lastPaymentDate = new Date();
    let totalAdditionalFundsNeeded = 0;

    // Розрахунок початкового внеску
    const downPaymentAmount = Math.round((price * selectedPlan.downPaymentPercentage) / 100);
    const downPaymentDate = new Date();
    
    let additionalFundsNeeded = 0;
    let assetAmountUsed = Math.min(currentAssetAmount, downPaymentAmount);
    if (assetAmountUsed < downPaymentAmount) {
        additionalFundsNeeded = downPaymentAmount - assetAmountUsed;
        totalAdditionalFundsNeeded += additionalFundsNeeded;
    }
    
    currentAssetAmount = Math.max(0, currentAssetAmount - assetAmountUsed);

    schedule.push({
        date: downPaymentDate,
        amount: downPaymentAmount,
        description: 'Початковий внесок',
        paymentType: 'downPayment',
        incomeForPeriod: 0,
        coverageRatio: 0,
        additionalFundsNeeded,
        assetAmountUsed,
        currentAssetValue: currentAssetAmount
    });

    lastPaymentDate = downPaymentDate;

    // Розрахунок регулярних платежів
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

            let incomeForPeriod = 0;
            if (assetIncome && currentAssetAmount > 0) {
                const monthsBetweenPayments = differenceInMonths(paymentDate, lastPaymentDate);
                const { finalAmount, totalIncome } = calculateCompoundIncome(
                    currentAssetAmount,
                    assetIncome.apr,
                    monthsBetweenPayments
                );
                currentAssetAmount = finalAmount;
                incomeForPeriod = totalIncome;
            }

            const currentPaymentAmount = i === numberOfPayments ? remainingAmount : installmentAmount;
            remainingAmount -= currentPaymentAmount;

            let additionalFundsNeeded = 0;
            let reinvestedAmount = 0;
            let assetAmountUsed = 0;

            if (incomeForPeriod >= currentPaymentAmount) {
                assetAmountUsed = currentPaymentAmount;
                reinvestedAmount = incomeForPeriod - currentPaymentAmount;
                currentAssetAmount += reinvestedAmount;
            } else {
                assetAmountUsed = Math.min(currentAssetAmount, currentPaymentAmount);
                if (assetAmountUsed < currentPaymentAmount) {
                    additionalFundsNeeded = currentPaymentAmount - assetAmountUsed;
                    totalAdditionalFundsNeeded += additionalFundsNeeded;
                }
                currentAssetAmount = Math.max(0, currentAssetAmount - assetAmountUsed);
            }

            schedule.push({
                date: paymentDate,
                amount: currentPaymentAmount,
                description: `Платіж ${i}`,
                paymentType: 'installment',
                incomeForPeriod,
                coverageRatio: incomeForPeriod ? (incomeForPeriod / currentPaymentAmount) * 100 : 0,
                additionalFundsNeeded,
                reinvestedAmount,
                assetAmountUsed,
                currentAssetValue: currentAssetAmount
            });

            lastPaymentDate = paymentDate;
        }
    }

    // Розрахунок платежу при передачі
    const handoverAmount = Math.round((price * selectedPlan.handoverPaymentPercentage) / 100);
    
    let finalIncomeForPeriod = 0;
    let finalAdditionalFundsNeeded = 0;
    let finalReinvestedAmount = 0;
    let finalAssetAmountUsed = 0;

    if (assetIncome && currentAssetAmount > 0) {
        const monthsToHandover = differenceInMonths(completionDate, lastPaymentDate);
        const { finalAmount, totalIncome } = calculateCompoundIncome(
            currentAssetAmount,
            assetIncome.apr,
            monthsToHandover
        );
        currentAssetAmount = finalAmount;
        finalIncomeForPeriod = totalIncome;

        if (finalIncomeForPeriod >= handoverAmount) {
            finalAssetAmountUsed = handoverAmount;
            finalReinvestedAmount = finalIncomeForPeriod - handoverAmount;
            currentAssetAmount += finalReinvestedAmount;
        } else {
            finalAssetAmountUsed = Math.min(currentAssetAmount, handoverAmount);
            if (finalAssetAmountUsed < handoverAmount) {
                finalAdditionalFundsNeeded = handoverAmount - finalAssetAmountUsed;
                totalAdditionalFundsNeeded += finalAdditionalFundsNeeded;
            }
            currentAssetAmount = Math.max(0, currentAssetAmount - finalAssetAmountUsed);
        }
    } else {
        finalAdditionalFundsNeeded = handoverAmount;
        totalAdditionalFundsNeeded += finalAdditionalFundsNeeded;
    }

    schedule.push({
        date: completionDate,
        amount: handoverAmount,
        description: 'Платіж при передачі',
        paymentType: 'handover',
        incomeForPeriod: finalIncomeForPeriod,
        coverageRatio: finalIncomeForPeriod ? (finalIncomeForPeriod / handoverAmount) * 100 : 0,
        additionalFundsNeeded: finalAdditionalFundsNeeded,
        reinvestedAmount: finalReinvestedAmount,
        assetAmountUsed: finalAssetAmountUsed,
        currentAssetValue: currentAssetAmount
    });

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