# Deploying HACK2SKILL to Render (Manual Setup)

This guide explains how to manually deploy your **HACK2SKILL** application to [Render](https://dashboard.render.com).

## Prerequisites

1.  A **GitHub** account.
2.  A **Render** account.
3.  Your project pushed to GitHub.

---

## Step 1: Create the Database

1.  Log in to your [Render Dashboard](https://dashboard.render.com).
2.  Click **New +** and select **PostgreSQL**.
3.  **Name**: `hack2skill-db` (or any unique name).
4.  **Database**: `hack2skill`
5.  **User**: `hack2skill_user`
6.  **Region**: Select the one closest to you (e.g., Singapore, Frankfurt).
7.  **Instance Type**: Select **Free** (if available) or the cheapest plan.
8.  Click **Create Database**.
9.  **Wait** for the database to be created.
10. **Copy the `Internal Connection String`**. You will need this later.

---

## Step 2: Create the Web Service

1.  Go back to the Dashboard.
2.  Click **New +** and select **Web Service**.
3.  Select **Build and deploy from a Git repository**.
4.  Connect your GitHub account and select your **HACK2SKILL** repository.
5.  **Name**: `hack2skill-app`
6.  **Region**: Select the **same region** as your database.
7.  **Branch**: `main`
8.  **Runtime**: `Node`
9.  **Build Command**: `npm install && npm run build`
    *   *This installs backend dependencies, then builds the React frontend.*
10. **Start Command**: `node server/server.js`
11. **Instance Type**: Select **Free** (if available).

---

## Step 3: Configure Environment Variables

Scroll down to the **Environment Variables** section and add the following:

| Key | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Paste the **Internal Connection String** you copied in Step 1. |
| `JWT_SECRET` | Enter a long, random string (e.g., specific generated secret). |
| `GEMINI_API_KEY` | Enter your actual Google Gemini API Key. |

---

## Step 4: Deploy

1.  Click **Create Web Service**.
2.  Render will start building your application.
3.  Watch the logs. It will:
    *   Install backend dependencies.
    *   Build the frontend (`client/dist`).
    *   Start the server.
4.  Once you see "Server running on port...", your app is live!
5.  Click the URL provided at the top left of the dashboard to visit your app.
