const multer = require("multer");

// store file in memory as buffer
const upload = multer({ storage: multer.memoryStorage() });

module.exports = upload;
