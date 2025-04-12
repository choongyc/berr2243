const express = require("express");
const { MongoClient, ObjectId } = require("mongodb"); 
const cors = require("cors");

const port = 3000;
const app = express();

app.use(cors());
app.use(express.json());

let db;
let usersCollection;

function dbCollection(name) {
  return db.collection(name);
}

async function connectToMongoDB() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    db = client.db("testDB");
    usersCollection = db.collection("users"); 
  } catch (err) {
    console.error("Error:", err);
  }
}
connectToMongoDB();

// POST /rides - Create a new ride
app.post("/rides", async (req, res) => {
  try {
    const result = await dbCollection("rides").insertOne(req.body);
    res.status(201).json({ id: result.insertedId });
  } catch {
    res.status(400).json({ error: "Invalid ride data" });
  }
});

// GET /rides - Fetch all rides
app.get("/rides", async (req, res) => {
  try {
    const rides = await dbCollection("rides").find().toArray();
    res.status(200).json(rides);
  } catch {
    res.status(500).json({ error: "Failed to fetch rides" });
  }
});

// PATCH /rides/:id - Update ride status
app.patch("/rides/:id", async (req, res) => {
  try {
    const result = await dbCollection("rides").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: req.body.status } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Ride not found" });
    }
    res.status(200).json({ updated: result.modifiedCount });
  } catch {
    //Handle invalid ID format or DB errors
    res.status(400).json({ error: "Invalid ride ID or data" });
  }
});

// DELETE /rides/:id - Cancel a ride
app.delete("/rides/:id", async (req, res) => {
  try {
    const result = await dbCollection("rides").deleteOne(
        { _id: new ObjectId(req.params.id) }
    );

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Ride not found" });
    }
    res.status(200).json({ deleted: result.deletedCount });
  } catch {
    res.status(400).json({ error: "Invalid ride ID" });
  }
});

// POST /users - Create a new user
app.post("/users", async (req, res) => {
  try {
    const result = await usersCollection.insertOne(req.body);
    res.status(201).json({ insertedId: result.insertedId });
  } catch {
    res.status(400).json({ error: "Invalid user data" });
  }
});

// GET /users - Get all users
app.get("/users", async (req, res) => {
  try {
    const users = await usersCollection.find().toArray();
    res.status(200).json(users);
  } catch {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// PATCH /users/:id - Update user status
app.patch("/users/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const result = await usersCollection.updateOne({ _id: id }, { $set: req.body });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(result);
  } catch {
    res.status(400).json({ error: "Invalid user ID" });
  }
});

// DELETE /users/:id - Cancel a user
app.delete("/users/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const result = await usersCollection.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "User not found or already deleted" });
    }

    res.status(200).json(result);
  } catch {
    res.status(400).json({ error: "Invalid user ID" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});