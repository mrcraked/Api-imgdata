const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Path to the image you want to upload

const API_KEY = "Galau-xyeik49w8ncw8jq";
const SERVER_URL = 'http://localhost:3000';

const downloadImage = async (filename) => {
    try {
      // Make the GET request to fetch the image
      const response = await axios.get(`${SERVER_URL}/data/images/${filename}/`, {
        headers: {
          'x-api-key': API_KEY,
        },
        responseType: 'stream', // This ensures that the response is treated as a stream
      });
  
      // Define the path where you want to save the downloaded image
      const outputPath = path.join(__dirname, filename);
  
      // Create a write stream to save the image
      const writer = fs.createWriteStream(outputPath);
  
      // Pipe the response stream to the file write stream
      response.data.pipe(writer);
  
      writer.on('finish', () => {
        console.log(`Image ${filename} downloaded successfully.`);
      });
  
      writer.on('error', (error) => {
        console.error('Error saving the image:', error.message);
      });
    } catch (error) {
      console.error('Error downloading the image:', error.response ? error.response.data : error.message);
    }
  };

downloadImage("pic03.jpg")