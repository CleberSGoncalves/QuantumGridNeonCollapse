@echo off
echo [*] Sincronizando backup no GitHub (Quantum Grid: Neon Collapse)...
git add .
git commit -m "feat: release completa Quantum Grid: Neon Collapse com 15 setores, 3 estrelas, CrazyGames SDK v3, Web Audio procedural e game juice"
git push -u origin main
echo [OK] Backup concluido com sucesso no GitHub!
