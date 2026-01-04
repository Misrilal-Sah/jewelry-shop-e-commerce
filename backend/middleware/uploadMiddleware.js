const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Memory storage for Cloudinary uploads (images go to buffer)
const memoryStorage = multer.memoryStorage();

// File filter - only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Create multer upload instance for product images (memory storage for Cloudinary)
const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Max 10 files
  },
  fileFilter: fileFilter
});

// Middleware for multiple product images
const uploadProductImages = upload.array('images', 10);

// Error handling wrapper
const handleUpload = (req, res, next) => {
  uploadProductImages(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Max size is 5MB.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ message: 'Too many files. Max is 10 images.' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// Delete image file
const deleteImage = (imagePath) => {
  const fullPath = path.join(__dirname, '..', imagePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

// Profile image upload configuration (memory storage for Cloudinary)
const profileUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for profile images
    files: 1
  },
  fileFilter: fileFilter
});

// Middleware for single profile image
const uploadProfileImage = profileUpload.single('profile_image');

// Review image upload configuration (memory storage for Cloudinary)
const reviewUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per review image
    files: 5 // Max 5 images per review
  },
  fileFilter: fileFilter
});

// Middleware for review images (up to 5)
const uploadReviewImages = reviewUpload.array('review_images', 5);

module.exports = {
  uploadProductImages: handleUpload,
  uploadProfileImage,
  uploadReviewImages,
  deleteImage
};
