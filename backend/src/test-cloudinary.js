require("dotenv").config();

const cloudinary = require("./src/config/cloudinary");

cloudinary.api
  .ping()
  .then((result) => {
    console.log("Cloudinary Connected:", result);
  })
  .catch((error) => {
    console.error("Cloudinary Error:", error);
  });