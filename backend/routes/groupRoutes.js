const express = require("express");
const router = express.Router();

const supabase = require("../supabaseClient");


// CREATE GROUP
router.post("/create-group", async (req, res) => {

  const { group_name, created_by } = req.body;

  const { data, error } = await supabase
    .from("groups")
    .insert([{ group_name, created_by }]);

  if (error)
    return res.status(400).json({ error: error.message });

  res.json({
    message: "Group created successfully",
    data
  });

});


module.exports = router;