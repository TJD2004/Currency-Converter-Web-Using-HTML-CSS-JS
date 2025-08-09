// API Configuration
const BASE_URL = "https://v6.exchangerate-api.com/v6/84429bef2d34fdcd28034bed/latest";

// DOM Elements
const converterForm = document.getElementById('converterForm');
const fromAmountInput = document.getElementById('fromAmount');
const toAmountInput = document.getElementById('toAmount');
const fromCurrencySelect = document.getElementById('fromCurrency');
const toCurrencySelect = document.getElementById('toCurrency');
const swapButton = document.getElementById('swapButton');
const convertButton = document.getElementById('convertButton');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const exchangeRateDiv = document.getElementById('exchangeRate');

// Global variables
let exchangeRates = null;
let currentBaseCurrency = '';

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    populateCurrencyOptions();
    setupEventListeners();
    convertCurrency();
});

// Populate currency select options
function populateCurrencyOptions() {
    const currencies = Object.keys(countryList).sort();
    
    currencies.forEach(currency => {
        const countryCode = countryList[currency];
        const currencyName = currencyNames[currency] || currency;
        
        // Create option for "from" currency
        const fromOption = document.createElement('option');
        fromOption.value = currency;
        fromOption.textContent = `${currency} - ${currencyName}`;
        fromCurrencySelect.appendChild(fromOption);
        
        // Create option for "to" currency
        const toOption = document.createElement('option');
        toOption.value = currency;
        toOption.textContent = `${currency} - ${currencyName}`;
        toCurrencySelect.appendChild(toOption);
    });
    
    // Set default values
    fromCurrencySelect.value = 'USD';
    toCurrencySelect.value = 'EUR';
}

// Setup event listeners
function setupEventListeners() {
    converterForm.addEventListener('submit', handleConvert);
    swapButton.addEventListener('click', handleSwap);
    fromCurrencySelect.addEventListener('change', handleCurrencyChange);
    fromAmountInput.addEventListener('input', handleAmountChange);
    
    // Format number input to prevent invalid values
    fromAmountInput.addEventListener('keypress', function(event) {
        const char = String.fromCharCode(event.which);
        const value = event.target.value;
        
        // Allow only numbers, one decimal point, and backspace
        if (!/[0-9.]/.test(char) && event.which !== 8) {
            event.preventDefault();
            return;
        }
        
        // Prevent multiple decimal points
        if (char === '.' && value.includes('.')) {
            event.preventDefault();
        }
    });
}

// Fetch exchange rates from API
async function fetchExchangeRates(baseCurrency) {
    const URL = `${BASE_URL}/${baseCurrency.toLowerCase()}`;
    
    try {
        const response = await fetch(URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.result === 'success') {
            return data.conversion_rates;
        } else {
            throw new Error(data['error-type'] || 'Unknown API error');
        }
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        throw error;
    }
}

// Convert currency
async function convertCurrency() {
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;
    const amount = parseFloat(fromAmountInput.value);

    if (!amount || amount <= 0) {
        toAmountInput.value = '';
        exchangeRateDiv.textContent = '';
        return;
    }

    showLoading(true);
    hideError();

    try {
        // Only fetch new rates if base currency changed
        if (currentBaseCurrency !== fromCurrency) {
            exchangeRates = await fetchExchangeRates(fromCurrency);
            currentBaseCurrency = fromCurrency;
        }

        if (exchangeRates && exchangeRates[toCurrency]) {
            const rate = exchangeRates[toCurrency];
            const convertedAmount = (amount * rate).toFixed(2);
            
            toAmountInput.value = convertedAmount;
            
            // Show exchange rate
            exchangeRateDiv.textContent = `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
        } else {
            throw new Error('Exchange rate not available');
        }
    } catch (error) {
        showError(`Failed to convert currency: ${error.message}`);
        toAmountInput.value = '';
        exchangeRateDiv.textContent = '';
    } finally {
        showLoading(false);
    }
}

// Event handlers
function handleConvert(event) {
    event.preventDefault();
    convertCurrency();
}

function handleSwap() {
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;
    const fromAmount = fromAmountInput.value;
    const toAmount = toAmountInput.value;

    // Swap currencies
    fromCurrencySelect.value = toCurrency;
    toCurrencySelect.value = fromCurrency;

    // Swap amounts if there's a converted amount
    if (toAmount) {
        fromAmountInput.value = toAmount;
    }

    // Convert with new values
    convertCurrency();
}

function handleCurrencyChange() {
    convertCurrency();
}

function handleAmountChange() {
    // Add small delay to avoid too many API calls while typing
    clearTimeout(window.convertTimeout);
    window.convertTimeout = setTimeout(convertCurrency, 500);
}

// Utility functions
function showLoading(show) {
    if (show) {
        loadingDiv.style.display = 'block';
        convertButton.disabled = true;
    } else {
        loadingDiv.style.display = 'none';
        convertButton.disabled = false;
    }
}

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideError() {
    errorDiv.style.display = 'none';
}