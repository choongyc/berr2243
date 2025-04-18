const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

let db, usersCollection, ridesCollection;

async function connectToMongoDB() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    db = client.db("testDB");
    usersCollection = db.collection("users");
    ridesCollection = db.collection("rides");
  } catch (err) {
    console.error("Error connecting to DB:", err);
  }
}
connectToMongoDB();

// Ride Registration
app.post("/rides", async (req, res) => {
  try {
    const result = await ridesCollection.insertOne(req.body);
    res.status(201).json({ id: result.insertedId });
  } catch {
    res.status(400).json({ error: "Invalid ride data" });
  }
});

// User Registration
app.post("/users", async (req, res) => {
  try {
    const result = await usersCollection.insertOne(req.body);
    res.status(201).json({ id: result.insertedId });
  } catch {
    res.status(400).json({ error: "Invalid user data" });
  }
});

// User View Rides
app.get("/rides", async (req, res) => {
  try {
    const rides = await ridesCollection.find().toArray();
    if (rides.length === 0) {
      return res.status(404).json({ error: "No rides found" });
    }
    res.status(200).json(rides);
  } catch {
    res.status(500).json({ error: "Failed to fetch rides" });
  }
});

// View Users (Admin)
app.get("/users", async (req, res) => {
  try {
    const users = await usersCollection.find().toArray();
    if (users.length === 0) {
      return res.status(404).json({ error: "No users found" });
    }
    res.status(200).json(users);
  } catch {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Update Ride Status
app.patch("/drivers/:id/status", async (req, res) => {
  try {
    const result = await ridesCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: req.body.status } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Ride not found" });
    }
    res.status(200).json({ updated: result.modifiedCount });
  } catch {
    res.status(400).json({ error: "Invalid ride ID or data" });
  }
});

// Update User Status
app.patch("/users/:id/status", async (req, res) => {
  try {
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: req.body.status } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ updated: result.modifiedCount });
  } catch {
    res.status(400).json({ error: "Invalid user ID or data" });
  }
});

// Delete Ride (Admin)
app.delete("/admin/rides/:id", async (req, res) => {
  try {
    const result = await ridesCollection.deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(403).json({ error: "Ride not found or deletion not allowed" });
    }
    res.status(204).send(); // No Content
  } catch {
    res.status(400).json({ error: "Invalid ride ID" });
  }
});

// Delete User (Admin)
app.delete("/admin/users/:id", async (req, res) => {
  try {
    const result = await usersCollection.deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(403).json({ error: "User not found or deletion not allowed" });
    }
    res.status(204).send(); // No Content
  } catch {
    res.status(400).json({ error: "Invalid user ID" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});