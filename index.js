import express from 'express';
import cors from 'cors';
import path from 'path';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';
import { signToken } from './auth.js';

import requestsRouter from './routes/requests.js';
import analyticsRouter from './routes/analytics.js';
import formsRouter from './routes/forms.js';
// import typesRouter from './routes/types.js';

const app = express();
app.use(cors());
app.use(express.json());

// --- AUTHENTICATION ROUTE ---
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body ?? {};
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const [rows] = await pool.query('SELECT id, name, username, password_hash, role FROM users WHERE username = ?', [username]);
        const userRow = rows[0];

        if (!userRow) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const isPasswordCorrect = bcrypt.compareSync(password, userRow.password_hash);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const userPayload = { id: userRow.id, name: userRow.name, username: userRow.username, role: userRow.role };
        const token = signToken(userPayload);

        res.json({ user: userPayload, token });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(process.cwd(),'uploads')));

// --- API ROUTES ---
app.use('/api/requests', requestsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/forms', formsRouter);
// app.use('/api/types', typesRouter);

const port = process.env.PORT || 3001;
app.listen(port, ()=>console.log(`Server running on http://localhost:${port}`));
