##########################################################################################
# File name - app.py
# Author - Ojas Ulhas Dighe
# Date - 12th Feb 2024
# Description - This is the main file for the Mutual Fund Analyzer web application. It uses Flask to create a web server and provides an API endpoint for analyzing mutual funds.
##########################################################################################

from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import requests
from scipy.optimize import newton
from typing import Dict, List, Tuple, Optional
import io
import base64
import logging

##########################################################################################
# Set up logging
# Author - Ojas Ulhas Dighe
# Date - 12th Feb 2024
##########################################################################################

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

##########################################################################################
# Class name - MutualFundAnalyzer
# Author - Ojas Ulhas Dighe
# Date - 12th Feb 2024
# Description - Mutual Fund Analyzer Class to calculate the analysis parameters
##########################################################################################

class MutualFundAnalyzer:
    def __init__(self, risk_free_rate: float = 0.05):
        """
        Initialize the Mutual Fund Analyzer.
        
        Args:
            risk_free_rate (float): Annual risk-free rate (default: 5%)
        """
        self.risk_free_rate = risk_free_rate
        self.nav_data = None
        self.fund_info = None

##########################################################################################
# Function name - fetch_nav_data
# Author - Ojas Ulhas Dighe
# Date - 12th Feb 2024
# Description - Function to fetch the NAV data from the AMFI website
##########################################################################################

    def fetch_nav_data(self, fund_code: str, start_date: str) -> pd.DataFrame:
        """
        Fetch NAV data from AMFI website.
        """
        try:
            url = f"https://api.mfapi.in/mf/{fund_code}"
            response = requests.get(url)
            data = response.json()
            
            if 'data' not in data:
                raise ValueError(f"No data found for fund code {fund_code}")
            
            nav_df = pd.DataFrame(data['data'])
            nav_df['date'] = pd.to_datetime(nav_df['date'], format='%d-%m-%Y')
            # print(nav_df['date'])
            nav_df['nav'] = pd.to_numeric(nav_df['nav'])
            # print(nav_df['nav'] )
            nav_df = nav_df.sort_values('date')
            
            start_date = pd.to_datetime(start_date)
            nav_df = nav_df[nav_df['date'] >= start_date]
            
            self.nav_data = nav_df
            self.fund_info = data['meta']
            
            return nav_df
            
        except Exception as e:
            logger.error(f"Error fetching NAV data: {str(e)}")
            raise

##########################################################################################
# Function name - calculate_rolling_returns
# Author - Ojas Ulhas Dighe
# Date - 12th Feb 2024
# Description - Function to calculate the rolling returns for specified time windows
##########################################################################################

    def calculate_rolling_returns(self, window_days: list) -> dict:
        """Calculate rolling returns for specified time windows."""
        if self.nav_data is None:
            raise ValueError("NAV data not loaded. Call fetch_nav_data first.")
            
        rolling_returns = {}
        
        for days in window_days:
            returns = (self.nav_data['nav'].pct_change(periods=days) * 100)
            rolling_returns[days] = returns
            
        return rolling_returns

##########################################################################################
# Function name - calculate_absolute_returns
# Author - Ojas Ulhas Dighe
# Date - 12th Feb 2024
# Description - Function to calculate the absolute returns
##########################################################################################

    def calculate_absolute_returns(self, start_date: str = None) -> float:
        """Calculate absolute returns."""
        if self.nav_data is None:
            raise ValueError("NAV data not loaded. Call fetch_nav_data first.")
            
        if start_date:
            start_date = pd.to_datetime(start_date)
            data = self.nav_data[self.nav_data['date'] >= start_date]
        else:
            data = self.nav_data
            
        initial_nav = data.iloc[0]['nav']
        final_nav = data.iloc[-1]['nav']
        
        return ((final_nav - initial_nav) / initial_nav) * 100

