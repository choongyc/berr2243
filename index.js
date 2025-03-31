const { MongoClient } = require("mongodb");

// Task 1: Define Drivers as a JavaScript Variable
const drivers = [
    { 
        name: "John Doe", 
        vehicleType: "Sedan", 
        isAvailable: true, 
        rating: 4.8 
    },
    { 
        name: "Alice Smith", 
        vehicleType: "SUV", 
        isAvailable: false, 
        rating: 4.5 
    },
];

// show the data in the console
console.log(drivers);

//T2Q1: show the all drivers name in the console
drivers.forEach(driver => console.log(driver.name));

//T2Q2: add additional driver to the drivers array
drivers.push(
    { name: "Choong", vehicleType: "Proton", isAvailable: true, rating: 4.2 });
console.log("Updated drivers list:", drivers);

async function main() {
    //Replace <connection-string> with your MongoDB URI
    const uri = "mongodb://localhost:27017";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db("testDB");

        const driversCollection = db.collection("drivers");

        // Task 3: Insert Drivers into MongoDB
        for (const driver of drivers) {
            const result = await driversCollection.insertOne(driver);
            console.log(`New driver created with result: ${result.insertedId}`);
        }

        // Task 4: Query and Update Drivers
        const availableDrivers = await db.collection("drivers").find({
            isAvailable: true,
            rating: { $gte: 4.5 } 
        }).toArray();
        console.log("Available drivers:", availableDrivers);

        // Task 5: Update
        // Question 3: Replace "updateOne" to "updateMany"
        const updateResult = await db.collection("drivers").updateMany(
            { isAvailable: true },
            { $inc: { rating: 0.1 } }
        );
        console.log(`Drivers updated, modified count: ${updateResult.modifiedCount}`);

        // Task 6: Delete
        // Question 4: Replace "deleteOne" to "deleteMany"
        const deleteResult = await db.collection("drivers").deleteMany({ isAvailable: false });
        console.log(`Drivers deleted, deleted count: ${deleteResult.deletedCount}`);


    }catch(err){
        console.error("Error:",err);
    
    } finally {
        await client.close();
    }
}

main();