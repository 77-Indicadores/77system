# ADR 0002: Monolito Modular

## Status

Aceito

## Contexto

O sistema sera personalizado por cliente e desenvolvido pela equipe 77 com auxilio de IA. A stack precisa ser produtiva, clara e facil de operar.

## Decisao

Usar monolito modular como arquitetura base.

## Consequencias

Positivas:

- Menos infraestrutura.
- Mais velocidade no desenvolvimento.
- Debug mais simples.
- Melhor para template Git por cliente.

Negativas:

- Exige disciplina de separacao por dominio.
- Jobs pesados precisam ser isolados para nao prejudicar a aplicacao web.

## Regras

- Separar dominios em modulos claros.
- Evitar dependencias circulares.
- Colocar integracoes e jobs fora da UI.
- Usar servico Python interno quando Catworld ou processamento de dados justificar.
