const express = require("express");
const router = express.Router();

const supabase = require("../supabaseClient");


// SIGNUP
router.post("/signup", async (req, res) => {

  const { name, email, password } = req.body;

  const { data, error } = await supabase
    .from("users")
    .insert([{ name, email, password }]);

  if (error)
    return res.status(400).json({ error: error.message });

  res.json({
    message: "Signup successful",
    data
  });

});


module.exports = router;