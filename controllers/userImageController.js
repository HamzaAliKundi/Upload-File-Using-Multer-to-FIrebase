const asyncHandler = require("express-async-handler");
const multer = require("multer");
const path = require("path");
const Image = require("../models/userImageModel");
const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "store-images-e992d.appspot.com",
});
const bucket = admin.storage().bucket();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadToFirebaseStorage = async (file) => {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const fileName =
    "uploadImage-" + uniqueSuffix + path.extname(file.originalname);
  const fileUpload = bucket.file(fileName);
  const stream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  });

  return new Promise((resolve, reject) => {
    stream.on("error", (error) => {
      reject(error);
    });
    stream.on("finish", () => {
      const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${
        bucket.name
      }/o/${encodeURIComponent(fileName)}?alt=media`;
      resolve(imageUrl);
    });
    stream.end(file.buffer);
  });
};

const getImage = asyncHandler(async (req, res) => {
  const images = await Image.find({ user: req.user.id });
  if (images) {
    res.status(200).json(images);
  } else {
    res.status(404);
    throw new Error("Image not found");
  }
});

const setImage = asyncHandler(async (req, res) => {
  upload.single("uploadImage")(req, res, async (err) => {
    if (err) {
      return res
        .status(400)
        .json({ message: "Image upload failed", error: err.message });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Please select an image to upload" });
    }

    try {
      const imageUrl = await uploadToFirebaseStorage(req.file);
      const image = new Image({
        user: req.user.id,
        fileName: req.file.originalname,
        filePath: imageUrl,
      });

      await image.save();
      res.status(200).json({ image });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to upload image", error: error.message });
    }
  });
});

const updateImage = asyncHandler(async (req, res) => {
  upload.single("uploadImage")(req, res, async (err) => {
    if (err) {
      return res
        .status(400)
        .json({ message: "Image upload failed", error: err.message });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Please select an image to upload" });
    }

    try {
      const imageUrl = await uploadToFirebaseStorage(req.file);

      let image = await Image.findOne({ user: req.user.id });

      if (!image) {
        image = new Image({
          user: req.user.id,
          fileName: req.file.originalname,
          filePath: imageUrl,
        });
      } else {
        image.fileName = req.file.originalname;
        image.filePath = imageUrl;
      }

      await image.save();

      res.status(200).json({ image });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to update image", error: error.message });
    }
  });
});

const deleteImage = asyncHandler(async (req, res) => {
  const image = await Image.findById(req.params.id);
  if (image) {
    if (image.user.toString() === req.user._id.toString()) {
      const fileName = path.basename(image.filePath);
      await bucket.file(fileName).delete();

      await image.remove();
      res.status(200).json({ message: "Image Deleted", deletedImage: image });
    } else {
      res.status(401);
      throw new Error("Not authorized to delete this Image");
    }
  } else {
    res.status(404);
    throw new Error("Image not found");
  }
});

module.exports = {
  getImage,
  setImage,
  updateImage,
  deleteImage,
};
