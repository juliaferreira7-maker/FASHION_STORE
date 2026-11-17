FASHION STORE — ETAPA 3 (FRONT-END INTEGRADO AO FLASK)
=====================================================

O projeto agora contém a loja visual em HTML/CSS/JavaScript e utiliza Fetch para
consumir a API Flask, que executa as operações no banco MySQL fashion_store.

ESTRUTURA
---------
FASHION_STORE_ETAPA3/
  backend/
    app.py                 Flask + rotas da API + entrega da página inicial
    conexao.py             conexão MySQL
    models.py              classes POO das 15 tabelas
    daos.py                operações de banco (CRUD)
    teste_conexao.py       teste da conexão MySQL
    requirements.txt       bibliotecas necessárias
    .env.example           exemplo de configuração (sem senha real)
  frontend/
    index.html             página da loja
    css/style.css          identidade visual responsiva
    js/app.js              interações e chamadas Fetch
    img/                   imagens dos produtos
  database/
    fashion_store_banco.sql
  .gitignore

ANTES DE COMEÇAR
----------------
1. O MySQL do XAMPP deve estar iniciado.
2. O banco fashion_store e suas 15 tabelas já foram criados na Etapa 2.
   NÃO importe o SQL novamente no banco que já contém dados. O script inclui
   comandos DROP TABLE IF EXISTS e pode apagar registros existentes.
3. Python e as bibliotecas do requirements.txt devem estar instalados.

COMO COLOCAR NO PROJETO LOCAL
-----------------------------
Extraia o ZIP e copie as pastas backend, frontend e database, além do arquivo
.gitignore e deste README, para dentro da pasta principal do seu repositório
FASHION_STORE. Quando o Windows perguntar, permita substituir os arquivos
existentes da pasta backend pelos desta Etapa 3. Não apague sua pasta documentação.

COMO EXECUTAR NO WINDOWS / VS CODE
----------------------------------
1. Abra no VS Code a pasta principal FASHION_STORE (a que contém backend e frontend).
2. Inicie o MySQL no XAMPP.
3. Abra o terminal do VS Code e entre na pasta backend:
      cd backend
4. Se as bibliotecas ainda não estiverem instaladas:
      python -m pip install -r requirements.txt
5. Inicie a aplicação:
      python app.py
6. Deixe o terminal aberto e acesse no navegador:
      http://127.0.0.1:5000/

A página inicial e os arquivos CSS/JS são servidos pelo próprio Flask. Não abra
o index.html com duplo clique e não use Live Server: a página precisa acessar a API.

PRIMEIRO TESTE DO CATÁLOGO
--------------------------
Como o banco foi criado vazio, a vitrine exibirá a opção CARREGAR CATÁLOGO
DEMONSTRATIVO. Clique nela uma única vez. A aplicação cria categorias, tamanhos,
cores, produtos de demonstração, variações e quantidades de estoque. Os dados
são gravados no MySQL. Não clique repetidamente se a operação já terminou.

FLUXO PARA DEMONSTRAÇÃO
-----------------------
1. Abra a loja e confirme a mensagem de API conectada.
2. Carregue o catálogo demonstrativo (somente na primeira vez, se estiver vazio).
3. Abra Entrar > Criar conta e cadastre um cliente.
4. Faça login com o e-mail e a senha cadastrados.
5. Escolha um produto, selecione tamanho/cor e adicione à Sacola.
6. Clique em Finalizar pedido, informe endereço e forma de pagamento.
   O pagamento é apenas uma simulação escolar: nenhum valor é cobrado.
7. Consulte Meus pedidos e Meus favoritos.
8. Na seção Gerenciar loja, teste cadastro de categoria, tamanho, cor e produto.

ROTAS PRINCIPAIS
---------------
GET    /api/status
GET    /api/produtos
POST   /api/produtos
GET    /api/categorias
POST   /api/categorias
POST   /api/clientes
POST   /api/login
GET    /api/favoritos
POST   /api/favoritos
GET    /api/pedidos
POST   /api/pedidos

Também existem GET por ID, PUT e DELETE para as 15 tabelas, usando os nomes
em minúsculas, por exemplo /api/produtos/1 e /api/estoque/1.

IMAGENS DE PRODUTOS
-------------------
Coloque os arquivos dentro de frontend/img/. No campo Caminho da imagem,
informe, por exemplo, img/blusa-serena.jpg. Também é possível usar uma URL
completa de imagem.

ENVIAR PARA O GITHUB
-------------------
Copie a estrutura desta Etapa 3 para dentro do repositório local FASHION_STORE.
No VS Code, abra Controle do Código-Fonte, prepare as alterações, use a mensagem
'Integrando front-end HTML CSS JS à API Flask' e faça Commit e Push/Sync.
Não envie .env, senhas, pastas __pycache__ ou ambientes virtuais.

OBSERVAÇÕES IMPORTANTES
-----------------------
- O sistema é um projeto demonstrativo escolar, não uma loja pronta para produção.
- O checkout registra pedido e pagamento pendente; não processa Pix/cartão reais.
- A sessão do cliente no navegador é simples e serve para demonstração escolar.
- O servidor Flask debug=True é apropriado apenas para desenvolvimento local.
- Caso mude usuário/senha/porta do MySQL, ajuste as variáveis de ambiente DB_HOST,
  DB_PORT, DB_USER, DB_PASSWORD e DB_NAME antes de executar o app.py.
