"""API Flask e servidor do front-end da FASHION STORE."""
import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from mysql.connector import Error
from werkzeug.security import generate_password_hash, check_password_hash
from conexao import testar_conexao, conectar
from daos import DAO
from models import MODELOS

# A pasta frontend fica no mesmo nível da pasta backend.
PASTA_FRONTEND = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
app = Flask(__name__, static_folder=PASTA_FRONTEND, static_url_path="")
CORS(app)


@app.get("/")
def inicio():
    """Entrega a página principal da loja no navegador."""
    return send_from_directory(PASTA_FRONTEND, "index.html")


@app.get("/api/status")
def status():
    """Informa se a API está online e se o MySQL aceita conexão."""
    conectado = testar_conexao()
    if conectado:
        return jsonify({"api": "online", "banco": "conectado"}), 200
    return jsonify({"api": "online", "banco": "desconectado"}), 503


@app.post("/api/login")
def login():
    """Confere e-mail e senha sem devolver o hash da senha ao navegador."""
    dados = request.get_json(silent=True) or {}
    email = str(dados.get("email", "")).strip().lower()
    senha = str(dados.get("senha", ""))
    if not email or not senha:
        return jsonify({"erro": "Informe e-mail e senha."}), 400

    conexao = conectar()
    cursor = conexao.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id_cliente, nome, email, senha FROM CLIENTES WHERE email = %s",
            (email,),
        )
        cliente = cursor.fetchone()
        if not cliente or not check_password_hash(cliente["senha"], senha):
            return jsonify({"erro": "E-mail ou senha inválidos."}), 401
        cliente.pop("senha", None)
        return jsonify(cliente), 200
    finally:
        cursor.close()
        conexao.close()


def remover_senha(registro, modelo):
    """Evita expor hashes de senha nas consultas públicas de clientes."""
    if registro and modelo.__name__ == "Cliente":
        registro.pop("senha", None)
    return registro


def registrar_rotas(modelo):
    """Cria operações GET, GET por ID, POST, PUT e DELETE para cada tabela."""
    dao = DAO(modelo)
    nome_rota = modelo.tabela.lower()

    def listar():
        registros = dao.listar()
        if modelo.__name__ == "Cliente":
            registros = [remover_senha(item, modelo) for item in registros]
        return jsonify(registros)

    def buscar(identificador):
        registro = dao.buscar_por_id(identificador)
        if registro is None:
            return jsonify({"erro": "Registro não encontrado."}), 404
        return jsonify(remover_senha(registro, modelo))

    def cadastrar():
        dados = request.get_json(silent=True)
        if not isinstance(dados, dict):
            return jsonify({"erro": "Envie os dados em formato JSON."}), 400
        dados = {campo: valor for campo, valor in dados.items() if campo in modelo.colunas}
        if modelo.__name__ == "Cliente":
            if not dados.get("nome") or not dados.get("email") or not dados.get("senha"):
                return jsonify({"erro": "Informe nome, e-mail e senha."}), 400
            dados["email"] = str(dados["email"]).strip().lower()
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

    # Cada função recebe um nome exclusivo para o registro das rotas no Flask.
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
    # Retorna uma mensagem para facilitar a identificação de problemas no desenvolvimento.
    return jsonify({"erro_banco": str(erro)}), 400


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
