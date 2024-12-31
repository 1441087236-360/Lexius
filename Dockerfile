# Use TensorFlow 1.15 with Python 3 as the base
FROM tensorflow/tensorflow:1.15.0-py3

# Set the working directory in the container
WORKDIR /app

# Copy your BERT model files into the container
COPY ./uncased_L-12_H-768_A-12 /app/bert_model

# Install necessary system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    gcc \
    g++

# Install Python dependencies for BERT-as-Service
RUN pip install --no-cache-dir grpcio==1.32.0 bert-serving-server bert-serving-client

# Expose the ports for BERT service
EXPOSE 5555 5556

# Start the BERT server when the container runs
CMD ["bert-serving-start", "-model_dir", "/app/bert_model", "-num_worker=4", "-cpu", "-port", "5555", "-port_out", "5556"]

