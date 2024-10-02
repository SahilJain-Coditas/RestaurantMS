const express = require("express");
const router = express.Router();
const Rating = require("../models/ratings.model");
const Restaurant = require("../models/restaurants.model");

router.post("/", async (req, res) => {
  const { user, restaurant, averageRating, review, name } = req.body;
  try {
    const newRating = new Rating({
      user: user,
      restaurant: restaurant,
      name,
      averageRating,
      review,
    });

    const savedRating = await newRating.save();

    await Restaurant.findByIdAndUpdate(restaurant, {
      $push: { rating: savedRating._id },
    });

    res.status(201).json(savedRating);
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Failed to add rating" });
  }
});

router.get("/get-all", async (req, res) => {
  try {
    const ratings = await Rating.find().populate("user restaurant");
    res.status(200).json(ratings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id).populate(
      "user restaurant"
    );

    if (!rating) {
      console.log("No rating found"); 
      return res.status(404).json({ error: "Rating not found" });
    }

    res.status(200).json(rating);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedRating = await Rating.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("user restaurant");

    if (!updatedRating) {
      return res.status(404).json({ error: "Rating not found" });
    }

    res.status(200).json(updatedRating);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedRating = await Rating.findByIdAndDelete(req.params.id);

    if (!deletedRating) {
      return res.status(404).json({ error: "Rating not found" });
    }

    res.status(200).json({ message: "Rating deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const ratings = await Rating.find({ user: userId }).populate("restaurant");

    if (ratings.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(ratings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
module.exports = router;
