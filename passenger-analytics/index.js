const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);
const dbName = 'eHailingDB';

let db;
client.connect().then(() => {
  db = client.db(dbName);
  console.log("✅ Connected to MongoDB");
});

// 🚗 Route: Passenger Ride Analytics
app.get('/analytics/passengers', async (req, res) => {
  try {
    const usersCollection = db.collection('users');

    const result = await usersCollection.aggregate([
      { $match: { role: "passenger" } },
      {
        $lookup: {
          from: "rides",
          localField: "_id",
          foreignField: "customerId",
          as: "rides"
        }
      },
      { $unwind: "$rides" },
      {
        $group: {
          _id: "$name", // group by name
          totalRides: { $sum: 1 },
          totalFare: { $sum: "$rides.fare" },
          avgDistance: {
            $avg: {
              $sqrt: {
                $add: [
                  { $pow: [{ $subtract: ["$rides.destination.lat", "$rides.pickupLocation.lat"] }, 2] },
                  { $pow: [{ $subtract: ["$rides.destination.lng", "$rides.pickupLocation.lng"] }, 2] }
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          name: "$_id",
          totalRides: 1,
          totalFare: { $round: ["$totalFare", 2] },
          avgDistance: { $round: ["$avgDistance", 2] },
          _id: 0
        }
      }
    ]).toArray();

    res.json(result);
  } catch (error) {
    console.error("Aggregation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🌱 Route: Seed sample data
app.get('/seed', async (req, res) => {
  try {
    await db.collection('users').deleteMany({});
    await db.collection('rides').deleteMany({});

    await db.collection('users').insertMany([
      {
        _id: new ObjectId("60d0fe4f5311236168a109ca"),
        name: "Alice",
        email: "alice@mail.com",
        password: "hashedpwd1",
        role: "passenger",
        createdAt: new Date()
      },
      {
        _id: new ObjectId("60d0fe4f5311236168a109cb"),
        name: "Bob",
        email: "bob@mail.com",
        password: "hashedpwd2",
        role: "passenger",
        createdAt: new Date()
      }
    ]);

    await db.collection('rides').insertMany([
      {
        customerId: new ObjectId("60d0fe4f5311236168a109ca"),
        driverId: new ObjectId(),
        pickupLocation: { lat: 0, lng: 0 },
        destination: { lat: 7, lng: 10 }, // ≈ 12.21
        status: "completed",
        fare: 20.25
      },
      {
        customerId: new ObjectId("60d0fe4f5311236168a109ca"),
        driverId: new ObjectId(),
        pickupLocation: { lat: 0, lng: 0 },
        destination: { lat: 5.7, lng: 6.3 }, // ≈ 8.49
        status: "completed",
        fare: 17.55
      },
      {
        customerId: new ObjectId("60d0fe4f5311236168a109cb"),
        driverId: new ObjectId(),
        pickupLocation: { lat: 0, lng: 0 },
        destination: { lat: 6.93, lng: 6.93 }, // ≈ 9.8
        status: "completed",
        fare: 18.75
      }
    ]);

    res.send("✅ Sample data inserted successfully.");
  } catch (error) {
    console.error("Seeding error:", error);
    res.status(500).send("❌ Failed to seed data.");
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`➡️  Visit http://localhost:${PORT}/seed to insert sample data`);
});