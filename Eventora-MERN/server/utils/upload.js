const multer = require('multer');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const uploadToCloudinary = async (file) => {
  if (!file) return '';

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'eventora-events' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result?.secure_url || '');
      }
    );

    stream.end(file.buffer);
  });
};

module.exports = upload;
module.exports.uploadToCloudinary = uploadToCloudinary;
