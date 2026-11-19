const form = document.getElementById('currency-form');
const amountInput = document.getElementById('amount-input');
const directionInput = document.getElementById('conversion-direction');
const statusMessage = document.getElementById('status');
const resultsSection = document.getElementById('results');
const resultList = document.getElementById('result-list');
const submitButton = form.querySelector('button[type="submit"]');

function formatCurrency(value, currency) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(value);
}

function showResults(data, amount, from, to) {
  if (!Number.isFinite(data.result) || !Number.isFinite(data.rate) || typeof data.asOf !== 'string') {
    throw new Error('Toolalize returned an invalid conversion result.');
  }

  const updatedAt = new Date(data.asOf);
  if (Number.isNaN(updatedAt.getTime())) {
    throw new Error('Toolalize returned an invalid exchange-rate timestamp.');
  }

  const fields = [
    ['Converted amount', formatCurrency(data.result, to)],
    ['Exchange rate', `1 ${from} = ${new Intl.NumberFormat(undefined, { maximumSignificantDigits: 8 }).format(data.rate)} ${to}`],
    ['Rate last updated', updatedAt.toLocaleString()],
  ];

  resultList.replaceChildren();
  for (const [label, value] of fields) {
    const term = document.createElement('dt');
    term.textContent = label;
    const description = document.createElement('dd');
    description.textContent = value;
    resultList.append(term, description);
  }

  resultsSection.hidden = false;
  statusMessage.textContent = `${formatCurrency(amount, from)} converted to ${formatCurrency(data.result, to)}.`;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  resultsSection.hidden = true;
  statusMessage.textContent = 'Converting currency…';
  submitButton.disabled = true;

  try {
    const amount = Number(amountInput.value);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error('Enter a valid amount of zero or more.');
    }

    const [from, to] = directionInput.value.split('-');
    const url = new URL('https://toolalize.com/api/convert/currency');
    url.search = new URLSearchParams({
      value: String(amount),
      from,
      to,
    });

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || `Conversion failed (${response.status}).`);
    }
    if (!data || typeof data !== 'object' || data.ok !== true) {
      throw new Error(data?.error || 'Toolalize returned an invalid conversion response.');
    }

    showResults(data, amount, from, to);
  } catch (error) {
    statusMessage.textContent = error instanceof TypeError
      ? 'Could not reach Toolalize. Check your connection and try again.'
      : `Unable to convert currency: ${error.message}`;
  } finally {
    submitButton.disabled = false;
  }
});
