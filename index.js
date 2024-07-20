const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const port = process.env.PORT || 3000;

// Define the API key (in a real application, store this in an environment variable)
const API_KEY = process.env.API_KEY;

// Define the path to the data folder
const dataFolderPath = path.join(__dirname, 'data');
const specialFolderPath = path.join(__dirname, 'special');
const imgFolderPath = path.join(__dirname, 'images');

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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imgFolderPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}.png`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only .png files are allowed!'), false);
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
  const filePath = path.join(imgFolderPath, `${filename}.png`);

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



function getLargestNumber() {
  try {
      // Read the directory and get all filenames
      const files = fs.readdirSync(dataFolderPath);

      // Initialize an array to hold the numbers
      const numbers = [];

      // Iterate over the files
      files.forEach(file => {
          // Get the file extension
          const ext = path.extname(file);

          // Check if the file has a .json extension
          if (ext === '.json') {
              // Remove the extension and convert to a number
              const number = parseInt(path.basename(file, ext), 10);

              // Check if it's a valid number and push it into the array
              if (!isNaN(number)) {
                  numbers.push(number);
              }
          }
      });

      // Get the largest number in the array
      const largestNumber = Math.max(...numbers);

      // Return the largest number
      return largestNumber;
  } catch (error) {
      console.error('Error reading directory or processing files:', error);
  }
}

app.post('/data/upload', (req, res) => {
  const { JsonData } = req.body;
  const largestNumber = getLargestNumber();
  var filename = "0" + largestNumber
  if (!filename || !JsonData) {
    return res.status(400).send({ error: 'Filename and JSON data are required' });
  }

  const filePath = path.join(DataFolderPath, `${filename}.json`);

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
