# 🐾 PetCalcula

PetCalcula é uma aplicação web desenvolvida para uso interno em pet shops e clínicas veterinárias.

Seu objetivo é comparar automaticamente o custo de medicamentos com base no peso do animal, auxiliando o atendente a identificar rapidamente a opção mais econômica.

---

## Funcionalidades

- Comparação automática entre medicamentos cadastrados
- Cálculo da quantidade necessária
- Cálculo do custo do tratamento
- Ordenação do menor para o maior preço
- Destaque da melhor opção
- Filtro por espécie (Cão/Gato)
- Filtro por forma farmacêutica (Comprimido/Transdérmico)
- Cadastro de medicamentos
- Persistência local dos dados
- Backup e restauração em JSON

---

## Tecnologias

- React
- TypeScript
- Vite
- Tailwind CSS

---

## Como executar

```bash
npm install
npm run dev
```

A aplicação ficará disponível em:

```
http://localhost:5173
```

---

## Estrutura dos dados

Cada medicamento possui:

- Nome
- Categoria
- Espécie
- Forma farmacêutica
- Peso tratado por unidade
- Preço da caixa
- Quantidade de unidades por caixa

O preço unitário é calculado automaticamente pela aplicação.

---

## Persistência

Atualmente os dados são armazenados no navegador utilizando `localStorage`.

Também é possível exportar e importar backups em JSON.

---

## Roadmap

- [x] Comparação de custos
- [x] Cadastro de medicamentos
- [x] Persistência local
- [x] Backup em JSON
- [x] Filtro por espécie
- [x] Filtro por forma farmacêutica
- [ ] API com FastAPI
- [ ] Banco SQLite
- [ ] Servidor local (PetTools Server)
- [ ] Múltiplos módulos da suíte PetTools

---

## Objetivo

Este projeto faz parte da futura suíte **PetTools**, um conjunto de ferramentas voltadas à automação de rotinas em pet shops.

O PetCalcula é o primeiro módulo dessa suíte.

---

## Licença

Projeto para fins de estudo e desenvolvimento.
