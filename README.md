# 🏆 FPL Dashboard - Fantasy Premier League Analytics

A comprehensive Fantasy Premier League dashboard that provides detailed analytics, awards, and insights for your mini-league. Built with **Next.js** (deployed on **Vercel**), a **Python** data pipeline, and **Google Sheets**.

![FPL Dashboard](https://img.shields.io/badge/FPL-Dashboard-blue)
![Next.js](https://img.shields.io/badge/Next.js-Vercel-black)
![Python](https://img.shields.io/badge/Python-3.11+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Dashboard (Next.js on Vercel)

The live dashboard is built with **Next.js**, deployed on **Vercel**. It covers
the standings/awards/champion-plate view, plus a gameweek report image
generator (poster + adaptive caption + share links).

The new app is fed by `data/dashboard.json` (and `data/champions.json`),
committed to this repo by a **gated, hourly GitHub Action**
(`.github/workflows/run_fpl_pipeline.yml`): it runs the existing
`data_pipeline.py`, then a snapshot builder (`build_snapshot.py`) that only
writes a new `data/dashboard.json` when a new gameweek has gone final. Each
commit to `data/dashboard.json` triggers an auto-deploy on Vercel, so the
dashboard's data is always driven by a plain committed JSON file rather than
a live database.

The **Streamlit app has been retired** in favor of the Next.js dashboard.
Its source (`app.py`, `.streamlit/config.toml`) has been removed from the
working tree — it remains in git history for reference. The sections below
that mention the Streamlit app are historical; new work targets the Next.js
app. (The Streamlit Community Cloud deployment must be deleted from the
Streamlit dashboard separately.)

See **[docs/DEPLOY.md](docs/DEPLOY.md)** for the full Vercel setup and
handoff checklist (domain config, GitHub Actions permissions, verifying the
data → commit → deploy loop, and known limitations).

## ✨ Features (Streamlit app)

### 📊 **League Analytics**
- **Classic League Standings** - Track overall performance
- **Head-to-Head League** - Monitor H2H matchups
- **FPL Challenge Integration** - Special challenge tracking
- **Cup Status** - Knockout tournament progress

### 🏅 **Awards System**
- **🎯 Shooting Stars** - Rank improvement tracking
- **🔄 Transfer King** - Best transfer decisions
- **🛡️ Defensive King** - Defensive contributions
- **💺 Bench King** - Bench player performance
- **⭐ Dream Team** - Perfect lineup selections
- **🎲 Penalty King** - Penalty point management
- **👑 Best Captain** - Captaincy decisions
- **🔄 Best Vice-Captain** - Vice-captain performance

### 📈 **Advanced Analytics**
- **Time Machine Rankings** - Historical rank tracking
- **Transfer Analysis** - In/out player performance
- **Chip Usage Tracking** - Wildcard, Free Hit, etc.
- **Live Data Integration** - Real-time updates

### 🏆 **Awards System**
The dashboard includes 15+ custom awards to make your mini-league more competitive:
- **Performance Awards**: Golden Boot, Playmaker, Defensive King
- **Strategic Awards**: Transfer King, Best Captain, Steady King
- **Luck Awards**: Dream Team King, Penalty King, Shooting Stars
- **Monthly Competitions**: Classic and H2H monthly standings

📖 **For detailed award explanations, see [AWARDS_GUIDE.md](AWARDS_GUIDE.md)**

## 🚀 Quick Start (Streamlit app — being retired)

### Option 1: Use Template (Recommended)
1. Click **"Use this template"** button on GitHub
2. Create your own repository
3. Follow the setup guide below

### Option 2: Clone Repository
```bash
git clone https://github.com/your-username/fpl-dashboard-streamlit.git
cd fpl-dashboard-streamlit
```

## ⚙️ Setup Guide

### 1. **Configure Your League IDs**

Edit `data_pipeline.py` and update these variables:

```python
# --- Configuration ---
CLASSIC_LEAGUE_ID = 123456        # Your classic league ID
H2H_LEAGUE_ID = 789012           # Your H2H league ID  
FPL_CHALLENGE_LEAGUE_ID = 345678   # Your FPL Challenge league ID
GOOGLE_SHEET_NAME = "FPL-Data-YourLeague"  # Your Google Sheet name
```

**How to find your League IDs:**
- Classic League: Go to your league page → URL contains the ID
- H2H League: Same process for H2H leagues
- FPL Challenge: Check the FPL Challenge website

### 2. **Google Sheets Setup**

#### Create Google Service Account:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Sheets API and Google Drive API
4. Create Service Account credentials
5. Download the JSON key file

#### Set up Google Sheet:
1. Create a new Google Sheet
2. Name it according to `GOOGLE_SHEET_NAME`
3. Share the sheet with your service account email
4. Add the following worksheets:
   - `Classic League`
   - `H2H League` 
   - `FPL Challenge`
   - `Shooting Stars`
   - `Transfer King`
   - `Defensive King`
   - `Bench King`
   - `Dream Team`
   - `Penalty King`
   - `Best Captain`
   - `Best VC`
   - `Time Machine`

### 3. **Environment Setup**

#### Local Development:
```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment variables
export GCP_CREDENTIALS='{"type": "service_account", ...}'  # Your service account JSON

# Run the pipeline
python data_pipeline.py

# Run the dashboard
streamlit run app.py
```

#### GitHub Actions (Automated):
1. Go to your repository Settings → Secrets and variables → Actions
2. Add secret: `GCP_CREDENTIALS` with your service account JSON
3. The workflow will run automatically on schedule

### 4. **Deploy to Streamlit Cloud**

1. Go to [Streamlit Cloud](https://share.streamlit.io/)
2. Connect your GitHub repository
3. Add the `GCP_CREDENTIALS` secret in Streamlit Cloud settings
4. Deploy!

## 📁 Project Structure

```
fpl-dashboard-streamlit/
├── app.py                 # Main Streamlit dashboard
├── data_pipeline.py       # Data fetching and processing
├── requirements.txt       # Python dependencies
├── .github/
│   └── workflows/
│       └── run_fpl_pipeline.yml  # Automated data pipeline
├── .streamlit/
│   └── config.toml       # Streamlit configuration
├── data/                 # Local data storage (optional)
└── README.md            # This file
```

## 🔧 Configuration Options

### Customizing Awards
You can modify the awards logic in `data_pipeline.py`:

```python
# Example: Custom penalty calculation
def calculate_custom_penalty(manager_data, gw):
    # Your custom logic here
    return penalty_score
```

### Adding New Awards
1. Add award logic in `data_pipeline.py`
2. Create corresponding worksheet in Google Sheets
3. Update `app.py` to display the new award

### Styling the Dashboard
Modify `app.py` to customize:
- Colors and themes
- Layout and components
- Additional visualizations

## 📊 Data Sources

- **FPL API**: Official Fantasy Premier League API
- **FPL Challenge API**: Special challenge data
- **Google Sheets**: Data storage and sharing
- **Live Data**: Real-time player and team updates

## 🛠️ Troubleshooting

### Common Issues:

**1. "League not found" error:**
- Verify your league IDs are correct
- Check if leagues are public or you have access

**2. "Google Sheets permission denied":**
- Ensure service account has edit access to the sheet
- Check the sheet name matches `GOOGLE_SHEET_NAME`

**3. "API rate limit exceeded":**
- The pipeline includes automatic retry logic
- Consider reducing update frequency

**4. "Missing player data":**
- Some players may have incomplete history
- The system handles this gracefully with default values

### Debug Mode:
```python
# Enable debug logging in data_pipeline.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Fantasy Premier League for the API
- Streamlit for the web framework
- Google Sheets for data storage
- The FPL community for inspiration

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section
2. Search existing issues
3. Create a new issue with detailed information

---

**Made with ❤️ for the FPL community**

*Transform your mini-league into a data-driven competition!*
