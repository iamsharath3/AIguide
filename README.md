# MentorAI - Full Stack Application

## Prerequisites
- Node.js installed
- PostgreSQL installed and running

## Database Setup
1. Open your terminal or a tool like pgAdmin.
2. Create a database named `mentor_ai_db`.
3. Run the SQL script located in `database/schema.sql` to create the table.
   - Command: `psql -d mentor_ai_db -f database/schema.sql`

## Running the Application

### 1. Start the Backend Server
Open a terminal:
```bash
cd server
npm start
```
The server will start on port 5000.

### 2. Start the Frontend Client
Open a NEW terminal:
```bash
cd client
npm run dev
```
The client will start on http://localhost:5173

## Features
- **Career Analysis**: Enter your profile to get AI-driven career suggestions.
- **Cover Letter**: Generate a tailored cover letter.
- **Interview Prep**: Get interview questions and answers.
- **Roadmap**: Get a step-by-step career path.
- **History**: All requests are saved to the PostgreSQL database.
