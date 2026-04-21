# 🚀 GitHub Actions Setup Guide

## 🔧 Setting Up Automated Data Updates

### Step 1: Get Your Google Service Account JSON

1. **Go to Google Cloud Console**:
   - Visit: [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create or Select a Project**:
   - Create a new project or select existing one
   - Note your project name

3. **Enable APIs**:
   - Go to **"APIs & Services"** → **"Library"**
   - Search for and enable:
     - **Google Sheets API**
     - **Google Drive API**

4. **Create Service Account**:
   - Go to **"IAM & Admin"** → **"Service Accounts"**
   - Click **"Create Service Account"**
   - Name: `fpl-dashboard-service`
   - Description: `Service account for FPL Dashboard automation`
   - Click **"Create and Continue"**

5. **Grant Permissions**:
   - Role: **"Editor"** (or **"Google Sheets API"** + **"Google Drive API"**)
   - Click **"Continue"** → **"Done"**

6. **Create and Download Key**:
   - Click on your service account
   - Go to **"Keys"** tab
   - Click **"Add Key"** → **"Create new key"**
   - Type: **JSON**
   - Click **"Create"**
   - **Download the JSON file** (keep it secure!)

### Step 2: Set Up Your Google Sheet

1. **Create Google Sheet**:
   - Name it according to your `GOOGLE_SHEET_NAME` in config.py
   - Example: `"FPL-Data-YourLeague"`

2. **Share with Service Account**:
   - Open your Google Sheet
   - Click **"Share"**
   - Add the service account email (from the JSON file)
   - Give **"Editor"** permissions
   - Click **"Send"**

### Step 3: Add GitHub Secret

1. **Go to Repository Settings**:
   - Navigate to: [https://github.com/thinesrao/fpl-dashboard-streamlit/settings](https://github.com/thinesrao/fpl-dashboard-streamlit/settings)
   - Go to **"Secrets and variables"** → **"Actions"**

2. **Add GCP_CREDENTIALS Secret**:
   - Click **"New repository secret"**
   - Name: `GCP_CREDENTIALS`
   - Value: Copy the entire JSON file content as a single line
   - Click **"Add secret"**

### Step 4: Test the Setup

1. **Create config.py**:
   ```bash
   cp config_template.py config.py
   # Edit config.py with your league IDs
   ```

2. **Test Locally**:
   ```bash
   python data_pipeline.py
   ```

3. **Check GitHub Actions**:
   - Go to **"Actions"** tab in your repository
   - The workflow should run automatically
   - Check the logs for any errors

## 🔒 Security Notes

- **Never commit** the JSON file to your repository
- **Keep the JSON file secure** on your local machine
- **The secret is encrypted** in GitHub
- **Only you can see** the secret value

## 🚨 Troubleshooting

### Common Issues:

1. **"Permission denied" error**:
   - Check if service account has access to your Google Sheet
   - Verify the sheet name matches your config

2. **"API rate limit" error**:
   - The workflow includes retry logic
   - Consider reducing update frequency

3. **"League not found" error**:
   - Verify your league IDs in config.py
   - Check if leagues are public

## 📊 What Happens Next

Once set up, the GitHub Actions workflow will:
- **Run every 6 hours** automatically
- **Fetch fresh data** from FPL API
- **Update your Google Sheet** with new data
- **Send you notifications** if there are errors

Your dashboard will always have the latest data! 🏆
