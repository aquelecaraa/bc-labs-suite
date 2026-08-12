# BC Labs: Business Intelligence

BC Labs — Dashboard de Gestão e Inteligência

Crie uma aplicação web completa chamada BC Labs, uma plataforma interna de gestão financeira, vendas, clientes, despesas e inteligência de negócios.

A aplicação deve ter aparência de um software SaaS premium, moderno e tecnológico. Não quero uma landing page: quero uma dashboard/app funcional, com navegação entre páginas e dados estruturados.

1. Identidade da BC Labs

Nome:
BC Labs

Subtítulo:
Business Intelligence & Automation

A marca deve transmitir:

tecnologia

inteligência

automação

crescimento

profissionalismo

simplicidade

Visual premium, moderno e minimalista.

2. Design

Use uma interface predominantemente dark.

Paleta sugerida:

fundo: quase preto

cards: cinza muito escuro

bordas: cinza discreto

texto principal: branco

texto secundário: cinza

cor de destaque: azul elétrico/azul claro

Não exagerar nos efeitos.

Usar:

glassmorphism muito sutil

bordas arredondadas

sombras suaves

microanimações

transições rápidas

gráficos modernos

ícones do Lucide

A interface deve parecer um produto SaaS profissional, não um template genérico.

3. Layout principal

Criar uma sidebar fixa no desktop.

Sidebar:

BC Labs

Dashboard
Vendas
Clientes
Despesas
Relatórios
BC AI

Separador

Configurações

Na parte inferior da sidebar:

avatar do usuário

nome do usuário

status "Online"

No mobile, transformar a sidebar em menu responsivo.

No topo das páginas:

título da página

descrição curta

seletor de período quando necessário

ações principais

4. Dashboard principal

A página inicial deve ser "Dashboard".

Criar uma área de visão geral com seletor:

Hoje
7 dias
Este mês
Mês passado
Este ano
Personalizado

Cards principais

Mostrar:

Faturamento
Valor total recebido no período.

Lucro líquido
Faturamento - despesas - taxas.

Vendas
Quantidade de vendas.

Ticket médio
Faturamento / quantidade de vendas.

Despesas
Total gasto no período.

Margem de lucro
Lucro líquido / faturamento.

Cada card deve mostrar:

valor principal

comparação com período anterior

indicador de crescimento/queda

pequeno ícone

5. Gráfico de faturamento

Criar gráfico de linha/área mostrando:

Faturamento
Lucro

Por dia ou por mês dependendo do período selecionado.

Tooltip interativo.

6. Gráfico de despesas

Criar gráfico mostrando despesas agrupadas por categoria:

Ferramentas

Inteligência Artificial

Site/Hospedagem

Marketing

Operacional

Outros

Usar gráfico de donut.

Ao passar o mouse, mostrar:
categoria, valor e porcentagem.

7. Vendas recentes

Criar tabela "Vendas recentes".

Colunas:

Cliente
Produto/Serviço
Data
Valor bruto
Taxas
Custos
Lucro
Status

Status:

Pago

Pendente

Cancelado

Cada venda deve poder ser aberta para visualizar seus detalhes.

8. Página Vendas

Criar uma página completa para gerenciamento das vendas.

No topo:

Total de vendas
Faturamento
Lucro
Ticket médio

Criar botão:

+ Nova venda

Ao clicar, abrir modal/formulário com:

Cliente
Produto/Serviço
Data
Valor bruto
Forma de pagamento
Taxa
Custos relacionados
Status
Observações

Calcular automaticamente:

Valor líquido = valor bruto - taxas

Lucro = valor bruto - taxas - custos

Margem = lucro / valor bruto

Permitir editar e excluir vendas.

Adicionar:

busca

filtros

filtro por período

filtro por cliente

filtro por status

filtro por produto/serviço

9. Página Clientes

Criar gerenciamento de clientes.

Cards superiores:

Clientes ativos
Novos clientes
Receita por cliente
Ticket médio

Tabela:

Cliente
Contato
Total gasto
Número de compras
Última compra
Status

Ao clicar em um cliente, abrir uma página detalhada.

Página do cliente:

Nome
Email
Telefone
Data de cadastro
Status

Resumo:

Total gasto
Número de compras
Ticket médio
Última compra

Mostrar histórico completo das compras.

Mostrar gráfico de evolução do faturamento daquele cliente.

10. Página Despesas

Criar gerenciamento de despesas.

Botão:

+ Nova despesa

Campos:

Descrição
Categoria
Valor
Data
Recorrente?
Observações

Categorias:

Ferramentas
IA
Site/Hospedagem
Marketing
Publicidade
Operacional
Equipamentos
Serviços
Outros

Criar tabela:

Descrição
Categoria
Data
Valor
Recorrente
Ações

Criar cards:

Despesas do mês
Despesas recorrentes
Gasto com IA
Gasto com ferramentas

11. Controle específico de custos de IA

Criar uma seção especial chamada:

AI Spend

Mostrar quanto a BC Labs gastou com ferramentas de inteligência artificial.

Exemplos de categorias:

OpenAI
Claude
Lovable
Gemini
APIs
Outras IAs

Mostrar:

Gasto atual
Gasto do mês anterior
Variação
Gasto acumulado no ano

Criar gráfico mensal.

Não inventar integrações reais ainda. Preparar a estrutura para que essas informações possam ser conectadas posteriormente a APIs ou inseridas manualmente.

12. Página Relatórios

Criar uma página de relatórios financeiros.

Permitir selecionar:

Mês
Trimestre
Ano
Período personalizado

Mostrar:

Faturamento
Despesas
Lucro
Margem
Número de vendas
Ticket médio

Criar gráficos:

Faturamento por período
Lucro por período
Despesas por categoria
Receita por cliente
Receita por produto/serviço

