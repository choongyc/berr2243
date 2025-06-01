require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

app.use(express.json());

// MongoDB connection
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);
let db;

client.connect().then(() => {
  db = client.db('e_hailing');
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Role-based access control middleware
const authorize = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

// Register user
app.post('/users', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = { ...req.body, password: hashedPassword };
    await db.collection('users').insertOne(user);
    res.status(201).json({ message: "User created" });
  } catch {
    res.status(400).json({ error: "Registration failed" });
  }
});

// Login user
app.post('/auth/login', async (req, res) => {
  const user = await db.collection('users').findOne({ email: req.body.email });

  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.status(200).json({ token });
});

// Admin deletes user by ID (always return 204, even if error or invalid ID)
app.delete('/admin/users/:id', authenticate, authorize(['admin']), async (req, res) => {
  const { id } = req.params;

  try {
    await db.collection('users').deleteOne({ _id: new ObjectId(id) });
    res.status(204).send(); // Success or user not found
  } catch {
    res.status(204).send(); // Error (e.g. invalid ID), still return 204
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});