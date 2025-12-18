const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Add SSL for production if using Render/Cloud providers
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Automatic Migration
const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS career_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                education VARCHAR(255),
                major VARCHAR(255),
                skills TEXT,
                interests TEXT,
                goals TEXT,
                generated_content JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};

initDb();

// Gemini AI Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Helper to save to DB
const saveLog = async (data, userId) => {
    try {
        const { education, major, skills, interests, goals, generated_content } = data;
        const query = `
            INSERT INTO career_logs (user_id, education, major, skills, interests, goals, generated_content)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `;
        const values = [userId, education, major, skills, interests, goals, generated_content];
        await pool.query(query, values);
    } catch (err) {
        console.error('Error saving to DB:', err);
    }
};

// --- AUTH ROUTES ---

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username`;
        const values = [username, email, hashedPassword];
        const result = await pool.query(query, values);

        res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
    } catch (error) {
        console.error(error);
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        // Return actual error message for debugging
        res.status(500).json({ error: error.message || 'Registration failed' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const query = `SELECT * FROM users WHERE email = $1`;
        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) return res.status(400).json({ error: 'User not found' });

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, username: user.username });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// --- PROTECTED ROUTES ---

// 1. Career Suggestions (Now Protected)
app.post('/api/analyze-career', authenticateToken, async (req, res) => {
    try {
        const { education, major, skills, interests, goals } = req.body;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Act as an expert career counselor. Based on the following student details, suggest a list of 3-5 possible career opportunities and a brief explanation for why each is a good fit. Please be concise and professional.
                
        Student Profile:
        - Highest Education: ${education}
        - Major/Field of Study: ${major}
        - Key Skills: ${skills}
        - Interests & Hobbies: ${interests}
        - Career Goals: ${goals}
        
        Output the response in clean HTML format (using <h3>, <h4>, <p> tags) suitable for directly rendering in a div. Do not include markdown code ticks.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Save to DB with User ID
        await saveLog({ education, major, skills, interests, goals, generated_content: { career_suggestions: text } }, req.user.id);

        res.json({ result: text });
    } catch (error) {
        console.error('Error in analyze-career:', error);
        res.status(500).json({ error: 'Failed to generate career suggestions' });
    }
});

// 2. Cover Letter
app.post('/api/generate-cover-letter', authenticateToken, async (req, res) => {
    try {
        const { education, major, skills, interests, goals, jobTitle } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Write a professional cover letter for a job as a ${jobTitle} based on the following applicant details. The letter should highlight their skills and enthusiasm.
                
        Applicant Profile:
        - Education: ${education} in ${major}
        - Skills: ${skills}
        - Interests & Hobbies: ${interests}
        - Career Goals: ${goals}
        
        Output in concise HTML format (using <p> tags for paragraphs).`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();
        res.json({ result: response });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate cover letter' });
    }
});

// 3. Interview Prep
app.post('/api/generate-interview', authenticateToken, async (req, res) => {
    try {
        const { education, major, skills, interests, goals, jobTitle } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Generate a list of 5 common interview questions for a ${jobTitle} position, and provide a brief, professional suggested answer for each question based on the following candidate profile.
                
        Candidate Profile:
        - Education: ${education} in ${major}
        - Skills: ${skills}
        - Interests & Hobbies: ${interests}
        - Career Goals: ${goals}
        
        Output in HTML format.`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();
        res.json({ result: response });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate interview prep' });
    }
});

// 4. Roadmap
app.post('/api/generate-roadmap', authenticateToken, async (req, res) => {
    try {
        const { education, major, skills, interests, goals } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Generate a step-by-step career roadmap for a student. The student's profile is as follows:
        - Education: ${education} in ${major}
        - Skills: ${skills}
        - Interests: ${interests}
        - Career Goals: ${goals}
        
        The roadmap should be structured with actionable steps over a timeline. Output in HTML format.`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();
        res.json({ result: response });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate roadmap' });
    }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    app.use(express.static(path.join(__dirname, '../client/dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
    });
}

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

module.exports = app;
