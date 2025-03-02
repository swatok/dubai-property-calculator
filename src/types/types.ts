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

export interface MortgagePlan {
    name: string;
    description: string;
    downPaymentPercentage: number;
    interestRate: number; // Річна ставка
    termYears: number; // Термін в роках
    maxLoanAmount: number; // Максимальна сума кредиту в AED
}

export type PaymentMethod = 'installment' | 'mortgage';

export interface RentalIncome {
    monthlyAmount: number;
    currency: Currency;
}

export interface PropertyDetails {
    price: number;
    completionDate: Date;
    endDate: Date; // Дата кінця графіку платежів
    selectedPlan: PaymentPlan;
    currency: Currency;
    assetIncome?: AssetIncome;
    rentalIncome?: RentalIncome; // Дохід від оренди після завершення будівництва
    paymentMethod: PaymentMethod;
    selectedMortgagePlan?: MortgagePlan;
    customMortgageRate?: number;
    dldBuyerPercentage: number; // Відсоток DLD Fee, який платить покупець (0-4%)
    realtorCommission: number; // Комісія ріелтора у відсотках
    mortgageSetupFee: number; // Комісія за оформлення іпотеки (зазвичай 1%)
    valuationFee: number; // Оцінка нерухомості (фіксована сума)
    mortgageRegistrationFee: number; // Реєстрація іпотеки (0.25%)
    noObjectionCertificate: number; // NOC - дозвіл від забудовника
    titleDeedFee: number; // Оформлення права власності
    administrativeFees: number; // Адміністративні збори
}

export interface PaymentSchedule {
    date: Date;
    amount: number;
    description: string;
    paymentType: 'installment' | 'downPayment' | 'handover' | 'postHandover' | 'summary';
    incomeForPeriod: number;
    coverageRatio: number; // Загальний відсоток покриття (оренда + актив)
    rentalCoverageRatio: number; // Відсоток покриття тільки орендним доходом
    additionalFundsNeeded: number;
    reinvestedAmount: number;
    assetAmountUsed: number;
    rentalAmountUsed: number;
    currentAssetValue: number;
    rentalIncome: number;
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

export const DEFAULT_MORTGAGE_PLANS: MortgagePlan[] = [
    {
        name: "Стандартна іпотека",
        description: "20% перший внесок, 4.49% річних, до 25 років",
        downPaymentPercentage: 20,
        interestRate: 4.49,
        termYears: 25,
        maxLoanAmount: 15000000
    },
    {
        name: "Спеціальна програма",
        description: "30% перший внесок, 3.99% річних, до 20 років",
        downPaymentPercentage: 30,
        interestRate: 3.99,
        termYears: 20,
        maxLoanAmount: 10000000
    },
    {
        name: "Преміум іпотека",
        description: "25% перший внесок, 4.29% річних, до 30 років",
        downPaymentPercentage: 25,
        interestRate: 4.29,
        termYears: 30,
        maxLoanAmount: 20000000
    }
];

export const CURRENCY_CONVERSION = {
    AED_TO_USD: 0.27,
    USD_TO_AED: 3.67
}; 