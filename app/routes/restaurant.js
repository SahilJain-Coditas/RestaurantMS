const express = require("express");
const Restaurant = require("../models/restaurants.model");
const { checkAuth } = require("../util/auth");
const router = express.Router();
const mongoose = require("mongoose");

router.post("/", async (req, res) => {
  const { name, address, description, image, ratings } = req.body;
  try {
    const restaurant = new Restaurant({
      name,
      address,
      description,
      image,
      ratings,
    });
    await restaurant.save();
    res.status(201).json(restaurant);
  } catch (error) {
    res
      .status(400)
      .json({ error: "Error creating restaurant: " + error.message });
  }
});

router.get("/get-all", async (req, res) => {
  try {
    const result = await Restaurant.aggregate([
      {
        $lookup: {
          from: "ratings",
          localField: "_id",
          foreignField: "restaurant",
          as: "ratings",
        },
      },
      {
        $addFields: {
          totalRatings: { $size: "$ratings" },
          averageRating: {
            $cond: {
              if: { $eq: [{ $size: "$ratings" }, 0] },
              then: 0,
              else: { $ceil: { $avg: "$ratings.averageRating" } },
            },
          },
        },
      },
    ]);

    if (result.length === 0) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    res.status(200).json(result);
  } catch (error) {
    res
      .status(400)
      .json({ error: "Error fetching restaurants: " + error.message });
  }
});

router.get("/:id", async (req, res) => {
  const restaurantId = req.params.id;
  try {
    const result = await Restaurant.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(restaurantId) } },
      {
        $lookup: {
          from: "ratings",
          localField: "_id",
          foreignField: "restaurant",
          as: "ratings",
        },
      },
      {
        $addFields: {
          totalRatings: { $size: "$ratings" },
          averageRating: {
            $cond: {
              if: { $eq: [{ $size: "$ratings" }, 0] },
              then: 0,
              else: { $ceil: { $avg: "$ratings.averageRating" } },
            },
          },
        },
      },
    ]);

    if (result.length === 0) {
      return [];
    }

    const restaurant = result[0];

    res.status(200).json({
      restaurant,
      totalRatings: restaurant.totalRatings,
      averageRating: restaurant.averageRating, // Already rounded up
    });
  } catch (error) {
    res
      .status(400)
      .json({ error: "Error fetching restaurant: " + error.message });
  }
});

router.put("/:id", async (req, res) => {
  const { name, address, description, image } = req.body;
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { name, address, description, image },
      { new: true }
    );
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }
    res.json(restaurant);
  } catch (error) {
    res
      .status(400)
      .json({ error: "Error updating restaurant: " + error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }
    res.json({ message: "Restaurant deleted successfully" });
  } catch (error) {
    res
      .status(400)
      .json({ error: "Error deleting restaurant: " + error.message });
  }
});

module.exports = router;
