// Import required packages
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

// Load environment variables
dotenv.config();

// Create express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Supabase connection
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);


// Test route
app.get("/", (req, res) => {
  res.send("SyncUp backend running successfully");
});


// SIGNUP API
app.post("/signup", async (req, res) => {

  try {

    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Please provide name, email, and password"
      });
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from("users")
      .insert([
        { name, email, password }
      ])
      .select();

    if (error) {
      return res.status(400).json({
        error: error.message
      });
    }

    res.status(201).json({
      message: "User created successfully",
      user: data
    });

  } catch (err) {

    res.status(500).json({
      error: "Server error",
      details: err.message
    });

  }

});


//Create-group API
app.post("/create-group", async (req, res) => {

  try {

    const { group_name, created_by } = req.body;

    if (!group_name || !created_by) {

      return res.status(400).json({
        error: "group_name and created_by required"
      });

    }

    const { data, error } = await supabase
      .from("groups")
      .insert([
        {
          group_name,
          created_by
        }
      ])
      .select();

    if (error) {

      return res.status(400).json({
        error: error.message
      });

    }

    res.json({
      message: "Group created successfully",
      group: data
    });

  }

  catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});

// Start server
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});