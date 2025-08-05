# Google Sheets Integration Setup Guide

## Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API

## Step 2: Create Service Account
1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name it "lead-bot-sheets"
4. Click "Create and Continue"
5. Grant "Editor" role
6. Click "Done"

## Step 3: Create and Download Key
1. Click on your service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the JSON file
6. Save it as `service-account-key.json` in your project folder

## Step 4: Share Google Sheet
1. Open your Google Sheet
2. Click "Share" button
3. Add your service account email (found in the JSON file)
4. Give "Editor" permissions

## Step 5: Update Server Code
The server will use the service account credentials to write to Google Sheets. 