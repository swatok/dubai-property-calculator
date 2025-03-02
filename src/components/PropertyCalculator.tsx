import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { PaymentSchedule, PropertyDetails, DEFAULT_PAYMENT_PLANS, Currency, CURRENCY_CONVERSION, DEFAULT_MORTGAGE_PLANS } from '../types/types';
import { calculatePaymentSchedule, formatCurrency, formatPercentage } from '../utils/calculatePayments';
import { Typography } from '@mui/material';
import { InputAdornment } from '@mui/material';

const PropertyCalculator: React.FC = () => {
    const [propertyDetails, setPropertyDetails] = useState<PropertyDetails>({
        price: 0,
        completionDate: new Date(),
        endDate: new Date(),
        selectedPlan: DEFAULT_PAYMENT_PLANS[0],
        currency: 'AED',
        assetIncome: {
            initialAmount: 0,
            apr: 0,
            currency: 'AED'
        },
        paymentMethod: 'installment',
        selectedMortgagePlan: DEFAULT_MORTGAGE_PLANS[0],
        customMortgageRate: undefined,
        dldBuyerPercentage: 2,
        realtorCommission: 2,
        mortgageSetupFee: 1,
        valuationFee: 3000,
        mortgageRegistrationFee: 0.25,
        noObjectionCertificate: 500,
        titleDeedFee: 2000,
        administrativeFees: 1000,
        rentalIncome: undefined
    });

    const [paymentSchedule, setPaymentSchedule] = useState<PaymentSchedule[]>([]);

    useEffect(() => {
        const schedule = calculatePaymentSchedule(propertyDetails);
        setPaymentSchedule(schedule);
    }, [propertyDetails]);

    const handleCurrencyChange = (event: React.MouseEvent<HTMLElement>, newCurrency: Currency) => {
        if (newCurrency !== null) {
            const conversionRate = newCurrency === 'USD' ? CURRENCY_CONVERSION.AED_TO_USD : CURRENCY_CONVERSION.USD_TO_AED;
            setPropertyDetails({
                ...propertyDetails,
                currency: newCurrency,
                price: Math.round(propertyDetails.price * conversionRate),
                assetIncome: {
                    ...propertyDetails.assetIncome!,
                    initialAmount: Math.round(propertyDetails.assetIncome!.initialAmount * conversionRate),
                    currency: newCurrency
                }
            });
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Paper sx={{ p: 4 }}>
                    <Box component="h4" sx={{ mb: 2, fontSize: '2rem', fontWeight: 'bold' }}>
                        Калькулятор платежів за нерухомість в Дубаї
                    </Box>

                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label={`Вартість об'єкту (${propertyDetails.currency})`}
                                type="number"
                                value={propertyDetails.price}
                                onChange={(e) => setPropertyDetails({
                                    ...propertyDetails,
                                    price: Number(e.target.value)
                                })}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <DatePicker
                                label="Дата завершення будівництва"
                                value={propertyDetails.completionDate}
                                onChange={(date) => date && setPropertyDetails({
                                    ...propertyDetails,
                                    completionDate: date
                                })}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Дата кінця графіку платежів"
                                value={propertyDetails.endDate.toISOString().split('T')[0]}
                                onChange={(e) => {
                                    const newDate = new Date(e.target.value);
                                    setPropertyDetails({
                                        ...propertyDetails,
                                        endDate: newDate
                                    });
                                }}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Спосіб оплати</InputLabel>
                                <Select
                                    value={propertyDetails.paymentMethod}
                                    onChange={(e) => setPropertyDetails({
                                        ...propertyDetails,
                                        paymentMethod: e.target.value as 'installment' | 'mortgage'
                                    })}
                                >
                                    <MenuItem value="installment">Розстрочка</MenuItem>
                                    <MenuItem value="mortgage">Іпотека</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            {propertyDetails.paymentMethod === 'installment' ? (
                                <FormControl fullWidth>
                                    <InputLabel>План розстрочки</InputLabel>
                                    <Select
                                        value={propertyDetails.selectedPlan.name}
                                        onChange={(e) => {
                                            const plan = DEFAULT_PAYMENT_PLANS.find(p => p.name === e.target.value);
                                            if (plan) {
                                                setPropertyDetails({
                                                    ...propertyDetails,
                                                    selectedPlan: plan
                                                });
                                            }
                                        }}
                                    >
                                        {DEFAULT_PAYMENT_PLANS.map((plan) => (
                                            <MenuItem key={plan.name} value={plan.name}>
                                                {plan.name} - {plan.description}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            ) : (
                                <FormControl fullWidth>
                                    <InputLabel>Іпотечний план</InputLabel>
                                    <Select
                                        value={propertyDetails.selectedMortgagePlan?.name}
                                        onChange={(e) => {
                                            const plan = DEFAULT_MORTGAGE_PLANS.find(p => p.name === e.target.value);
                                            if (plan) {
                                                setPropertyDetails({
                                                    ...propertyDetails,
                                                    selectedMortgagePlan: plan
                                                });
                                            }
                                        }}
                                    >
                                        {DEFAULT_MORTGAGE_PLANS.map((plan) => (
                                            <MenuItem key={plan.name} value={plan.name}>
                                                {plan.name} - Перший внесок: {plan.downPaymentPercentage}%, Ставка: {plan.interestRate}%
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ mb: 2, mt: 4, fontSize: '1.5rem', fontWeight: 'bold' }}>
                                Додаткові витрати
                            </Box>
                        </Grid>

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Частка DLD Fee для покупця (0-4%)"
                                    type="number"
                                    value={propertyDetails.dldBuyerPercentage}
                                    onChange={(e) => setPropertyDetails({
                                        ...propertyDetails,
                                        dldBuyerPercentage: Math.min(4, Math.max(0, Number(e.target.value)))
                                    })}
                                    helperText="4% - весь DLD Fee платить покупець, 0% - весь DLD Fee платить продавець"
                                    inputProps={{
                                        min: 0,
                                        max: 4,
                                        step: 0.1
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Комісія ріелтора (%)"
                                    type="number"
                                    value={propertyDetails.realtorCommission}
                                    onChange={(e) => setPropertyDetails({
                                        ...propertyDetails,
                                        realtorCommission: Math.max(0, Number(e.target.value))
                                    })}
                                    helperText="Стандартна комісія 2%"
                                    inputProps={{
                                        min: 0,
                                        step: 0.1
                                    }}
                                />
                            </Grid>

                            {propertyDetails.paymentMethod === 'mortgage' && (
                                <>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Комісія за оформлення іпотеки (%)"
                                            type="number"
                                            value={propertyDetails.mortgageSetupFee}
                                            onChange={(e) => setPropertyDetails({
                                                ...propertyDetails,
                                                mortgageSetupFee: Math.max(0, Number(e.target.value))
                                            })}
                                            helperText="Зазвичай 1% від суми іпотеки"
                                            inputProps={{
                                                min: 0,
                                                step: 0.1
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Реєстрація іпотеки (%)"
                                            type="number"
                                            value={propertyDetails.mortgageRegistrationFee}
                                            onChange={(e) => setPropertyDetails({
                                                ...propertyDetails,
                                                mortgageRegistrationFee: Math.max(0, Number(e.target.value))
                                            })}
                                            helperText="0.25% від суми іпотеки"
                                            inputProps={{
                                                min: 0,
                                                step: 0.01
                                            }}
                                        />
                                    </Grid>
                                </>
                            )}

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={`Оцінка нерухомості (${propertyDetails.currency})`}
                                    type="number"
                                    value={propertyDetails.valuationFee}
                                    onChange={(e) => setPropertyDetails({
                                        ...propertyDetails,
                                        valuationFee: Math.max(0, Number(e.target.value))
                                    })}
                                    helperText="Зазвичай 3,000 AED"
                                    inputProps={{
                                        min: 0,
                                        step: 100
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={`NOC - дозвіл від забудовника (${propertyDetails.currency})`}
                                    type="number"
                                    value={propertyDetails.noObjectionCertificate}
                                    onChange={(e) => setPropertyDetails({
                                        ...propertyDetails,
                                        noObjectionCertificate: Math.max(0, Number(e.target.value))
                                    })}
                                    helperText="Зазвичай 500-1,000 AED"
                                    inputProps={{
                                        min: 0,
                                        step: 100
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={`Оформлення права власності (${propertyDetails.currency})`}
                                    type="number"
                                    value={propertyDetails.titleDeedFee}
                                    onChange={(e) => setPropertyDetails({
                                        ...propertyDetails,
                                        titleDeedFee: Math.max(0, Number(e.target.value))
                                    })}
                                    helperText="Зазвичай 2,000-4,000 AED"
                                    inputProps={{
                                        min: 0,
                                        step: 100
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={`Адміністративні збори (${propertyDetails.currency})`}
                                    type="number"
                                    value={propertyDetails.administrativeFees}
                                    onChange={(e) => setPropertyDetails({
                                        ...propertyDetails,
                                        administrativeFees: Math.max(0, Number(e.target.value))
                                    })}
                                    helperText="Різні адміністративні витрати"
                                    inputProps={{
                                        min: 0,
                                        step: 100
                                    }}
                                />
                            </Grid>
                        </Grid>

                        <Grid item xs={12}>
                            <Box sx={{ mb: 2, mt: 4, fontSize: '1.5rem', fontWeight: 'bold' }}>
                                Інформація про актив для платежів
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label={`Початкова сума активу (${propertyDetails.currency})`}
                                type="number"
                                value={propertyDetails.assetIncome?.initialAmount || 0}
                                onChange={(e) => setPropertyDetails({
                                    ...propertyDetails,
                                    assetIncome: {
                                        ...propertyDetails.assetIncome!,
                                        initialAmount: Number(e.target.value)
                                    }
                                })}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Річна відсоткова ставка (APR %)"
                                type="number"
                                value={propertyDetails.assetIncome?.apr || 0}
                                onChange={(e) => setPropertyDetails({
                                    ...propertyDetails,
                                    assetIncome: {
                                        ...propertyDetails.assetIncome!,
                                        apr: Number(e.target.value)
                                    }
                                })}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <ToggleButtonGroup
                                value={propertyDetails.currency}
                                exclusive
                                onChange={handleCurrencyChange}
                                aria-label="currency"
                                sx={{ mt: 2 }}
                            >
                                <ToggleButton value="AED">AED</ToggleButton>
                                <ToggleButton value="USD">USD</ToggleButton>
                            </ToggleButtonGroup>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Орендний дохід (після завершення будівництва)
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Щомісячний орендний дохід"
                                value={propertyDetails.rentalIncome?.monthlyAmount || ''}
                                onChange={(e) => {
                                    const amount = parseFloat(e.target.value);
                                    setPropertyDetails({
                                        ...propertyDetails,
                                        rentalIncome: amount ? {
                                            monthlyAmount: amount,
                                            currency: propertyDetails.currency
                                        } : undefined
                                    });
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            {propertyDetails.currency}
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    </Grid>

                    <Box component="h5" sx={{ mb: 2, fontSize: '1.5rem', fontWeight: 'bold' }}>
                        Графік платежів та покриття
                    </Box>

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Дата</TableCell>
                                    <TableCell>Опис</TableCell>
                                    <TableCell align="right">Сума платежу</TableCell>
                                    <TableCell align="right">Орендний дохід</TableCell>
                                    <TableCell align="right">Прибуток за період</TableCell>
                                    <TableCell align="right">Використано з оренди</TableCell>
                                    <TableCell align="right">Використано з активу</TableCell>
                                    <TableCell align="right">Реінвестовано</TableCell>
                                    <TableCell align="right">Додаткові кошти</TableCell>
                                    <TableCell align="right">Покриття платежу</TableCell>
                                    <TableCell align="right">Вартість активу</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paymentSchedule.map((payment, index) => (
                                    <TableRow 
                                        key={index}
                                        sx={{
                                            backgroundColor: payment.paymentType === 'summary'
                                                ? 'info.main' 
                                                : 'inherit'
                                        }}
                                    >
                                        <TableCell>{format(payment.date, 'dd.MM.yyyy')}</TableCell>
                                        <TableCell>
                                            {payment.description} {propertyDetails.paymentMethod === 'mortgage' && payment.paymentType === 'installment' && '(іпотека)'}
                                        </TableCell>
                                        <TableCell align="right">
                                            {formatCurrency(payment.amount, propertyDetails.currency)}
                                        </TableCell>
                                        <TableCell align="right">
                                            {formatCurrency(payment.rentalIncome, propertyDetails.currency)}
                                        </TableCell>
                                        <TableCell align="right">
                                            {formatCurrency(payment.incomeForPeriod, propertyDetails.currency)}
                                        </TableCell>
                                        <TableCell align="right">
                                            {formatCurrency(payment.rentalAmountUsed, propertyDetails.currency)}
                                        </TableCell>
                                        <TableCell align="right">
                                            {formatCurrency(payment.assetAmountUsed, propertyDetails.currency)}
                                        </TableCell>
                                        <TableCell align="right">
                                            {formatCurrency(payment.reinvestedAmount, propertyDetails.currency)}
                                        </TableCell>
                                        <TableCell 
                                            align="right"
                                            sx={{
                                                color: payment.additionalFundsNeeded ? 'error.main' : 'inherit'
                                            }}
                                        >
                                            {payment.additionalFundsNeeded ? 
                                                formatCurrency(payment.additionalFundsNeeded, propertyDetails.currency) : 
                                                '-'}
                                        </TableCell>
                                        <TableCell 
                                            align="right"
                                            sx={{
                                                color: payment.coverageRatio >= 100 ? 'success.main' : 'error.main'
                                            }}
                                        >
                                            {formatPercentage(payment.coverageRatio)}
                                        </TableCell>
                                        <TableCell align="right">
                                            {formatCurrency(payment.currentAssetValue, propertyDetails.currency)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell colSpan={2}><strong>Загальна сума</strong></TableCell>
                                    <TableCell align="right">
                                        <strong>
                                            {formatCurrency(
                                                paymentSchedule
                                                    .filter(p => p.paymentType !== 'summary')
                                                    .reduce((sum, payment) => sum + payment.amount, 0),
                                                propertyDetails.currency
                                            )}
                                        </strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>
                                            {formatCurrency(
                                                paymentSchedule
                                                    .reduce((sum, payment) => sum + payment.rentalIncome, 0),
                                                propertyDetails.currency
                                            )}
                                        </strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>
                                            {formatCurrency(
                                                paymentSchedule
                                                    .reduce((sum, payment) => sum + payment.incomeForPeriod, 0),
                                                propertyDetails.currency
                                            )}
                                        </strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>
                                            {formatCurrency(
                                                paymentSchedule
                                                    .reduce((sum, payment) => sum + payment.rentalAmountUsed, 0),
                                                propertyDetails.currency
                                            )}
                                        </strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>
                                            {formatCurrency(
                                                paymentSchedule
                                                    .reduce((sum, payment) => sum + payment.assetAmountUsed, 0),
                                                propertyDetails.currency
                                            )}
                                        </strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>
                                            {formatCurrency(
                                                paymentSchedule
                                                    .reduce((sum, payment) => sum + payment.reinvestedAmount, 0),
                                                propertyDetails.currency
                                            )}
                                        </strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>
                                            {formatCurrency(
                                                paymentSchedule
                                                    .filter(p => p.paymentType !== 'summary')
                                                    .reduce((sum, payment) => sum + payment.additionalFundsNeeded, 0),
                                                propertyDetails.currency
                                            )}
                                        </strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>
                                            {formatPercentage(
                                                ((paymentSchedule.reduce((sum, payment) => sum + payment.incomeForPeriod, 0)) /
                                                paymentSchedule
                                                    .filter(p => p.paymentType !== 'summary')
                                                    .reduce((sum, payment) => sum + payment.amount, 0)) * 100
                                            )}
                                        </strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>
                                            {formatCurrency(
                                                paymentSchedule[paymentSchedule.length - 1]?.currentAssetValue || 0,
                                                propertyDetails.currency
                                            )}
                                        </strong>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Container>
        </LocalizationProvider>
    );
};

export default PropertyCalculator; 