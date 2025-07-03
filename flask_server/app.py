from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, TFAutoModelForSeq2SeqLM
from elasticsearch import Elasticsearch
from elasticsearch.exceptions import ElasticsearchException
import tensorflow as tf
import logging
import os

# Force CPU usage only
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

# Flask setup
app = Flask(__name__)
CORS(app)

# Set up logging
logging.basicConfig(level=logging.INFO)
app.logger.setLevel(logging.DEBUG)

# Load tokenizer and model (T5 using TensorFlow)

model = TFAutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-base", from_pt=False)
tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-base")

# Connect to Elasticsearch
ES_HOST = os.getenv("ES_HOST", "http://host.docker.internal:9200")
INDEX_NAME = os.getenv("ES_INDEX", "cases")
es = Elasticsearch(ES_HOST)

def generate_response(prompt: str) -> str:
    """Generate a response from the T5 model."""
    input_ids = tokenizer(prompt, return_tensors="tf").input_ids
    outputs = model.generate(input_ids, max_length=100)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

@app.route('/predict', methods=['POST'])
def predict():
    # Parse JSON and validate
    data = request.get_json(silent=True)
    if not data or "text" not in data:
        return jsonify({'error': 'Missing JSON body with "text" field.'}), 400

    user_input = data["text"].strip()
    if not user_input:
        return jsonify({'error': 'Empty "text" field.'}), 400

    app.logger.debug(f"Received predict request: {user_input!r}")

    # Step 1: Generate T5 reply
    try:
        ai_reply = generate_response(user_input)
    except Exception as gen_err:
        app.logger.error("Model generation failed", exc_info=gen_err)
        return jsonify({'error': 'AI generation error.'}), 500

    # Step 2: Query Elasticsearch for legal context
    try:
        es_result = es.search(
            index=INDEX_NAME,
            body={
                "query": {
                    "multi_match": {
                        "query":  user_input,
                        "fields": ["Summary200", "title", "legal_key"]
                    }
                },
                "size": 3
            }
        )
        suggestions = [
            hit["_source"]["Summary200"]
            for hit in es_result["hits"]["hits"]
            if "Summary200" in hit["_source"]
        ]
    except ElasticsearchException as es_err:
        app.logger.error("Elasticsearch search failed", exc_info=es_err)
        suggestions = []

    # Step 3: Combine results
    combined_response = ai_reply.strip()
    if suggestions:
        combined_response += "\n\n📚 Relevant Legal Info:\n"
        combined_response += "\n".join(f"- {s}" for s in suggestions)

    return jsonify({'response': combined_response})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)