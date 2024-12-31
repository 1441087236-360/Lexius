# Lexius
<div align="center">
![lexius-logo](https://github.com/user-attachments/assets/9f08de57-97c8-436c-820a-e3b57d9346d6)
</div>
main page

![Screenshot 2024-11-30 114924](https://github.com/user-attachments/assets/f96990da-65d6-4040-8934-0d188dcc9ad6)


---

## Table of Contents

1. [Introduction](#introduction)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [System Architecture](#system-architecture)
5. [Installation](#installation)
6. [Usage](#usage)
7. [Project Structure](#project-structure)
8. [Contributing](#contributing)
9. [License](#license)
10. [Contact](#contact)

---

## Introduction

**Lexius** is an advanced chatbot designed to provide legal assistance by leveraging cutting-edge natural language processing and AI technologies. The system enables users to query legal documents, case laws, and statutory information in a conversational manner similar to interacting with ChatGPT.

---

## Features

- **Conversational Interface**: User-friendly chat-based interface for querying legal documents.
- **Natural Language Understanding**: Processes user queries with BERT for intent detection and context extraction.
- **Real-Time Search**: Quick retrieval of indexed legal documents using Elasticsearch.
- **Personalization**: Saves user query history and preferences for future reference.
- **Multi-Platform Support**: Works across web and Android platforms.
- **Secure Deployment**: Containerized environment with Docker for consistency and scalability.

---

## Technology Stack

### Frontend
- **Framework**: React or Angular
- **Technologies**: HTML, CSS, JavaScript
- **Communication**: AJAX/WebSocket for dynamic updates

### Backend
- **Frameworks**: Flask (Python), Node.js
- **Responsibilities**: API routing, query processing, and integration with NLP and database components

### NLP
- **Model**: TensorFlow with fine-tuned BERT
- **Tasks**: Intent recognition, context extraction, and relevance scoring

### Database and Search
- **Search Engine**: Elasticsearch
- **Storage**: MongoDB/SQL for user data and logs

### Deployment
- **Tool**: Docker for containerization
- **Load Balancer**: Nginx/Apache

---

## System Architecture

The system uses a modular and layered architecture:

- **Frontend**: Provides a responsive chat interface.
- **Backend**: Routes and processes queries, integrates NLP, and retrieves data.
- **NLP Module**: Processes natural language queries for context and relevance.
- **Database**: Stores legal data and user query history.
- **Search Engine**: Uses Elasticsearch for fast document retrieval.

![System_Architecture](https://github.com/user-attachments/assets/91723a76-47bf-49c9-a7ed-7fb7755d3904)


---

## Installation

### Prerequisites
- Python 3.9+
- Node.js 16+
- Docker
- TensorFlow
- Elasticsearch

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/lexius.git
   ```

2. Navigate to the project directory:
   ```bash
   cd lexius
   ```

3. Set up the virtual environment:
   ```bash
   python -m venv env
   source env/bin/activate  # For Linux/Mac
   env\Scripts\activate  # For Windows
   ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Start the backend:
   ```bash
   flask run
   ```

6. Start the frontend:
   ```bash
   cd frontend
   npm install
   npm start
   ```

7. Ensure Elasticsearch and Docker are running.

---

## Usage

1. Open the application in your browser at `http://localhost:3000`.
2. Enter legal queries in the chat interface.
3. View responses dynamically generated based on your input.

---

## Project Structure

```
lexius/
├── main.py
|── uncased_L-12_H-768_A-12/
│   ├── bert_config.json
│   ├── bert_model.ckpt.data-00000-of-00001
│   ├── bert_model.ckpt.index
│   ├── bert_model.ckpt.meta
│   └── vocab.txt/
├── frontend/
│   ├── static/    
│   │   ├── css/
│   │   │   ├── main.css
│   │   ├── js/
│   │   │   ├── script.css
│   │   └── input.css
│   ├── templates/
│   │   └── index.html
├── Dockerfile
├── elasticsearch/
│   ├── Acts/
│   ├── Autocomplete/
│   ├── Summaries/
│   └── TheFinalJson/
├── tests/
│   ├── backend/
│   └── frontend/
├── requirements.txt
└── README.md
```

---

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes and push the branch:
   ```bash
   git push origin feature-name
   ```
4. Submit a pull request.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Contact

For any questions or support, contact:
- **Email**: anmolshukla743@gmail.com
- **GitHub**: [Your GitHub Profile](https://github.com/1441087236-360)
