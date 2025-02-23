export interface PaymentPlan {
    name: string;
    description: string;
    downPaymentPercentage: number;
    handoverPaymentPercentage: number;
    installmentMonths: number;
    installmentFrequency: 'monthly' | 'quarterly';
    postHandoverMonths?: number;
    postHandoverPercentage?: number;
}

export type Currency = 'AED' | 'USD';

export interface AssetIncome {
    initialAmount: number;
    apr: number;
    currency: Currency;
}

export interface PropertyDetails {
    price: number;
    completionDate: Date;
    selectedPlan: PaymentPlan;
    currency: Currency;
    assetIncome?: AssetIncome;
}

export interface PaymentSchedule {
    date: Date;
    amount: number;
    description: string;
    paymentType: 'downPayment' | 'installment' | 'handover' | 'postHandover';
    incomeForPeriod?: number;
    coverageRatio?: number;
    additionalFundsNeeded?: number;
    reinvestedAmount?: number;
    assetAmountUsed?: number;
    currentAssetValue?: number;
}

export const DEFAULT_PAYMENT_PLANS: PaymentPlan[] = [
    {
        name: "Стандартний план",
        description: "20% передоплата, 80% при передачі",
        downPaymentPercentage: 20,
        handoverPaymentPercentage: 80,
        installmentMonths: 0,
        installmentFrequency: 'monthly'
    },
    {
        name: "40/60 План",
        description: "40% передоплата, 60% розстрочка до завершення",
        downPaymentPercentage: 40,
        handoverPaymentPercentage: 60,
        installmentMonths: 24,
        installmentFrequency: 'monthly'
    },
    {
        name: "50/50 План",
        description: "50% передоплата, 50% при передачі",
        downPaymentPercentage: 50,
        handoverPaymentPercentage: 50,
        installmentMonths: 0,
        installmentFrequency: 'monthly'
    },
    {
        name: "Розширений план",
        description: "30% передоплата, щоквартальні платежі, 40% при передачі",
        downPaymentPercentage: 30,
        handoverPaymentPercentage: 40,
        installmentMonths: 24,
        installmentFrequency: 'quarterly'
    },
    {
        name: "План з пост-хандовер",
        description: "20% передоплата, 30% до передачі, 50% протягом 2 років після передачі",
        downPaymentPercentage: 20,
        handoverPaymentPercentage: 30,
        installmentMonths: 24,
        installmentFrequency: 'monthly',
        postHandoverMonths: 24,
        postHandoverPercentage: 50
    },
    {
        name: "10/90 План",
        description: "10% передоплата, 90% при передачі (для готових проектів)",
        downPaymentPercentage: 10,
        handoverPaymentPercentage: 90,
        installmentMonths: 0,
        installmentFrequency: 'monthly'
    },
    {
        name: "25/75 План з розстрочкою",
        description: "25% передоплата, 65% в розстрочку, 10% при передачі",
        downPaymentPercentage: 25,
        handoverPaymentPercentage: 10,
        installmentMonths: 36,
        installmentFrequency: 'monthly'
    },
    {
        name: "60/40 Пост-хандовер план",
        description: "20% передоплата, 40% до передачі, 40% протягом 3 років після передачі",
        downPaymentPercentage: 20,
        handoverPaymentPercentage: 40,
        installmentMonths: 24,
        installmentFrequency: 'monthly',
        postHandoverMonths: 36,
        postHandoverPercentage: 40
    },
    {
        name: "Преміум план",
        description: "30% передоплата, 30% в розстрочку, 20% при передачі, 20% через рік після передачі",
        downPaymentPercentage: 30,
        handoverPaymentPercentage: 20,
        installmentMonths: 18,
        installmentFrequency: 'quarterly',
        postHandoverMonths: 12,
        postHandoverPercentage: 20
    },
    {
        name: "Інвестиційний план",
        description: "35% передоплата, 45% до передачі, 20% протягом року після передачі",
        downPaymentPercentage: 35,
        handoverPaymentPercentage: 45,
        installmentMonths: 24,
        installmentFrequency: 'monthly',
        postHandoverMonths: 12,
        postHandoverPercentage: 20
    }
];

export const CURRENCY_CONVERSION = {
    AED_TO_USD: 0.27,
    USD_TO_AED: 3.67
}; 