#!/bin/bash
# Скрипт для бекапу бази даних
TIMESTAMP=$(date +"%Y%m%d_%H%M")
cp ./backend/db.sqlite3 ./backend/db.sqlite3.bak_$TIMESTAMP
echo "Backup created: db.sqlite3.bak_$TIMESTAMP"