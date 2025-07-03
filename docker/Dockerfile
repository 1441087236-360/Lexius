# Use a fuller Python 3.9 image for better compatibility
FROM python:3.9

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Copy the project files into the container
COPY flask_server/ .

# Install OS-level dependencies for TensorFlow
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    libfreetype6-dev \
    libhdf5-serial-dev \
    libpng-dev \
    libzmq3-dev \
    pkg-config \
    python3-dev \
    software-properties-common \
    unzip \
    git \
    && apt-get clean

# Upgrade pip and install Python dependencies with specific versions
RUN pip install --upgrade pip && \
    pip install "numpy<2" tensorflow==2.11.0 transformers flask

# Expose Flask port
EXPOSE 5000

# Start the Flask app
CMD ["python", "app.py"]


