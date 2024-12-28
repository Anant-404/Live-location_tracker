const mongoose = require('mongoose');
require("dotenv").config();
const connect = mongoose.connect(process.env.mongo_uri);

// Check database connected or not
connect.then(() => {
    console.log("Database Connected Successfully");
})
.catch(() => {
    console.log("Database cannot be Connected");
})

// Create Schema
const Loginschema = new mongoose.Schema({
    name: {
        type:String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    location: {
        type: String, // Current location
        default: null
    },
    locations: [
        {
            timestamp: { type: Date, default: Date.now },
            coordinates: { type: String } // e.g., "latitude,longitude"
        }
    ]
});

// collection part
const collection = new mongoose.model("users", Loginschema);

module.exports = collection;