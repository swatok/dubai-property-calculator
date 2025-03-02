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

const calculateMonthlyMortgagePayment = (loanAmount: number, annualRate: number, years: number): number => {
    const monthlyRate = annualRate / 12 / 100;
    const numberOfPayments = years * 12;
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    return Math.round(monthlyPayment);
};

export const calculatePaymentSchedule = (propertyDetails: PropertyDetails): PaymentSchedule[] => {
    const { 
        price, 
        completionDate,
        endDate,
        selectedPlan, 
        assetIncome,
        rentalIncome,
        paymentMethod, 
        selectedMortgagePlan, 
        customMortgageRate, 
        dldBuyerPercentage,
        realtorCommission,
        mortgageSetupFee,
        valuationFee,
        mortgageRegistrationFee,
        noObjectionCertificate,
        titleDeedFee,
        administrativeFees
    } = propertyDetails;
    
    const schedule: PaymentSchedule[] = [];
    let currentAssetAmount = assetIncome?.initialAmount || 0;
    let totalAdditionalFundsNeeded = 0;
    let totalRentalIncome = 0;

    // Розрахунок DLD Fee та інших початкових витрат
    const totalDLD = price * 0.04;
    const buyerDLD = (totalDLD * dldBuyerPercentage) / 4;
    const realtorFee = (price * realtorCommission) / 100;
    const fixedFees = valuationFee + noObjectionCertificate + titleDeedFee + administrativeFees;

    // Створюємо масив всіх дат платежів
    const allPaymentDates: { date: Date; amount: number; description: string; paymentType: string }[] = [];
    
    // Початковий внесок з усіма додатковими витратами
    const downPaymentDate = new Date();
    const downPaymentAmount = Math.round((price * selectedPlan.downPaymentPercentage) / 100);
    const totalInitialPayment = downPaymentAmount + buyerDLD + realtorFee + fixedFees;
    
    allPaymentDates.push({
        date: downPaymentDate,
        amount: totalInitialPayment,
        description: `Початковий внесок ${selectedPlan.downPaymentPercentage}% (${formatCurrency(downPaymentAmount, propertyDetails.currency)}) + ` +
                    `DLD Fee ${formatCurrency(buyerDLD, propertyDetails.currency)}, ` +
                    `комісія ріелтора ${formatCurrency(realtorFee, propertyDetails.currency)}, ` +
                    `інші збори ${formatCurrency(fixedFees, propertyDetails.currency)}`,
        paymentType: 'downPayment'
    });

    // Розрахунок платежів до передачі
    if (selectedPlan.installmentMonths > 0) {
        const totalInstallmentPercentage = 100 - selectedPlan.downPaymentPercentage - selectedPlan.handoverPaymentPercentage;
        const totalInstallmentAmount = Math.round((price * totalInstallmentPercentage) / 100);
        
        if (selectedPlan.installmentFrequency === 'quarterly') {
            const quarterlyPayments = Math.ceil(selectedPlan.installmentMonths / 3);
            const quarterlyAmount = Math.round(totalInstallmentAmount / quarterlyPayments);
            
            for (let i = 1; i <= quarterlyPayments; i++) {
                const paymentDate = addMonths(downPaymentDate, i * 3);
                const isLastPayment = i === quarterlyPayments;
                const amount = isLastPayment ? 
                    totalInstallmentAmount - (quarterlyAmount * (quarterlyPayments - 1)) : 
                    quarterlyAmount;

                allPaymentDates.push({
                    date: paymentDate,
                    amount: amount,
                    description: `Квартальний платіж ${i} (${formatPercentage(amount / price * 100)} від вартості)`,
                    paymentType: 'installment'
                });
            }
        } else {
            const monthlyAmount = Math.round(totalInstallmentAmount / selectedPlan.installmentMonths);
            
            for (let i = 1; i <= selectedPlan.installmentMonths; i++) {
                const paymentDate = addMonths(downPaymentDate, i);
                const isLastPayment = i === selectedPlan.installmentMonths;
                const amount = isLastPayment ? 
                    totalInstallmentAmount - (monthlyAmount * (selectedPlan.installmentMonths - 1)) : 
                    monthlyAmount;

                allPaymentDates.push({
                    date: paymentDate,
                    amount: amount,
                    description: `Щомісячний платіж ${i} (${formatPercentage(amount / price * 100)} від вартості)`,
                    paymentType: 'installment'
                });
            }
        }
    }

    // Платіж при передачі
    const handoverAmount = Math.round((price * selectedPlan.handoverPaymentPercentage) / 100);
    allPaymentDates.push({
        date: completionDate,
        amount: handoverAmount,
        description: `Платіж при передачі (${selectedPlan.handoverPaymentPercentage}%)`,
        paymentType: 'handover'
    });

    // Сортуємо всі дати платежів
    allPaymentDates.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Розраховуємо щомісячний приріст активу та платежі
    let currentDate = new Date(downPaymentDate);
    currentDate.setHours(0, 0, 0, 0); // Скидаємо час
    
    const lastPaymentDate = new Date(allPaymentDates[allPaymentDates.length - 1].date);
    lastPaymentDate.setHours(0, 0, 0, 0);
    
    const userEndDate = new Date(endDate);
    userEndDate.setHours(0, 0, 0, 0);
    
    const calculationEndDate = userEndDate > lastPaymentDate ? userEndDate : lastPaymentDate;

    // Розраховуємо загальну суму платежів для обчислення відсотка покриття
    const totalPayments = allPaymentDates.reduce((sum, payment) => sum + payment.amount, 0);

    while (currentDate <= calculationEndDate) {
        // Знаходимо платіж для поточної дати
        const payment = allPaymentDates.find(p => {
            const paymentDate = new Date(p.date);
            paymentDate.setHours(0, 0, 0, 0);
            return paymentDate.getTime() === currentDate.getTime();
        });

        // Розраховуємо прибуток від активу за місяць
        let incomeForPeriod = 0;
        if (assetIncome && currentAssetAmount > 0) {
            const { finalAmount, totalIncome } = calculateCompoundIncome(
                currentAssetAmount,
                assetIncome.apr,
                1
            );
            incomeForPeriod = totalIncome;
            currentAssetAmount = finalAmount;
        }

        // Додаємо орендний дохід після завершення будівництва
        let rentalIncomeForPeriod = 0;
        let rentalCoverageRatio = 0;
        
        const completionDateTime = new Date(completionDate);
        completionDateTime.setHours(0, 0, 0, 0);
        
        if (rentalIncome && currentDate >= completionDateTime) {
            rentalIncomeForPeriod = rentalIncome.monthlyAmount;
            totalRentalIncome += rentalIncomeForPeriod;
            // Розраховуємо відсоток покриття орендою
            if (payment) {
                rentalCoverageRatio = (rentalIncomeForPeriod / payment.amount) * 100;
            }
        }

        // Загальний дохід за період (орендний має пріоритет)
        const totalIncomeForPeriod = rentalIncomeForPeriod + incomeForPeriod;

        if (payment) {
            // Спочатку використовуємо орендний дохід
            let remainingPayment = payment.amount;
            let rentalAmountUsed = Math.min(rentalIncomeForPeriod, remainingPayment);
            remainingPayment -= rentalAmountUsed;

            // Потім використовуємо дохід від активу
            let assetAmountUsed = Math.min(currentAssetAmount, remainingPayment);
            remainingPayment -= assetAmountUsed;
            
            let additionalFundsNeeded = remainingPayment;
            
            if (additionalFundsNeeded > 0) {
                totalAdditionalFundsNeeded += additionalFundsNeeded;
            }
            
            currentAssetAmount = Math.max(0, currentAssetAmount - assetAmountUsed);

            schedule.push({
                date: new Date(currentDate),
                amount: payment.amount,
                description: payment.description,
                paymentType: payment.paymentType as any,
                incomeForPeriod: totalIncomeForPeriod,
                coverageRatio: payment.amount ? (totalIncomeForPeriod / payment.amount) * 100 : 0,
                rentalCoverageRatio,
                additionalFundsNeeded,
                reinvestedAmount: totalIncomeForPeriod - (rentalAmountUsed + assetAmountUsed),
                assetAmountUsed,
                rentalAmountUsed,
                currentAssetValue: currentAssetAmount,
                rentalIncome: rentalIncomeForPeriod
            });
        } else {
            // Якщо немає платежу, весь дохід реінвестується
            schedule.push({
                date: new Date(currentDate),
                amount: 0,
                description: currentDate >= completionDateTime ? 
                    'Реінвестиція прибутку та орендного доходу' : 
                    'Реінвестиція прибутку',
                paymentType: 'installment',
                incomeForPeriod: totalIncomeForPeriod,
                coverageRatio: 0,
                rentalCoverageRatio: 0,
                additionalFundsNeeded: 0,
                reinvestedAmount: totalIncomeForPeriod,
                assetAmountUsed: 0,
                rentalAmountUsed: 0,
                currentAssetValue: currentAssetAmount,
                rentalIncome: rentalIncomeForPeriod
            });
        }

        // Додаємо один місяць
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
        currentDate.setHours(0, 0, 0, 0);
    }

    // Додаємо підсумковий рядок
    if (totalAdditionalFundsNeeded > 0 || totalRentalIncome > 0) {
        const totalRentalCoverageRatio = (totalRentalIncome / totalPayments) * 100;
        schedule.push({
            date: calculationEndDate,
            amount: totalAdditionalFundsNeeded,
            description: `Підсумок: Додаткові кошти ${formatCurrency(totalAdditionalFundsNeeded, propertyDetails.currency)}, ` +
                        `Загальний орендний дохід ${formatCurrency(totalRentalIncome, propertyDetails.currency)} (${formatPercentage(totalRentalCoverageRatio)} покриття)`,
            paymentType: 'summary',
            incomeForPeriod: 0,
            coverageRatio: 0,
            rentalCoverageRatio: totalRentalCoverageRatio,
            additionalFundsNeeded: totalAdditionalFundsNeeded,
            currentAssetValue: currentAssetAmount,
            rentalIncome: totalRentalIncome,
            reinvestedAmount: 0,
            assetAmountUsed: 0,
            rentalAmountUsed: 0
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