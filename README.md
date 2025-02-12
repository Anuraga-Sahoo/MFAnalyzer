# Mutual Fund Analyzer Pro

Mutual Fund Analyzer Pro is a web application that allows users to analyze mutual funds based on their performance metrics. The application provides investment recommendations based on the user's risk appetite.

## Features

- Fetches NAV data from the AMFI website.
- Calculates various performance metrics such as absolute returns, CAGR, and Sharpe Ratio.
- Generates investment recommendations based on the user's risk appetite.
- Plots NAV trends and rolling returns.
- Provides a user-friendly interface for inputting mutual fund details and viewing analysis results.

## Project Structure

```
Mutual Fund Analyzer Pro/
├── __pycache__/
├── app.py
├── static/
│   ├── script.js
│   └── style.css
└── templates/
    └── index.html
```

- 

app.py

: Main file for the web application. It uses Flask to create a web server and provides an API endpoint for analyzing mutual funds.
- 

script.js

: Contains the client-side JavaScript code for the web application.
- 

style.css

: Contains the CSS styles for the web application.
- 

index.html

: HTML template for the web application's user interface.

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/mutual-fund-analyzer-pro.git
    cd mutual-fund-analyzer-pro
    ```

2. Create a virtual environment and activate it:
    ```sh
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

3. Install the required dependencies:
    ```sh
    pip install -r requirements.txt
    ```

## Usage

1. Run the Flask application:
    ```sh
    python app.py
    ```

2. Open your web browser and navigate to `http://localhost:5000`.

3. Enter the mutual fund code, start date, and risk appetite in the input form and click "Analyze Fund".

4. View the analysis results, including performance metrics, investment recommendations, and plots.

## API Endpoints

### `GET /`

Renders the 

index.html

 template.

### `POST /analyze`

Analyzes the mutual fund based on the input data.

#### Request Body

```json
{
    "fundCode": "string",
    "startDate": "string",
    "riskAppetite": "string"
}
```

#### Response

```json
{
    "success": true,
    "fundName": "string",
    "absoluteReturns": float,
    "cagr": float,
    "sharpeRatio": float,
    "recommendation": "string",
    "reason": "string",
    "navPlot": "base64-encoded string",
    "returnsPlot": "base64-encoded string"
}
```

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Author

Ojas Ulhas Dighe

## Acknowledgements

- [Flask](https://flask.palletsprojects.com/)
- [Pandas](https://pandas.pydata.org/)
- [NumPy](https://numpy.org/)
- [Matplotlib](https://matplotlib.org/)
- [Seaborn](https://seaborn.pydata.org/)
- [scipy.optimize](https://docs.scipy.org/doc/scipy/reference/optimize.html)

Feel free to contribute to this project by submitting issues or pull requests.
