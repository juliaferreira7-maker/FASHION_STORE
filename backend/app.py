"""API Flask da FASHION STORE, com rotas para as 15 tabelas."""
from flask import Flask, jsonify, request
from flask_cors import CORS
from mysql.connector import Error
from werkzeug.security import generate_password_hash
from conexao import testar_conexao
from daos import DAO
from models import MODELOS

app = Flask(__name__)
CORS(app)  # Permite que o front-end local consulte esta API.


@app.get("/")
def inicio():
    return jsonify({
        "mensagem": "API da FASHION STORE funcionando!",
        "status": "ok",
        "rotas": [f"/api/{modelo.tabela.lower()}" for modelo in MODELOS],
    })


@app.get("/api/status")
def status():
    # O teste abre e fecha uma conexão real com o MySQL.
    conectado = testar_conexao()
    if conectado:
        return jsonify({"api": "online", "banco": "conectado"}), 200
    return jsonify({"api": "online", "banco": "desconectado"}), 503


def registrar_rotas(modelo):
    """Cria GET, GET por ID, POST, PUT e DELETE para um modelo."""
    dao = DAO(modelo)
    nome_rota = modelo.tabela.lower()

    def listar():
        return jsonify(dao.listar())

    def buscar(identificador):
        registro = dao.buscar_por_id(identificador)
        if registro is None:
            return jsonify({"erro": "Registro não encontrado."}), 404
        return jsonify(registro)

    def cadastrar():
        dados = request.get_json(silent=True)
        if not isinstance(dados, dict):
            return jsonify({"erro": "Envie os dados em formato JSON."}), 400
        dados = {campo: valor for campo, valor in dados.items() if campo in modelo.colunas}
        if modelo.__name__ == "Cliente" and dados.get("senha"):
            dados["senha"] = generate_password_hash(str(dados["senha"]))
        novo_id = dao.inserir(dados)
        return jsonify({"mensagem": "Cadastro realizado com sucesso.", "id": novo_id}), 201

    def atualizar(identificador):
        dados = request.get_json(silent=True)
        if not isinstance(dados, dict):
            return jsonify({"erro": "Envie os dados em formato JSON."}), 400
        dados = {campo: valor for campo, valor in dados.items() if campo in modelo.colunas}
        if modelo.__name__ == "Cliente" and dados.get("senha"):
            dados["senha"] = generate_password_hash(str(dados["senha"]))
        quantidade = dao.atualizar(identificador, dados)
        if quantidade == 0:
            return jsonify({"mensagem": "Nenhum registro alterado. Confira o ID."}), 404
        return jsonify({"mensagem": "Registro atualizado com sucesso."})

    def excluir(identificador):
        quantidade = dao.excluir(identificador)
        if quantidade == 0:
            return jsonify({"erro": "Registro não encontrado."}), 404
        return jsonify({"mensagem": "Registro excluído com sucesso."})

    # Endpoints exclusivos para cada tabela evitam conflito de nomes no Flask.
    listar.__name__ = f"listar_{nome_rota}"
    buscar.__name__ = f"buscar_{nome_rota}"
    cadastrar.__name__ = f"cadastrar_{nome_rota}"
    atualizar.__name__ = f"atualizar_{nome_rota}"
    excluir.__name__ = f"excluir_{nome_rota}"

    app.add_url_rule(f"/api/{nome_rota}", view_func=listar, methods=["GET"])
    app.add_url_rule(f"/api/{nome_rota}/<int:identificador>", view_func=buscar, methods=["GET"])
    app.add_url_rule(f"/api/{nome_rota}", view_func=cadastrar, methods=["POST"])
    app.add_url_rule(f"/api/{nome_rota}/<int:identificador>", view_func=atualizar, methods=["PUT"])
    app.add_url_rule(f"/api/{nome_rota}/<int:identificador>", view_func=excluir, methods=["DELETE"])


for modelo_atual in MODELOS:
    registrar_rotas(modelo_atual)


@app.errorhandler(ValueError)
def erro_validacao(erro):
    return jsonify({"erro": str(erro)}), 400


@app.errorhandler(Error)
def erro_banco(erro):
    # Mensagem técnica retornada para facilitar os testes durante o desenvolvimento.
    return jsonify({"erro_banco": str(erro)}), 400


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
