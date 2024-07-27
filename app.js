require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const port = process.env.PORT

// Define the API key (in a real application, store this in an environment variable)
const API_KEY = process.env.API_KEY;

// Define the path to the data folder
const dataFolderPath = path.join(__dirname, 'data');
const specialFolderPath = path.join(__dirname, 'special');
const imgFolderPath = path.join(__dirname, 'images');
const specialImgFolderPath = path.join(imgFolderPath, 'special');

// Use CORS middleware
app.use(cors());

// Middleware to parse JSON body
app.use(express.json());

// Middleware to check API key
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === API_KEY) {
    next(); // Proceed to the next middleware or route handler
  } else {
    res.status(403).send({ error: 'Forbidden - Invalid API key' });
  }
});

// Configure multer for normal image file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imgFolderPath);
  },
  filename: (req, file, cb) => {
    // Use the original name and preserve the file extension
    const originalName = file.originalname;
    cb(null, originalName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .png .jpeg .jpg files are allowed!'), false);
    }
  }
});

// Configure multer for special image file uploads
const specialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, specialImgFolderPath);
  },
  filename: (req, file, cb) => {
    // Use the original name and preserve the file extension
    const originalName = file.originalname;
    cb(null, originalName);
  }
});

const specialUpload = multer({
  storage: specialStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .png, .jpeg, and .jpg files are allowed!'), false);
    }
  }
});


// Route to handle dynamic paths for JSON files
app.get('/data/:filename/show', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(dataFolderPath, `${filename}.json`);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send({ error: 'File not found' });
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return res.status(500).send({ error: 'Error reading the file' });
      }

      try {
        const jsonData = JSON.parse(data);
        res.json(jsonData);
      } catch (parseErr) {
        res.status(500).send({ error: 'Error parsing JSON' });
      }
    });
  });
});

app.get('/data/sp/image/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(specialImgFolderPath, filename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send('File not found');
    }

    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(500).send('Error sending file');
      }
    });
  });
});

// Route to handle special JSON files
app.get('/data/sp/:filename/show', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(specialFolderPath, `${filename}.json`);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send({ error: 'File not found' });
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return res.status(500).send({ error: 'Error reading the file' });
      }

      try {
        const jsonData = JSON.parse(data);
        res.json(jsonData);
      } catch (parseErr) {
        res.status(500).send({ error: 'Error parsing JSON' });
      }
    });
  });
});

// Route to serve image files
app.get('/data/images/:filename/', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(imgFolderPath, `${filename}`);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send('File not found');
    }

    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(500).send('Error sending file');
      }
    });
  });
});

// Route to handle image uploads
app.post('/data/images/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ error: 'No file uploaded or file type is not .png' });
  }
  res.status(200).send({ message: 'File uploaded successfully', filename: req.file.filename });
});

// Route to handle special image uploads
app.post('/data/sp/image/upload', specialUpload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ error: 'No file uploaded or file type is not allowed' });
  }

  res.status(200).send({ message: 'Special image uploaded successfully', filename: req.file.filename });
});

// Route to handle JSON data uploads
app.post('/data/special/upload', (req, res) => {
  const { filename, JsonData } = req.body;

  if (!filename || !JsonData) {
    return res.status(400).send({ error: 'Filename and JSON data are required' });
  }

  const filePath = path.join(specialFolderPath, `${filename}.json`);

  fs.writeFile(filePath, JSON.stringify(JsonData, null, 2), 'utf8', (err) => {
    if (err) {
      return res.status(500).send({ error: 'Error saving the file' });
    }
    res.status(200).send({ message: 'File saved successfully', filename });
  });
});


// Route to handle JSON data uploads and create new files with incremented names
app.post('/data/upload/:filename/', (req, res) => {
  const { JsonData } = req.body;
  const filename = req.params.filename;

  if (!JsonData) {
    return res.status(400).send({ error: 'JSON data is required' });
  }

  const filePath = path.join(dataFolderPath, `${filename}.json`);

  fs.writeFile(filePath, JSON.stringify(JsonData, null, 2), 'utf8', (err) => {
    if (err) {
      return res.status(500).send({ error: 'Error saving the file' });
    }
    res.status(200).send({ message: 'File saved successfully', filename });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
