
import json
from flask import Flask, request, jsonify
from elasticsearch import Elasticsearch
import requests
import os

app = Flask(__name__, template_folder=os.path.join('frontend', 'templates'), static_folder=os.path.join('frontend', 'static'))

# Initialize Elasticsearch
es = Elasticsearch(["http://localhost:9200"], verify_certs=False)

# Paths to JSON files (adjust these if needed)
DATA_PATH = os.path.join(os.getcwd(), "elasticdata")
ACTS_PATH = os.path.join(DATA_PATH, "acts", "acts.json")
SUMMARY_PATH = os.path.join(DATA_PATH, "summaries", "summary.json")
CASES_PATH = os.path.join(DATA_PATH, "thefinaljson", "casesfinal.json")
FUZZY_SEARCH_PATH = os.path.join(DATA_PATH, "autocomplete", "fuzzy-search.json")
TITLES_PATH = os.path.join(DATA_PATH, "titles.json")
KEYWORDS_PATH = os.path.join(DATA_PATH, "keywords.json")

# TensorFlow/BERT Docker URL (assuming it's running on localhost)
BERT_API_URL = "http://localhost:5555/predict"

@app.route("/query", methods=["POST"])
def query():
    data = request.json
    user_query = data.get("query")
    
    if not user_query:
        return jsonify({"error": "Query parameter is missing."}), 400

    # Step 1: Query Elasticsearch for relevant documents
    results = search_elasticsearch(user_query)

    # Step 2: Pass query to TensorFlow/BERT Docker container for NLP processing
    bert_response = get_bert_response(user_query)

    return jsonify({
        "query": user_query,
        "elasticsearch_results": results,
        "bert_response": bert_response
    })

def search_elasticsearch(query):
    """Search Elasticsearch for relevant documents."""
    try:
        body = {
            "query": {
                "multi_match": {
                    "query": query,
                    "fields": ["Act_Name", "Summary200", "title", "data"]
                }
            }
        }
        response = es.search(index="*", body=body)
        hits = response["hits"]["hits"]
        results = [
            {
                "index": hit["_index"],
                "id": hit["_id"],
                "score": hit["_score"],
                "source": hit["_source"]
            }
            for hit in hits
        ]
        return results
    except Exception as e:
        return {"error": str(e)}

def get_bert_response(query):
    """Send query to TensorFlow/BERT Docker container and get response."""
    try:
        response = requests.post(BERT_API_URL, json={"query": query})
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"BERT service returned status {response.status_code}"}
    except Exception as e:
        return {"error": str(e)}

@app.route("/load_data", methods=["POST"])
def load_data():
    """Load all JSON files into Elasticsearch."""
    try:
        # Load acts.json
        load_bulk_data(ACTS_PATH)
        
        # Load fuzzy-search.json
        load_bulk_data(FUZZY_SEARCH_PATH)
        
        # Load summary.json
        load_bulk_data(SUMMARY_PATH)
        
        # Load casesfinal.json
        load_bulk_data(CASES_PATH)

        # Load titles.json
        load_bulk_data(TITLES_PATH)

        # Load keywords.json
        load_bulk_data(KEYWORDS_PATH)

        return jsonify({"message": "Data loaded successfully."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def load_bulk_data(file_path):
    """Load a bulk JSON file into Elasticsearch."""
    with open(file_path, "r") as file:
        data = file.read()
    response = requests.post(
        url="http://localhost:9200/_bulk",
        headers={"Content-Type": "application/json"},
        data=data
    )
    if response.status_code != 200:
        raise Exception(f"Failed to load data from {file_path}: {response.text}")

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
