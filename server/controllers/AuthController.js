const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');

class AuthController {
    async register(req, res) {
        const { name, email, password, currency } = req.body;
        const userEmail = email.toLowerCase();
        const JWT_SECRET = process.env.JWT_SECRET;
        
        try {
            const existing = await db('users').where({ email: userEmail }).first();
            if (existing) return res.status(400).json({ error: 'Email already registered' });
            
            const role = (userEmail === 'harshitmehta1012@gmail.com') ? 'admin' : 'user';
            const hashedPassword = bcrypt.hashSync(password, 12);
            
            const [userId] = await db('users').insert({ 
                name, 
                email: userEmail, 
                password: hashedPassword, 
                role, 
                currency: currency || 'USD' 
            });
            
            const token = jwt.sign({ id: userId, email: userEmail, role }, JWT_SECRET, { expiresIn: '7d' });
            
            res.cookie('fp_token', token, { 
                httpOnly: true, 
                secure: process.env.NODE_ENV === 'production', 
                sameSite: 'lax', 
                maxAge: 7 * 24 * 60 * 60 * 1000 
            });
            
            res.status(201).json({ success: true, user: { id: userId, name, email: userEmail, role, currency } });
        } catch (err) {
            console.error('Registration Error:', err);
            res.status(500).json({ error: 'REGISTRATION_FAILED: System anomaly detected.' });
        }
    }

    async login(req, res) {
        const { email, password } = req.body;
        const userEmail = email.toLowerCase();
        const JWT_SECRET = process.env.JWT_SECRET;
        
        try {
            const user = await db('users').where({ email: userEmail }).first();
            if (!user || !bcrypt.compareSync(password, user.password)) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
            
            res.cookie('fp_token', token, { 
                httpOnly: true, 
                secure: process.env.NODE_ENV === 'production', 
                sameSite: 'lax', 
                maxAge: 7 * 24 * 60 * 60 * 1000 
            });
            
            res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, currency: user.currency, avatar: user.avatar } });
        } catch (err) {
            console.error('Login Error:', err);
            res.status(500).json({ error: 'LOGIN_FAILED: Structural error in auth layer.' });
        }
    }
}

module.exports = new AuthController();
