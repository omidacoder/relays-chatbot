    @echo off

    REM chatbot-db
    cd "./chatbot-db"
    start cmd.exe /k "npm run start"

    REM chatbot-frontend
    cd "../chatbot-frontend"
    start cmd.exe /k "npm run start"

    REM chatbot-backend
    cd "../chatbot-backend"
    start cmd.exe /k "python -m uvicorn app:app"