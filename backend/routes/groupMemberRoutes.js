const express = require("express");
const router = express.Router();

const supabase = require("../supabaseClient");


// JOIN GROUP

router.post("/join", async (req, res) => {

  const { group_id, user_id } = req.body;

  const { data, error } = await supabase
    .from("group_members")
    .insert([
      { group_id, user_id }
    ]);

  if (error)
    return res.status(400).json({ error: error.message });

  res.json({
    message: "Joined group successfully",
    data
  });

});


module.exports = router;