Adicionar botão:

Gerar relatório

Por enquanto, pode gerar uma visualização/preview do relatório e preparar a estrutura para futuramente exportar PDF.

13. BC AI

Esta é uma das partes mais importantes da aplicação.

Criar uma página chamada:

BC AI

Subtítulo:

"Seu copiloto de negócios."

Interface semelhante a um chat moderno.

No topo:

✨ BC AI

"Pergunte qualquer coisa sobre os dados da sua empresa."

Criar exemplos de perguntas:

"Quanto faturamos este mês?"

"Qual foi nossa venda mais lucrativa?"

"Qual cliente mais gerou receita?"

"Quanto gastamos com inteligência artificial?"

"Quais foram nossas maiores despesas?"

"Nosso lucro aumentou ou diminuiu?"

"Qual foi nosso ticket médio?"

"Compare este mês com o mês passado."

"Quanto precisamos vender para faturar R$ 20.000?"

Criar respostas visualmente ricas, podendo apresentar:

números

porcentagens

pequenos gráficos

comparações

insights

IMPORTANTE:

Nesta primeira versão, criar toda a interface e estrutura do BC AI, mas não fingir que existe uma IA conectada caso nenhuma API esteja configurada.

Preparar a arquitetura para posteriormente conectar uma API de IA.

A IA deverá futuramente consultar os dados reais do banco de dados da BC Labs antes de responder.

14. Insights automáticos

Na Dashboard, criar uma seção:

Insights da BC AI

Exemplo visual:

✨ Insight da IA

"O faturamento deste mês está 18% acima do mês anterior, porém suas despesas com ferramentas aumentaram 24%."

Outro exemplo:

"Seu cliente com maior faturamento representa 31% da receita total."

Esses textos podem utilizar dados de demonstração inicialmente, mas devem ficar claramente estruturados para serem substituídos por dados reais posteriormente.

15. Banco de dados

Preparar a aplicação para usar Supabase.

Estrutura esperada:

users

clients

sales

expenses

products

categories

ai_usage

settings

Cada venda deve possuir relacionamento com um cliente.

Cada despesa deve possuir uma categoria.

Cada registro deve possuir:

id

created_at

updated_at

Preparar Row Level Security para que os dados sejam privados e vinculados ao usuário autenticado.

Não expor chaves secretas no frontend.

16. Dados de demonstração

Criar dados mock/demonstração suficientes para que a interface fique visualmente preenchida na primeira execução.

IMPORTANTE:

Identificar internamente esses dados como dados de demonstração e deixar a estrutura pronta para substituição pelos dados reais.

Não usar empresas ou pessoas reais como clientes fictícios.

Usar nomes genéricos como:

Cliente Alpha
Cliente Beta
Cliente Gamma
Cliente Delta

17. Autenticação

Preparar autenticação utilizando Supabase.

Criar:

Login
Cadastro
Logout
Proteção das rotas

A aplicação deve redirecionar usuários não autenticados para a página de login.

Criar uma página de login visualmente consistente com a identidade da BC Labs.

18. Responsividade

A aplicação precisa funcionar muito bem em:

Desktop
Notebook
Tablet
Celular

No celular:

sidebar vira menu

tabelas devem possuir scroll horizontal ou layout adaptado

cards devem se reorganizar

gráficos devem continuar legíveis

19. UX

Adicionar:

estados de loading

skeletons

empty states

mensagens de sucesso

mensagens de erro

confirmação antes de excluir registros

tooltips

validação de formulários

Nunca deixar uma ação sem feedback visual.

20. Estrutura técnica

Utilizar:

React
TypeScript
Tailwind CSS
shadcn/ui
Lucide Icons
Recharts

Manter componentes reutilizáveis.

Criar uma estrutura organizada de pastas.

Evitar código duplicado.

Separar:

componentes

páginas

hooks

serviços

tipos

dados mock

lógica financeira

21. Regras de cálculo

Implementar corretamente:

Faturamento =
soma das vendas pagas

Receita líquida =
faturamento - taxas

Lucro líquido =
faturamento - taxas - despesas

Ticket médio =
faturamento / quantidade de vendas

Margem de lucro =
lucro líquido / faturamento × 100

Crescimento =
(valor atual - valor anterior) / valor anterior × 100

Não considerar vendas canceladas no faturamento.

Vendas pendentes não devem entrar como dinheiro recebido.

22. Aparência dos números

Valores monetários devem utilizar formato brasileiro:

R$ 1.500,00

Percentuais:

18,5%

Datas:

12/08/2026

Usar locale pt-BR.

23. Página de configurações

Criar:

Perfil
Empresa
Preferências
Categorias
Integrações

Na seção Integrações, criar cards para:

Supabase
OpenAI
Anthropic
Google Gemini
Stripe
Outras

Mostrar como:

Não conectado

Não criar integrações falsas.

24. Segurança

Não colocar API keys diretamente no frontend.

Utilizar variáveis de ambiente.

Preparar o projeto para uso seguro de:

SUPABASE_URL
SUPABASE_ANON_KEY
OPENAI_API_KEY

A chave da OpenAI, quando implementada, deverá ser utilizada somente através de backend/server-side functions.

25. Resultado esperado

Quero que a primeira versão pareça um produto real chamado:

BC Labs

e não um protótipo escolar.

Priorize:

Visual premium

Dashboard funcional

Navegação completa

Cálculos financeiros corretos

Estrutura de banco preparada

Responsividade

UX profissional

Estrutura preparada para IA

Comece construindo a aplicação completa com dados de demonstração.

Não adicione funcionalidades desnecessárias apenas para deixar o projeto maior.

A experiência deve ser limpa, rápida e profissional.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6745ceae-14e6-4ca0-947e-53aaac1d0e7d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
