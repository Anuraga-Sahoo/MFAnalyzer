/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// File name - static/script.js
// Author - Ojas Ulhas Dighe
// Date - 2nd Feb 2024
// Description - This file contains the client-side JavaScript code for the web application.
/////////////////////////////////////////////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Function name - analyzeFund
// Author - Ojas Ulhas Dighe
// Date - 2nd Feb 2024
// Description - This function sends a POST request to the server to analyze the fund with the given fund code, start date, and risk appetite.
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function analyzeFund() {
    const fundCode = document.getElementById('fundCode').value;
    const startDate = document.getElementById('startDate').value;
    const riskAppetite = document.getElementById('riskAppetite').value;

    if (!fundCode || !startDate || !riskAppetite) {
        alert('Please fill in all fields');
        return;
    }


    // Show loader and hide results
    document.getElementById('loader').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');

    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fundCode,
                startDate,
                riskAppetite
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error);
        }

        // Update results
        document.getElementById('fundName').textContent = data.fundName;
        document.getElementById('absoluteReturns').textContent = `${data.absoluteReturns}%`;
        document.getElementById('cagr').textContent = `${data.cagr}%`;
        document.getElementById('sharpeRatio').textContent = data.sharpeRatio;
        document.getElementById('recommendationText').textContent = `${data.recommendation}`;
        document.getElementById('recommendationReason').textContent = data.reason;

        // Update plots
        document.getElementById('navPlot').src = `data:image/png;base64,${data.navPlot}`;
        document.getElementById('returnsPlot').src = `data:image/png;base64,${data.returnsPlot}`;

        // Show results
        document.getElementById('results').classList.remove('hidden');
    } catch (error) {
        alert(`Error: ${error.message}`);
    } finally {
        // Hide loader
        document.getElementById('loader').classList.add('hidden');
    }
}

// Set default start date to 1 year ago
document.addEventListener('DOMContentLoaded', () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    document.getElementById('startDate').valueAsDate = oneYearAgo;
});