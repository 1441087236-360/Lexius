const express = require('express');
const Fuse = require('fuse.js');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Load JSON data
const actsObject = require('./acts.json');
const titlesObject = require('./acts.json');
const keywordsObject = require('./keyword.json');

// Configure Fuse.js options
const fuseOptions = {
  keys: ['data'],
  shouldSort: true,
  threshold: 0.4,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 2,
};

const acts = new Fuse(actsObject, fuseOptions);
const titles = new Fuse(titlesObject, fuseOptions);
const keywords = new Fuse(keywordsObject, fuseOptions);

// Helper function for formatting chatbot responses
function formatChatResponse(query, suggestions) {
  if (suggestions.length === 0) {
    return `I couldn't find anything related to "${query}". Could you try rephrasing or providing more details?`;
  }

  const suggestionList = suggestions
    .map((s, index) => `${index + 1}. ${s.data}`)
    .join('\n');
  return `Here are some results for "${query}":\n\n${suggestionList}`;
}

// Route for serving chatbot responses
app.post('/chat', async (req, res) => {
  const query = req.body.query || '';
  const category = req.body.category || 'all'; // 'acts', 'titles', 'keywords', or 'all'

  if (!query) {
    return res.status(400).json({ message: 'Query is missing.' });
  }

  console.log(`Received query: "${query}" in category: "${category}"`);

  let suggestions = [];

  // Search in the specified category
  switch (category.toLowerCase()) {
    case 'acts':
      suggestions = acts.search(query, { limit: 5 });
      break;
    case 'titles':
      suggestions = titles.search(query, { limit: 5 });
      break;
    case 'keywords':
      suggestions = keywords.search(query, { limit: 5 });
      break;
    case 'all':
    default:
      suggestions = [
        ...acts.search(query, { limit: 3 }),
        ...titles.search(query, { limit: 3 }),
        ...keywords.search(query, { limit: 3 }),
      ];
      break;
  }

  // Format the chatbot's response
  const responseMessage = formatChatResponse(query, suggestions);

  res.json({
    userQuery: query,
    category,
    message: responseMessage,
  });
});

// Example route for predictions via Flask/TensorFlow BERT integration
app.post('/predict', async (req, res) => {
  const query = req.body.query;

  if (!query) {
    return res.status(400).json({ error: 'Query is required for prediction.' });
  }

  try {
    console.log('Forwarding query to BERT service...');
    const response = await axios.post('http://localhost:5000/predict', { query });
    console.log('Received response from BERT:', response.data);

    res.json({
      userQuery: query,
      bertResponse: response.data,
    });
  } catch (error) {
    console.error('Error with BERT service:', error.message);
    res.status(500).json({
      error: 'Error communicating with the prediction service.',
    });
  }
});

// Default route for testing
app.get('/', (req, res) => {
  res.send("Welcome to the legal chatbot! Post queries to '/chat'.");
});

// Start the server
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Chatbot server running at http://localhost:${PORT}`);
});
