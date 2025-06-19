# Slack Eppo Readout Agent

A simple Slack bot that fetches and displays Eppo experiment results with confidence intervals and lift metrics.

## Features

- Responds to experiment IDs in the format `EXP-12345`
- Shows lift percentages, confidence intervals, and p-values
- Uses CUPED results when available
- Visual indicators for statistical significance (🟢 positive, 🔴 negative, ⚪ inconclusive)
- Works with both direct messages and @mentions

## Complete Setup Guide

### Step 1: Create a Slack App

1. **Go to the Slack API website:**
   - Visit [https://api.slack.com/apps](https://api.slack.com/apps)
   - Click "Create New App"

2. **Choose "From scratch":**
   - App Name: `Eppo Readout Agent` (or your preferred name)
   - Pick a workspace to develop your app in
   - Click "Create App"

### Step 2: Configure Bot Permissions

1. **Navigate to "OAuth & Permissions"** in the left sidebar

2. **Add the following Bot Token Scopes:**
   - `app_mentions:read` - View messages that directly mention your bot
   - `chat:write` - Send messages as the bot
   - `channels:history` - View messages in public channels (if you want the bot to work in channels)
   - `im:history` - View messages in direct messages
   - `im:write` - Send direct messages

3. **Install the app to your workspace:**
   - Scroll up to "OAuth Tokens for Your Workspace"
   - Click "Install to Workspace"
   - Review permissions and click "Allow"

4. **Copy your Bot User OAuth Token:**
   - After installation, you'll see "Bot User OAuth Token" starting with `xoxb-`
   - Copy this token - you'll need it for your `.env` file

### Step 3: Get Your Signing Secret

1. **Go to "Basic Information"** in the left sidebar
2. **Find "App Credentials" section**
3. **Copy the "Signing Secret"** - you'll need this for your `.env` file

### Step 4: Enable Events

1. **Navigate to "Event Subscriptions"** in the left sidebar
2. **Enable Events:** Toggle "Enable Events" to On
3. **Set Request URL:** 
   - You'll need to set this after starting your server
   - The URL will be: `https://your-ngrok-url.ngrok.io/slack/events`
   - (We'll come back to this in Step 7)

4. **Subscribe to Bot Events:**
   - Click "Subscribe to bot events"
   - Add these events:
     - `app_mention` - When someone mentions your bot
     - `message.im` - Messages in direct message channels

5. **Save Changes** (you'll need to reinstall the app after setting the Request URL)

### Step 5: Get Your Eppo API Token

1. **Log into your Eppo account**
2. **Go to Settings/API Keys** (usually in the account/organization settings)
3. **Create a new API token** or use an existing one. For the purposes of using least priveleged access, select `Read` for `Experiments` and `Metrics` when creating your API key.
4. **Copy the token** - you'll need this for your `.env` file

### Step 6: Set Up the Project

1. **Clone or download this project**
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the project root:
   ```bash
   touch .env
   ```

4. **Add your environment variables** to `.env`:
   ```
   SLACK_BOT_TOKEN=xoxb-your-bot-token-from-step-2
   SLACK_SIGNING_SECRET=your-signing-secret-from-step-3
   EPPO_API_URL=https://api.geteppo.com/api/v1/experiments
   EPPO_API_TOKEN=your-eppo-api-token-from-step-5
   ```

### Step 7: Start the Server and Set Up Ngrok

1. **Start your bot:**
   ```bash
   npm start
   ```
   You should see: `⚡️ Slack app is running on port 3000!`

2. **In a new terminal, start ngrok:**
   ```bash
   ngrok http 3000
   ```
   
3. **Copy the ngrok URL:**
   - Look for the line like: `Forwarding https://abc123.ngrok.io -> http://localhost:3000`
   - Copy the `https://abc123.ngrok.io` part

4. **Update your Slack app's Request URL:**
   - Go back to your Slack app settings
   - Navigate to "Event Subscriptions"
   - Set Request URL to: `https://your-ngrok-url.ngrok.io/slack/events`
   - Slack will verify the URL (make sure your server is running!)
   - Click "Save Changes"

5. **Reinstall your app:**
   - Go to "OAuth & Permissions"
   - Click "Reinstall to Workspace"
   - Click "Allow"

### Step 8: Test Your Bot

1. **Find your bot in Slack:**
   - Look for your app name in the "Apps" section of your Slack workspace
   - Or search for it in the search bar

2. **Test with a direct message:**
   - Send a direct message to your bot with an experiment ID: `EXP-12345`
   - Replace `12345` with an actual experiment ID from your Eppo account

3. **Test with a mention:**
   - In any channel where the bot is present, mention it: `@YourBotName EXP-12345`

4. **Expected response:**
   ```
   📊 EXP-12345 results:
   Using CUPED results

   Revenue per User:
     🟢 Treatment A: 5.23% lift [2.15%, 8.31%] (p=0.0234)
     ⚪ Treatment B: 1.45% lift [-0.82%, 3.72%] (p=0.2156)
   ```

## Troubleshooting

### Bot doesn't respond:
- Check that your server is running (`npm start`)
- Verify ngrok is running and the URL is correct in Slack settings
- Check the server logs for errors
- Ensure your `.env` file has the correct tokens

### "Failed to fetch results" error:
- Verify your Eppo API token is correct
- Check that the experiment ID exists in your Eppo account
- Ensure the Eppo API URL is correct

### Permission errors:
- Make sure you've added all the required bot scopes
- Reinstall the app after adding new permissions

### Ngrok issues:
- Free ngrok URLs change every time you restart
- You'll need to update the Request URL in Slack settings if you restart ngrok
- Consider using a paid ngrok plan for a permanent URL in production

## Production Deployment

For production use, deploy to a cloud service (Heroku, AWS, etc.) instead of using ngrok:

1. Deploy your app to your chosen platform
2. Update the Slack Event Subscriptions Request URL to your production URL
3. Set your environment variables in your production environment

## Usage Examples

- `EXP-12345` - Get results for experiment 12345
- `@bot EXP-67890` - Mention the bot to get results
- `Hey @bot, can you show me EXP-11111?` - Natural language with experiment ID

The bot will automatically extract the experiment ID from your message and display the results with confidence intervals and lift metrics. 