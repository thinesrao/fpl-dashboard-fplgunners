"""
FPL Dashboard Configuration Template

Copy this file to config.py and update with your league information.
This file contains all the configuration settings for your FPL dashboard.
"""

# =============================================================================
# LEAGUE CONFIGURATION
# =============================================================================

# Your Classic League ID (found in the URL when viewing your league)
CLASSIC_LEAGUE_ID = 123456

# Your Head-to-Head League ID (if you have one)
H2H_LEAGUE_ID = 789012

# Your FPL Challenge League ID (if participating)
FPL_CHALLENGE_LEAGUE_ID = 345678

# Your Google Sheet name (create this in Google Sheets)
GOOGLE_SHEET_NAME = "FPL-Data-YourLeague"

# =============================================================================
# GOOGLE SHEETS SETUP
# =============================================================================

# Required worksheets in your Google Sheet:
REQUIRED_WORKSHEETS = [
    "Classic League",
    "H2H League", 
    "FPL Challenge",
    "Shooting Stars",
    "Transfer King",
    "Defensive King",
    "Bench King",
    "Dream Team",
    "Penalty King",
    "Best Captain",
    "Best VC",
    "Time Machine"
]

# =============================================================================
# API ENDPOINTS (Usually no need to change these)
# =============================================================================

FPL_API_URL = "https://fantasy.premierleague.com/api/"
FPL_CHALLENGE_API_URL = "https://fplchallenge.premierleague.com/api/"

# =============================================================================
# CUSTOMIZATION OPTIONS
# =============================================================================

# Update frequency (in minutes) - how often to fetch new data
UPDATE_FREQUENCY = 60

# Enable/disable specific features
ENABLE_FPL_CHALLENGE = True  # Set to False if not participating
ENABLE_H2H_LEAGUE = True    # Set to False if no H2H league
ENABLE_CUP_TRACKING = True  # Set to False if not interested in cup

# Custom award weights (optional - modify these to change scoring)
AWARD_WEIGHTS = {
    'shooting_stars': 1.0,      # Rank improvement
    'transfer_king': 1.0,       # Transfer performance
    'defensive_king': 1.0,      # Defensive contributions
    'bench_king': 0.5,          # Bench performance (lower weight)
    'dream_team': 2.0,          # Perfect lineup (higher weight)
    'penalty_king': 1.0,        # Penalty management
    'best_captain': 1.5,        # Captain decisions
    'best_vc': 1.0              # Vice-captain performance
}

# =============================================================================
# STREAMLIT DASHBOARD CONFIGURATION
# =============================================================================

# Dashboard title and description
DASHBOARD_TITLE = "🏆 FPL Dashboard"
DASHBOARD_DESCRIPTION = "Your Fantasy Premier League Analytics Hub"

# Page configuration
PAGE_CONFIG = {
    "page_title": "FPL Dashboard",
    "page_icon": "🏆",
    "layout": "wide",
    "initial_sidebar_state": "expanded"
}

# =============================================================================
# DEPLOYMENT SETTINGS
# =============================================================================

# For GitHub Actions workflow
WORKFLOW_SCHEDULE = "0 */6 * * *"  # Every 6 hours (cron format)

# For Streamlit Cloud deployment
STREAMLIT_CONFIG = {
    "server.port": 8501,
    "server.address": "0.0.0.0",
    "browser.gatherUsageStats": False
}

# =============================================================================
# INSTRUCTIONS FOR SETUP
# =============================================================================

"""
SETUP INSTRUCTIONS:

1. COPY THIS FILE:
   cp config_template.py config.py

2. UPDATE YOUR LEAGUE IDs:
   - Go to your FPL league page
   - Copy the ID from the URL
   - Update CLASSIC_LEAGUE_ID, H2H_LEAGUE_ID, etc.

3. CREATE GOOGLE SHEET:
   - Create a new Google Sheet
   - Name it according to GOOGLE_SHEET_NAME
   - Create all required worksheets (see REQUIRED_WORKSHEETS)

4. SET UP GOOGLE SERVICE ACCOUNT:
   - Go to Google Cloud Console
   - Create service account
   - Download JSON credentials
   - Share your Google Sheet with the service account email

5. UPDATE data_pipeline.py:
   - Replace the hardcoded values with imports from config.py
   - Example: from config import CLASSIC_LEAGUE_ID

6. DEPLOY:
   - Push to GitHub
   - Set up GitHub Actions with GCP_CREDENTIALS secret
   - Deploy to Streamlit Cloud

For detailed instructions, see README.md
"""
