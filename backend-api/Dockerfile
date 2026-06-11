FROM python:3.11-slim

# Instalar dependencias del sistema para pyodbc (SQL Server)
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY src/ .

EXPOSE 8080

CMD ["python", "app.py"]
