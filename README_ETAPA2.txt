FASHION STORE — ETAPA 2 (BACK-END PYTHON)

CONTEÚDO
- backend/: API Flask, modelos POO, DAO, conexão e teste do MySQL.
- database/fashion_store_banco.sql: script que cria as 15 tabelas do projeto.

1. BANCO DE DADOS
- Abra o XAMPP e inicie o MySQL.
- Abra http://localhost/phpmyadmin.
- Selecione o banco fashion_store.
- Clique em Importar, escolha database/fashion_store_banco.sql e execute.
- IMPORTANTE: o script original contém DROP TABLE IF EXISTS. Isso apaga e recria as tabelas caso já existam. Use somente quando puder recriar a estrutura e perder os dados atuais. Não execute novamente depois de inserir dados sem fazer backup.

2. INSTALAR AS BIBLIOTECAS
- Abra a pasta backend no VS Code.
- No terminal, execute:
  python -m pip install -r requirements.txt

3. TESTAR A CONEXÃO
- Com o MySQL do XAMPP iniciado, execute:
  python teste_conexao.py
- A mensagem esperada é:
  Conexão com o banco fashion_store realizada com sucesso!

4. INICIAR A API
- Execute:
  python app.py
- Abra no navegador:
  http://127.0.0.1:5000/
  http://127.0.0.1:5000/api/status
  http://127.0.0.1:5000/api/produtos

5. ROTAS DA API
Para cada tabela existem:
- GET    /api/<tabela>          lista os registros
- GET    /api/<tabela>/<id>     consulta um registro
- POST   /api/<tabela>          cadastra um registro em JSON
- PUT    /api/<tabela>/<id>     atualiza um registro em JSON
- DELETE /api/<tabela>/<id>     exclui um registro

Exemplo de cadastro de categoria (JSON):
{
  "nome": "Blusas",
  "id_categoria_pai": null
}

Para cadastrar um produto, primeiro cadastre uma categoria e informe seu id_categoria.
Para cadastrar variações, primeiro cadastre produto, tamanho e cor. Respeite as chaves estrangeiras.
As senhas enviadas para cadastro/atualização de clientes são armazenadas com hash.

OBSERVAÇÃO
O teste de conexão informado pelo usuário já foi concluído com sucesso nesta etapa. A execução das rotas deve ser testada localmente após a importação das tabelas.
