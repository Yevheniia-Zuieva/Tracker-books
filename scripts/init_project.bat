@echo off
cd backend && pip install -r requirements.txt && python manage.py migrate
cd ../frontend && npm install
echo All dependencies installed!
pause