##########################################################################################
# Function name - calculate_cagr
# Author - Ojas Ulhas Dighe
# Date - 12th Feb 2024
# Description - Function to calculate the Compound Annual Growth Rate (CAGR)
##########################################################################################

    def calculate_cagr(self, start_date: str = None) -> float:
        """Calculate CAGR."""
        if self.nav_data is None:
            raise ValueError("NAV data not loaded. Call fetch_nav_data first.")
            
        if start_date:
            start_date = pd.to_datetime(start_date)
            data = self.nav_data[self.nav_data['date'] >= start_date]
        else:
            data = self.nav_data
            
        years = (data.iloc[-1]['date'] - data.iloc[0]['date']).days / 365.25
        initial_nav = data.iloc[0]['nav']
        final_nav = data.iloc[-1]['nav']
        
        return (((final_nav / initial_nav) ** (1/years)) - 1) * 100
        
##########################################################################################
# Function name - calculate_sharpe_ratio
# Author - Ojas Ulhas Dighe
# Date - 12th Feb 2024
# Description - Function to calculate the Sharpe Ratio
##########################################################################################

    def calculate_sharpe_ratio(self, window_days: int = 252) -> float:
        """Calculate Sharpe Ratio."""
        if self.nav_data is None:
            raise ValueError("NAV data not loaded. Call fetch_nav_data first.")
            
        daily_returns = self.nav_data['nav'].pct_change().dropna()
        excess_returns = daily_returns - (self.risk_free_rate / 252)
        
        sharpe_ratio = np.sqrt(252) * (excess_returns.mean() / excess_returns.std())
        return sharpe_ratio

##########################################################################################
# Function name - generate_recommendation
# Author - Ojas Ulhas Dighe
# Date - 12th Feb 2024
# Description - Function to generate the investment recommendation based on the analysis
##########################################################################################

    def generate_recommendation(self, risk_appetite: str) -> tuple:
        """Generate investment recommendation."""
        if self.nav_data is None:
            raise ValueError("NAV data not loaded. Call fetch_nav_data first.")
            
        sharpe_ratio = self.calculate_sharpe_ratio()
        rolling_returns = self.calculate_rolling_returns([30, 90, 180])
        cagr = self.calculate_cagr()
        
        if risk_appetite == "high":
            if sharpe_ratio > 1 and cagr > 0.12:
                recommendation = "Buy More"
                reason = "Strong risk-adjusted returns and consistent performance"
            elif sharpe_ratio > 0.5 and cagr > 0.08:
                recommendation = "Hold"
                reason = "Stable performance with moderate returns"
            else:
                recommendation = "Exit"
                reason = "Underperforming with poor risk-adjusted returns"
        elif risk_appetite == "medium":
            if sharpe_ratio > 0.8 and cagr > 0.1:
                recommendation = "Buy More"
                reason = "Good risk-adjusted returns and consistent performance"
            elif sharpe_ratio > 0.4 and cagr > 0.06:
                recommendation = "Hold"
                reason = "Stable performance with moderate returns"
            else:
                recommendation = "Exit"
                reason = "Underperforming with poor risk-adjusted returns"
        else:
            recommendation = "Exit"
            reason = "Risk appetite not recognized"
        
        return recommendation, reason

##########################################################################################
# Function name - plot_nav_trend
# Author - Ojas Ulhas Dighe
# Date - 12th Feb 2024
# Description - Function to plot the NAV trend
##########################################################################################

    def plot_nav_trend(self) -> None:
        """Plot NAV trend."""
        if self.nav_data is None:
            raise ValueError("NAV data not loaded. Call fetch_nav_data first.")
            
        plt.figure(figsize=(12, 6))
        plt.plot(self.nav_data['date'], self.nav_data['nav'])
        plt.title(f"NAV Trend - {self.fund_info['scheme_name']}")
        plt.xlabel("Date")
        plt.ylabel("NAV")
        plt.grid(True)
        plt.xticks(rotation=45)
        plt.tight_layout()

