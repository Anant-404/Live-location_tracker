const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
const collection = require("./config");
const bcrypt = require('bcrypt');
const session = require("express-session");
require("dotenv").config();


app.use(express.json());
app.use(express.urlencoded({ extended: false }));


const socketio = require("socket.io");

const server = http.createServer(app);
const io = socketio(server);

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    secret:  '1234567',
    resave: false,
    saveUninitialized: false
}));


io.on("connection", function (socket) {
    socket.on("send-location",async (data) => {
        console.log("Received location data:", data); // Debugging
        try {
            const { username, latitude, longitude } = data;

            // Update current location and append to the locations array
            await collection.findOneAndUpdate(
                { name: username },
                {
                    location: `${latitude},${longitude}`,
                    $push: { locations: { coordinates: `${latitude},${longitude}` } }
                },
                { new: true }
            );


            io.emit("receive-location", { id: socket.id, ...data }); // Broadcast the location
        } catch (error) {
            console.error("Error updating location:", error);
        }
    });
    //console.log("WebSocket working");
    socket.on("disconnect",function(){
        io.emit("user-disconnected",socket.id);
    })
});

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect("/"); // Redirect to login if not authenticated
}

// Routes
app.get("/", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

// Register User
app.post("/signup", async (req, res) => {
    const data = {
        name: req.body.username,
        password: req.body.password
    };

    // Check if the username already exists in the database
    const existingUser = await collection.findOne({ name: data.name });
    if (existingUser) {
        return res.send('User already exists. Please choose a different username.');
    }

    // Hash the password using bcrypt
    const saltRounds = 10; // Number of salt rounds for bcrypt
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    data.password = hashedPassword; // Replace the original password with the hash
     //new isntance from data
    const newUser = new collection({
        name: data.name,
        password: hashedPassword
    });
    await newUser.save();
    

 
    res.redirect("/"); // Redirect
});

// Login User
app.post("/login", async (req, res) => {
    try {
        const user = await collection.findOne({ name: req.body.username });
        if (!user) {
            return res.send("User not found");
        }

        // Compare the hashed password
        const isPasswordMatch = await bcrypt.compare(req.body.password, user.password);
        if (!isPasswordMatch) {
            return res.send("Incorrect password");
        }

        // Save user information in the session
        req.session.user = user;
        res.redirect("/home"); 
    } catch (error) {
        res.send("An error occurred during login");
    }
});

// Live Location Application
app.get("/home", isAuthenticated, (req, res) => {
    res.render("index", { user: req.session.user }); // Pass user data to the view
});


app.get("/admin", async (req, res) => {
    try {
        // Fetch all users and their logs
        const users = await collection.find({}, { name: 1, locations: 1 }).lean();
        console.log("Fetched Users:", users); // Debugging
        res.render("admin", { users });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send("Internal Server Error");
    }
});


server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
