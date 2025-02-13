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
      loader.style.display = "flex";
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
      loader.style.display = "none";


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





// ===================================================
let selectInput; // Declare the function in the global scope

document.addEventListener("DOMContentLoaded", () => {
  const resultsBox = document.querySelector(".result-box");
  const inputBox = document.getElementById("input-box");
  const fundCode = document.getElementById('fundCode')
//   const schemeCodeDisplay = document.getElementById("scheme-code-display");
  const loader = document.getElementById("loader");

  let availableKeywords = []; // This will hold the data from the API
  let worker;

  // Create a Blob URL for the worker script
  const workerScript = `
function wildcardToRegex(wildcard) {
  let pattern = wildcard
    .replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&') // Escape special characters
    .replace(/\\*/g, '.*') // Convert * to regex wildcard
    .replace(/\\?/g, '.'); // Convert ? to match any single character

  return new RegExp(pattern, 'i'); // Case-insensitive search
}

self.onmessage = function (e) {
  const { data, query } = e.data;
  if (!query) {
    self.postMessage([]);
    return;
  }

  const trimmedQuery = query.trim();
  let filteredResults = [];

  if (trimmedQuery.includes('*') || trimmedQuery.includes('?')) {
    // Handle wildcard search
    const regex = wildcardToRegex(trimmedQuery);
    filteredResults = data.filter(item => regex.test(item.schemeName));
  } else {
    // Handle normal prefix-based search
    const prefix = trimmedQuery.toLowerCase();
    filteredResults = data.filter(item => 
      item.schemeName.toLowerCase().startsWith(prefix)
    );
  }

  self.postMessage(filteredResults.slice(0, 10)); // Limit to 10 results
};
`;

  const blob = new Blob([workerScript], { type: "application/javascript" });
  const workerUrl = URL.createObjectURL(blob);

  // Initialize the Web Worker
  if (window.Worker) {
    worker = new Worker(workerUrl);
    worker.onmessage = (e) => {
      if (
        e.data.length === 1 &&
        e.data[0].schemeName.toLowerCase() === inputBox.value.toLowerCase()
      ) {
        // schemeCodeDisplay.style.display = "flex";
        fundCode.value = Number(e.data[0].schemeCode)
        // schemeCodeDisplay.innerHTML = `<p class="code"><span>Scheme Code :</span> <strong>${e.data[0].schemeCode}</strong></p>`;
        resultsBox.innerHTML = ""; // Clear results box when a single match is found
      } else {
        display(e.data);
      }
    };
  }

  // Fetch data from the API
  async function getDataFromAPI() {
    try {
      loader.style.display = "flex";
      const response = await fetch("https://api.mfapi.in/mf");
      availableKeywords = await response.json();
      console.log("Data fetched successfully");
      loader.style.display = "none";
    } catch (error) {
      console.log("Error fetching data:", error);
    }
  }

  getDataFromAPI();

  // Handle input keyup event
  inputBox.onkeyup = function () {
    const input = inputBox.value;
    if (input.length && worker) {
    //   schemeCodeDisplay.style.display = "none";
    
      worker.postMessage({ data: availableKeywords, query: input.trim() });
    } else {
      resultsBox.innerHTML = "";
    //   schemeCodeDisplay.style.display = "none";
    fundCode.value = ' '

    }
  };

  // Function to display search results
  function display(result) {
    if (result.length === 0) {
      resultsBox.innerHTML = "<p class='noresultfound'>No results found</p>";
    //   schemeCodeDisplay.style.display = "none";
     fundCode.value = ' '

      return;
    }
    const content = result.map((list) => {
      return `<li data-scheme-code="${list.schemeCode}" data-scheme-name="${list.schemeName}">${list.schemeName}</li>`;
    });
    resultsBox.innerHTML = "<ul>" + content.join("") + "</ul>";

    // Add click event listeners to the list items
    const listItems = resultsBox.querySelectorAll("li");
    listItems.forEach(item => {
      item.addEventListener("click", function() {
        selectInput(item.dataset.schemeCode, item.dataset.schemeName);
      });
    });
  }

  // Function to select a scheme and display the schemeCode
  selectInput = function(schemeCode, schemeName) {
    inputBox.value = schemeName;
    // schemeCodeDisplay.style.display = "flex";
    resultsBox.innerHTML = "";
    console.log(typeof(schemeCode))
    fundCode.value = schemeCode
    // schemeCodeDisplay.innerHTML = `<p class="code"><span>Scheme Code :</span> <strong>${schemeCode}</strong></p>`;
  }
});