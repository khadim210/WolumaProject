export const AVAILABLE_CURRENCIES = [
  { code: 'XOF', name: 'Franc CFA (XOF)', symbol: 'FCFA' },
  { code: 'EUR', name: 'Euro (EUR)', symbol: '€' },
  { code: 'USD', name: 'Dollar américain (USD)', symbol: '$' },
  { code: 'GBP', name: 'Livre sterling (GBP)', symbol: '£' },
  { code: 'CHF', name: 'Franc suisse (CHF)', symbol: 'CHF' },
  { code: 'CAD', name: 'Dollar canadien (CAD)', symbol: 'C$' },
  { code: 'JPY', name: 'Yen japonais (JPY)', symbol: '¥' },
  { code: 'CNY', name: 'Yuan chinois (CNY)', symbol: '¥' },
];

export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = AVAILABLE_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
};

export const formatCurrency = (amount: number, currencyCode: string = 'XOF'): string => {
  const symbol = getCurrencySymbol(currencyCode);

  const formattedAmount = amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  if (currencyCode === 'XOF' || currencyCode === 'CHF') {
    return `${formattedAmount} ${symbol}`;
  }

  return `${symbol}${formattedAmount}`;
};
