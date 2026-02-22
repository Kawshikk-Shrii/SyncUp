const express = require("express");
const router = express.Router();

const supabase = require("../supabaseClient");


// ADD AVAILABILITY

router.post("/add", async (req, res) => {

  const {
    user_id,
    group_id, 
    date,
    start_time,
    end_time,
    status
  } = req.body;


  const { data, error } = await supabase
    .from("availability")
    .insert([
      {
        user_id,
        group_id,
        date,
        start_time,
        end_time,
        status
      }
    ]);

  if (error)
    return res.status(400).json({ error: error.message });

  res.json({
    message: "Availability added",
    data
  });

});


module.exports = router;