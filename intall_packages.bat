@echo off
rmdir /S /Q "./chatbot-backend/embeddings_database"
cd "./chatbot-backend"
start cmd.exe /k "pip install -r requirements.txt"