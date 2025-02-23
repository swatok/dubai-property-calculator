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
import { PaymentSchedule, PropertyDetails, DEFAULT_PAYMENT_PLANS, Currency, CURRENCY_CONVERSION } from '../types/types';
import { calculatePaymentSchedule, formatCurrency, formatPercentage } from '../utils/calculatePayments';

const PropertyCalculator: React.FC = () => {
    const [propertyDetails, setPropertyDetails] = useState<PropertyDetails>({
        price: 1000000,
        completionDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
        selectedPlan: DEFAULT_PAYMENT_PLANS[0],
        currency: 'AED',
        assetIncome: {
            initialAmount: 0,
            apr: 0,
            currency: 'AED'
        }
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
                            <FormControl fullWidth>
                                <InputLabel>План оплати</InputLabel>
                                <Select
                                    value={propertyDetails.selectedPlan.name}
                                    label="План оплати"
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
                                    <TableCell align="right">Прибуток за період</TableCell>
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
                                            backgroundColor: payment.description === 'Загальна сума додаткових коштів' 
                                                ? 'error.main' 
                                                : 'inherit'
                                        }}
                                    >
                                        <TableCell>{format(payment.date, 'dd.MM.yyyy')}</TableCell>
                                        <TableCell>{payment.description}</TableCell>
                                        <TableCell align="right">
                                            {formatCurrency(payment.amount, propertyDetails.currency)}
                                        </TableCell>
                                        <TableCell align="right">
                                            {formatCurrency(payment.incomeForPeriod || 0, propertyDetails.currency)}
                                        </TableCell>
                                        <TableCell align="right">
                                            {formatCurrency(payment.assetAmountUsed || 0, propertyDetails.currency)}
                                        </TableCell>
                                        <TableCell align="right">
                                            {formatCurrency(payment.reinvestedAmount || 0, propertyDetails.currency)}
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
                                                color: (payment.coverageRatio || 0) >= 100 ? 'success.main' : 'error.main'
                                            }}
                                        >
                                            {formatPercentage(payment.coverageRatio || 0)}
                                        </TableCell>
                                        <TableCell align="right">
                                            {formatCurrency(payment.currentAssetValue || 0, propertyDetails.currency)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell colSpan={2}><strong>Загальна сума</strong></TableCell>
                                    <TableCell align="right">
                                        <strong>
                                            {formatCurrency(
                                                paymentSchedule
                                                    .filter(p => p.description !== 'Загальна сума додаткових коштів')
                                                    .reduce((sum, payment) => sum + payment.amount, 0),
                                                propertyDetails.currency
                                            )}
                                        </strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>
                                            {formatCurrency(
                                                paymentSchedule.reduce((sum, payment) => sum + (payment.incomeForPeriod || 0), 0),
                                                propertyDetails.currency
                                            )}
                                        </strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>
                                            {formatCurrency(
                                                paymentSchedule.reduce((sum, payment) => sum + (payment.assetAmountUsed || 0), 0),
                                                propertyDetails.currency
                                            )}
                                        </strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>
                                            {formatCurrency(
                                                paymentSchedule.reduce((sum, payment) => sum + (payment.reinvestedAmount || 0), 0),
                                                propertyDetails.currency
                                            )}
                                        </strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>
                                            {formatCurrency(
                                                paymentSchedule
                                                    .filter(p => p.description !== 'Загальна сума додаткових коштів')
                                                    .reduce((sum, payment) => sum + (payment.additionalFundsNeeded || 0), 0),
                                                propertyDetails.currency
                                            )}
                                        </strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>
                                            {formatPercentage(
                                                (paymentSchedule.reduce((sum, payment) => sum + (payment.incomeForPeriod || 0), 0) /
                                                paymentSchedule
                                                    .filter(p => p.description !== 'Загальна сума додаткових коштів')
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