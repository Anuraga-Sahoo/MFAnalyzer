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
        console.log(data)

        if (!data.success) {
            throw new Error(data.error);
        }

        // Update results
        document.getElementById('fundName').textContent = data.fundName;
        document.getElementById('absoluteReturns').textContent = `${data.absoluteReturns}%`;
        document.getElementById('cagr').textContent = `${data.cagr}%`;
        document.getElementById('sharpeRatio').textContent = data.sharpeRatio;
        
        document.getElementById('recommendationReason').textContent = data.reason;
        // conditional recomendation of color change
        if(data.recommendation.toLowerCase().includes("exit")){
          document.getElementById('recommendationText').textContent = `${data.recommendation}`;
          document.getElementById('recommendationText').style.color = "white"
          document.getElementById('recommendationText').style.background = "rgb(255, 3, 3)"

        }
        else if(data.recommendation.toLowerCase().includes("hold")){
          document.getElementById('recommendationText').textContent = `${data.recommendation}`;
          document.getElementById('recommendationText').style.color = "white"
          document.getElementById('recommendationText').style.background = "rgb(238, 131, 16)"

        }
        else{
          document.getElementById('recommendationText').textContent = `${data.recommendation}`;
          document.getElementById('recommendationText').style.color = "white"
          document.getElementById('recommendationText').style.background = "rgb(32, 139, 57)"

        }

 
        
        // Update plots
        document.getElementById('navPlot').src = `data:image/png;base64,${data.navPlot}`;
        document.getElementById('returnsPlot').src = `data:image/png;base64,${data.returnsPlot}`;

               // update Nav price Chart
               updateChart(data)
        
        // Show results
        document.getElementById('results').classList.remove('hidden');
    } catch (error) {
      console.log(error.message)
      if(error.message === 'single positional indexer is out-of-bounds'){
        // alert(`Error: ${error.message}`);
        const errorpop = document.getElementById('error')
        const errormsg = document.getElementById('errormsg')
        errormsg.innerText = `Fund does not exist for selected Investment Date`
        errorpop.style.display = "flex"


      setInterval(()=>{
         errorpop.style.display = "none"
      },3000)
        // alert("Enter a valid Date")
      }
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
    fundCode.value = 'Fund Code'

    }
  };

  // Function to display search results
  function display(result) {
    if (result.length === 0) {
      resultsBox.innerHTML = "<p class='noresultfound'>No results found</p>";
    //   schemeCodeDisplay.style.display = "none";
     fundCode.value = 'Fund Code'

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

  let infos = document.querySelectorAll('.fa-solid.fa-circle-info')
  console.log(infos)

  infos.forEach((info, index)=>{
    console.log(info)
    info.addEventListener('click', ()=>{
      console.log( typeof(index))
      if(index == 0){
        alert("Absolute Return refers to the Total Return on Investment generates over a specific period, expressed as a percentage of the initial investment. ")
      }
      else if(index === 1){
        alert("CAGR is the Average Annual Growth Rate of an investment over a period of time, assuming the investment grows at a steady rate each year. It helps smooth out fluctuations and provides a more accurate measure of long-term growth.")
      }
      else if(index === 2){
        alert("The Sharpe Ratio is a measure used to evaluate the risk-adjusted return of an investment. It tells you how much excess return you are getting for the extra risk taken compared to a risk-free asset (like government bonds).")
      }
    })
  })




});

  // nav graph
  function updateChart(data) {
    // Function to render the chart with specified period (e.g., '7d', '15d', '30d', '6m', '1y')
    function renderChart(period) {
        // Map period to number of days
        let days;
        switch (period) {
            case '7d': days = 7; break;
            case '15d': days = 15; break;
            case '30d': days = 30; break;
            case '6m': days = 180; break; // Approximate 6 months as 180 days
            case '1y': days = 365; break; // Approximate 1 year as 365 days
            default: days = 7; // Default to 7 days if invalid period
        }

        // Extract nav and date arrays from navData
        const nav = data.navData.map(item => item.nav);
        const navDate = data.navData.map(item => item.date);

        // Get the total number of data points
        const totalNavData = nav.length;

        // Ensure days does not exceed totalNavData
        if (days > totalNavData) {
            days = totalNavData; // Show all data if requested period exceeds available data
        }

        // Slice the last 'days' elements for x and y (most recent data)
        const xData = navDate.slice(-days);
        const yData = nav.slice(-days);

        // Define the trace for the chart
        const traces = [{
            name: 'Nav Chart',
            x: xData,
            y: yData,
            type: 'scatter',
            mode: 'lines', // Ensure line chart (default behavior)
            line: { color: '#16a34a' }
        }];

        // Define the layout
        const layout = {
            title: `Nav Chart - Last ${period}`,
            autosize: true,
            paper_bgcolor: '#141414',
            plot_bgcolor: '#141414',
            font: { color: 'white' },
            xaxis: { title: 'Date' },
            yaxis: { title: 'NAV' },
            showlegend: true,
            legend: { orientation: 'h', y: -0.2 }
        };

        // Render the chart
        Plotly.newPlot('navChart', traces, layout);
    }

    // Select radio buttons
    const sevenDay = document.getElementById("7d");
    const fifteenDay = document.getElementById("15d");
    const thirtyDay = document.getElementById("30d");
    const sixMonth = document.getElementById("6m");
    const oneYear = document.getElementById("1y");

    // Event listeners for radio buttons
    sevenDay.addEventListener("click", () => {
        renderChart('7d');
    });

    fifteenDay.addEventListener("click", () => {
        renderChart('15d');
    });

    thirtyDay.addEventListener("click", () => {
        renderChart('30d');
    });

    sixMonth.addEventListener("click", () => {
        renderChart('6m');
    });

    oneYear.addEventListener("click", () => {
        renderChart('1y');
    });

    // Set default to 7 days
    oneYear.checked = true; // Ensure 7d is checked by default
    renderChart('1y'); // Render chart with 7 days initially
}