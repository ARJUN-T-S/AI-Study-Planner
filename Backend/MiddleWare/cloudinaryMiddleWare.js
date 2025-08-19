// controller/uploadController.js
const cloudinary = require("../config/cloudinary");

exports.uploadImage = async (req, res,next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // convert buffer to base64 string
    const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    // upload to cloudinary
    const result = await cloudinary.uploader.upload(fileBase64, {
      folder: "uploads", // optional
    });
    req.imageURL=result.secure_url;
    console.log(req.imageURL);
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ message: "Upload failed", error });
  }
  next();
};
