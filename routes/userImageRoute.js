const express = require("express");
const router = express.Router();
const {
  getImage,
  setImage,
  updateImage,
  deleteImage,
} = require("../controllers/userImageController");
const { protect } = require("../middlewares/authMiddleware");

router.route("/").get(protect, getImage).post(protect, setImage);
router.route("/").put(protect, updateImage).delete(protect, deleteImage);

module.exports = router;
