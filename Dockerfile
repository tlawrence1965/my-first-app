# Start from an official Python base image
FROM python:3.12-slim

# Set the working directory inside the container
WORKDIR /app

# Copy and install dependencies first (Docker caches this layer)
COPY app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the app
COPY app/ .

# Tell Docker what port this container exposes
EXPOSE 5000

# The command to run when the container starts
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
