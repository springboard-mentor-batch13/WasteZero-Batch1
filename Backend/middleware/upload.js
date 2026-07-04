const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {

    console.log("Original Name:", file.originalname);
    console.log("MIME Type:", file.mimetype);

    const allowedExtensions = [".jpg", ".jpeg", ".png"];

    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {

        cb(null, true);

    } else {

        cb(new Error("Only JPG, JPEG and PNG images are allowed"), false);

    }

};

module.exports = multer({
    storage,
    fileFilter
});