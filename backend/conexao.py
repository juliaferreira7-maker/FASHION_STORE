"""Conexão com o banco MySQL da FASHION STORE."""
import os
import mysql.connector
from mysql.connector import Error


def conectar():
    """Abre uma conexão usando variáveis de ambiente ou os padrões do XAMPP."""
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "fashion_store"),
        charset="utf8mb4",
    )


def testar_conexao():
    """Testa a conexão e mostra uma mensagem simples no terminal."""
    conexao = None
    try:
        conexao = conectar()
        if conexao.is_connected():
            print("Conexão com o banco fashion_store realizada com sucesso!")
            return True
    except Error as erro:
        print(f"Não foi possível conectar ao MySQL: {erro}")
        return False
    finally:
        if conexao is not None and conexao.is_connected():
            conexao.close()
    return False
