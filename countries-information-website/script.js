const EXCHANGE_RATE_API_KEY = '';
const CALENDARIFIC_API_KEY = '';

let countries = [];

async function loadCountries() {
const res = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,currencies,flags,population,capital,region,languages,timezones');
countries = await res.json();
countries.sort((a, b) => a.name.common.localeCompare(b.name.common));
const select = document.getElementById('countrySelect');
select.innerHTML = countries
    .map(c => `<option value="${c.cca2}">${c.name.common}</option>`)
    .join('');
}

function formatNumber(num) {
return num?.toLocaleString() || 'N/A';
}

async function loadCountryData() {
const select = document.getElementById('countrySelect');
const countryCode = select.value;
const country = countries.find(c => c.cca2 === countryCode);
if (!country) {
    alert('Select a valid country');
    return;
}
const output = document.getElementById('output');
output.innerHTML = '<p>Loading data...</p>';

try {
    const flag = country.flags?.png || '';
    const capital = country.capital?.[0] || 'N/A';
    const region = country.region || 'N/A';
    const population = country.population || null;
    const languages = country.languages
    ? Object.values(country.languages).join(', ')
    : 'N/A';
    const currencies = country.currencies
    ? Object.values(country.currencies)
        .map(c => `${c.name} (${c.symbol || ''})`)
        .join(', ')
    : 'N/A';

    // Exchange rate to USD
    let exchangeRatesText = 'N/A';
    if (country.currencies) {
    const currencyCode = Object.keys(country.currencies)[0];
    const exchangeRes = await fetch(
        `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/latest/${currencyCode}`
    );
    const exchangeData = await exchangeRes.json();
    if (
        exchangeData.result === 'success' &&
        exchangeData.conversion_rates?.USD
    ) {
        const rate = exchangeData.conversion_rates.USD;
        exchangeRatesText = `1 ${currencyCode} = ${rate.toFixed(4)} USD`;
    }
    }

    // Timezone & local time
    let timeZoneText = 'N/A';
    if (country.timezones?.length) {
    try {
        const timezone = country.timezones[0];
        const timeRes = await fetch(
        `https://worldtimeapi.org/api/timezone/${timezone}`
        );
        const timeData = await timeRes.json();
        if (timeData.utc_offset && timeData.datetime) {
        timeZoneText = `UTC offset ${timeData.utc_offset}, local time: ${new Date(timeData.datetime).toLocaleString()}`;
        }
    } catch {
        timeZoneText = 'Failed to retrieve time info';
    }
    }


    // Public holidays
    let holidaysText = 'API key required or no data available.';
    if (CALENDARIFIC_API_KEY) {
    const year = new Date().getFullYear();
    const calRes = await fetch(
        `https://calendarific.com/api/v2/holidays?api_key=${CALENDARIFIC_API_KEY}&country=${countryCode.toLowerCase()}&year=${year}`
    );
    const calData = await calRes.json();
    if (calData?.response?.holidays?.length) {
        holidaysText = calData.response.holidays
        .slice(0, 5)
        .map(h => `${h.name} (${h.date.iso})`)
        .join('<br>');
    } else {
        holidaysText = 'No holiday data found.';
    }
    }

    // Urban population %
    const wbRes = await fetch(
    `https://api.worldbank.org/v2/country/${countryCode}/indicator/SP.URB.TOTL.IN.ZS?format=json&date=2021`
    );
    const wbData = await wbRes.json();
    const urbanPop =
    wbData?.[1]?.[0]?.value !== null && wbData?.[1]?.[0]?.value !== undefined
        ? wbData[1][0].value.toFixed(1) + '%'
        : 'N/A';

    // Wikipedia summary (to get religion, parse summary text)
    const wikiRes = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        country.name.common
    )}`
    );
    const wikiData = await wikiRes.json();

    // Try to extract religion info (basic heuristic)
    let religionInfo = '';
    const relRegex = /religion[s]?:\s?([^\.\n]+)/i;
    if (wikiData.extract) {
    const match = wikiData.extract.match(relRegex);
    religionInfo = match ? match[1] : '';
    }

    output.innerHTML = `
    <div class="section">
        <h2>General Information ${flag ? `<img src="${flag}" alt="Flag of ${country.name.common}" class="flag" />` : ''}</h2>
        <p><strong>Capital:</strong> ${capital}</p>
        <p><strong>Region:</strong> ${region}</p>
        <p><strong>Population:</strong> ${population ? formatNumber(population) : 'N/A'}</p>
        <p><strong>Languages:</strong> ${languages}</p>
        <p><strong>Currencies:</strong> ${currencies}</p>
        <p><strong>Exchange Rate:</strong> ${exchangeRatesText}</p>
        ${religionInfo ? `<p><strong>Religion(s):</strong> ${religionInfo}</p>` : ''}
    </div>


    <div class="section">
        <h2>Public Holidays</h2>
        <p>Next upcoming public holidays (top 5):</p>
        <p>${holidaysText}</p>
    </div>

    <div class="section">
        <h2>Urban Population</h2>
        <p>Percentage of population living in urban areas (2021 data):</p>
        <p><strong>${urbanPop}</strong></p>
    </div>

    <div class="section">
        <h2>About ${country.name.common}</h2>
        <p>${wikiData.extract || 'No summary available.'}</p>
        <p><a href="${wikiData.content_urls?.desktop.page}" target="_blank" rel="noopener noreferrer">Read more on Wikipedia</a></p>
    </div>
    `;
} catch (e) {
    output.innerHTML = `<p style="color:red">Error loading data: ${e.message}</p>`;
    console.error(e);
}
}

loadCountries();