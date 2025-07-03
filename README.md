# Legal Chatbot

This is a complete legal chatbot system with TensorFlow+BERT (Docker), Flask API, Node.js frontend, and Elasticsearch for legal document indexing.

## Setup Instructions
- Start Elasticsearch with `docker-compose up -d`
- Load data: `curl -H "Content-Type: application/x-ndjson" -XPOST localhost:9200/_bulk --data-binary @elasticsearch/bulk_data.json`
- Build Docker image for Flask+BERT: `docker build -t legal-flask-bert .`
- Run container: `docker run -p 5000:5000 legal-flask-bert`
- Start Node.js UI: `cd node_server && npm install && node index.js`
- Access UI: http://localhost:3000
