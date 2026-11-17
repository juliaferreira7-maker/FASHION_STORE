"""DAO genérico: concentra as consultas SQL de cada modelo."""
from mysql.connector import Error
from conexao import conectar


class DAO:
    """Executa operações de banco usando apenas tabelas/colunas dos modelos."""
    def __init__(self, modelo):
        self.modelo = modelo

    def listar(self):
        conexao = conectar()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(f"SELECT * FROM `{self.modelo.tabela}`")
            return cursor.fetchall()
        finally:
            cursor.close()
            conexao.close()

    def buscar_por_id(self, identificador):
        conexao = conectar()
        cursor = conexao.cursor(dictionary=True)
        try:
            sql = (f"SELECT * FROM `{self.modelo.tabela}` "
                   f"WHERE `{self.modelo.chave_primaria}` = %s")
            cursor.execute(sql, (identificador,))
            return cursor.fetchone()
        finally:
            cursor.close()
            conexao.close()

    def inserir(self, dados):
        # A chave primária é auto_increment e por isso é gerada pelo MySQL.
        permitidas = [c for c in self.modelo.colunas if c != self.modelo.chave_primaria]
        campos = [campo for campo in dados if campo in permitidas]
        if not campos:
            raise ValueError("Informe pelo menos um campo válido para cadastro.")
        valores = [dados[campo] for campo in campos]
        nomes_sql = ", ".join(f"`{campo}`" for campo in campos)
        marcadores = ", ".join(["%s"] * len(campos))
        sql = f"INSERT INTO `{self.modelo.tabela}` ({nomes_sql}) VALUES ({marcadores})"

        conexao = conectar()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, valores)
            conexao.commit()
            return cursor.lastrowid
        except Error:
            conexao.rollback()
            raise
        finally:
            cursor.close()
            conexao.close()

    def atualizar(self, identificador, dados):
        # Atualiza somente colunas declaradas no modelo; nunca altera a chave primária.
        permitidas = [c for c in self.modelo.colunas if c != self.modelo.chave_primaria]
        campos = [campo for campo in dados if campo in permitidas]
        if not campos:
            raise ValueError("Informe pelo menos um campo válido para atualização.")
        atribuicoes = ", ".join(f"`{campo}` = %s" for campo in campos)
        valores = [dados[campo] for campo in campos]
        valores.append(identificador)
        sql = (f"UPDATE `{self.modelo.tabela}` SET {atribuicoes} "
               f"WHERE `{self.modelo.chave_primaria}` = %s")

        conexao = conectar()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, valores)
            conexao.commit()
            return cursor.rowcount
        except Error:
            conexao.rollback()
            raise
        finally:
            cursor.close()
            conexao.close()

    def excluir(self, identificador):
        sql = (f"DELETE FROM `{self.modelo.tabela}` "
               f"WHERE `{self.modelo.chave_primaria}` = %s")
        conexao = conectar()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, (identificador,))
            conexao.commit()
            return cursor.rowcount
        except Error:
            conexao.rollback()
            raise
        finally:
            cursor.close()
            conexao.close()
