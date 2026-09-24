# 🎨 Onde inserir os Sprites / Artes Geradas por IA

O jogo foi construído de forma modular com renderização procedural dos 4 gatos canônicos da imagem anexada (`CatRenderer.tsx`).

Para substituir por imagens/sprites PNG transparentes gerados por IA:

1. Coloque seus arquivos nesta pasta:
   - `/sprites/fire_cat.png`
   - `/sprites/water_cat.png`
   - `/sprites/wind_cat.png`
   - `/sprites/earth_cat.png`

2. O componente `src/characters/CatRenderer.tsx` já possui suporte para alternar para `<img>` com os mesmos estados de movimento físico (avanço no ataque, recuo de dano, esquiva, barreira de escudo).
