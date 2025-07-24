#!/bin/bash

echo "🚀 Nasazování půjčovny outdoorového vybavení..."

# Kontrola Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js není nainstalován. Prosím nainstalujte Node.js 18+"
    exit 1
fi

# Kontrola npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm není dostupný"
    exit 1
fi

# Kontrola environment proměnných
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL není nastavená"
    echo "Nastavte: export DATABASE_URL='postgresql://username:password@host:port/database'"
    exit 1
fi

echo "✅ Kontroly prošly"

# Instalace závislostí
echo "📦 Instaluji závislosti..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Instalace závislostí selhala"
    exit 1
fi

# Vytvoření uploads složky
echo "📁 Vytvářím uploads složku..."
mkdir -p public/uploads
chmod 755 public/uploads

# Nahrání databázového schématu
echo "🗄️  Nahrávám databázové schéma..."
npm run db:push

if [ $? -ne 0 ]; then
    echo "❌ Nahrání databázového schématu selhalo"
    exit 1
fi

echo "✅ Nasazení dokončeno!"
echo ""
echo "Pro spuštění aplikace použijte:"
echo "npm start"
echo ""
echo "Aplikace bude dostupná na: http://localhost:5000"
echo "Admin panel: http://localhost:5000/admin"