##########################################################################################
# Function name - plot_rolling_returns
# Author - Ojas Ulhas Dighe
# Date - 12th Feb 2024
# Description - Function to plot the rolling returns
##########################################################################################

    def plot_rolling_returns(self, window_days: list) -> None:
        """Plot rolling returns."""
        if self.nav_data is None:
            raise ValueError("NAV data not loaded. Call fetch_nav_data first.")
            
        rolling_returns = self.calculate_rolling_returns(window_days)
        
        plt.figure(figsize=(12, 6))
        for days in window_days:
            plt.plot(self.nav_data['date'][days:], 
                    rolling_returns[days][days:],
                    label=f'{days}-day returns')
            
        plt.title("Rolling Returns Analysis")
        plt.xlabel("Date")
        plt.ylabel("Returns (%)")
        plt.legend()
        plt.grid(True)
        plt.xticks(rotation=45)
        plt.tight_layout()

app = Flask(__name__)

##########################################################################################
# Function name - index
# Author - Ojas Ulhas Dighe
# Date - 12th Feb 2024
# Description - Function to render the index.html template
##########################################################################################

@app.route('/')
def index():
    return render_template('index.html')

##########################################################################################
# Function name - analyze
# Author - Ojas Ulhas Dighe
# Date - 12th Feb 2024
# Description - Function to analyze the mutual fund based on the input data
##########################################################################################

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        fund_code = data.get('fundCode')
        start_date = data.get('startDate')
        risk_appetite = data.get('riskAppetite')
        investment_dates = data.get('investmentDates', [])
        investment_amounts = data.get('investmentAmounts', [])

        # Validate required fields
        if not all([fund_code, start_date, risk_appetite]):
            return jsonify({
                'success': False,
                'error': 'Missing required fields: fundCode, startDate, or riskAppetite'
            })
        
        analyzer = MutualFundAnalyzer()
        nav_data = analyzer.fetch_nav_data(fund_code, start_date)
        # Convert nav_data to a list of dictionaries for JSON response
        nav_data_list = [
            {'date': row['date'].strftime('%Y-%m-%d'), 'nav': row['nav']}
            for _, row in nav_data.iterrows()
        ]
        
        absolute_returns = analyzer.calculate_absolute_returns()
        cagr = analyzer.calculate_cagr()
        sharpe_ratio = analyzer.calculate_sharpe_ratio()
        recommendation, reason = analyzer.generate_recommendation(risk_appetite)
        
        nav_plot = generate_plot_base64(analyzer.plot_nav_trend)
        returns_plot = generate_plot_base64(lambda: analyzer.plot_rolling_returns([30, 90, 180]))

        response_data = {
            'success': True,
            'fundName': analyzer.fund_info['scheme_name'],
            'absoluteReturns': round(absolute_returns, 2),
            'cagr': round(cagr, 2),
            'sharpeRatio': round(sharpe_ratio, 2),
            'recommendation': recommendation,
            'reason': reason,
            'navPlot': generate_plot_base64(analyzer.plot_nav_trend),
            # 'navtraind': analyzer.plot_nav_trend,
            # 'nav_date': nav_dict,
            'navData': nav_data_list,
            'returnsPlot': generate_plot_base64(lambda: analyzer.plot_rolling_returns([30, 90, 180]))
        }

        # logger.info(f"Sending response: {response_data}")
        return jsonify(response_data)

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

##########################################################################################
# Function name - generate_plot_base64
# Author - Ojas Ulhas Dighe
# Date - 12th Feb 2024
# Description - Function to generate a base64-encoded plot image
##########################################################################################

def generate_plot_base64(plot_function):
    plt.clf()
    plot_function()
    img = io.BytesIO()
    plt.savefig(img, format='png', bbox_inches='tight')
    img.seek(0)
    return base64.b64encode(img.getvalue()).decode()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)