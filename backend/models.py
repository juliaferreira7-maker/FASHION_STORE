"""Modelos POO correspondentes às 15 tabelas do banco FASHION STORE."""


class ModeloBase:
    """Define o nome da tabela, a chave primária e as colunas permitidas."""
    tabela = ""
    chave_primaria = "id"
    colunas = ()


class Categoria(ModeloBase):
    tabela = "CATEGORIAS"
    chave_primaria = "id_categoria"
    colunas = ("id_categoria", "nome", "id_categoria_pai")


class Cliente(ModeloBase):
    tabela = "CLIENTES"
    chave_primaria = "id_cliente"
    colunas = ("id_cliente", "nome", "email", "senha", "telefone", "data_cadastro")


class Tamanho(ModeloBase):
    tabela = "TAMANHOS"
    chave_primaria = "id_tamanho"
    colunas = ("id_tamanho", "nome")


class Cor(ModeloBase):
    tabela = "CORES"
    chave_primaria = "id_cor"
    colunas = ("id_cor", "nome", "codigo_hex")


class Produto(ModeloBase):
    tabela = "PRODUTOS"
    chave_primaria = "id_produto"
    colunas = ("id_produto", "id_categoria", "nome", "descricao", "preco", "ativo")


class Endereco(ModeloBase):
    tabela = "ENDERECOS"
    chave_primaria = "id_endereco"
    colunas = ("id_endereco", "id_cliente", "cep", "rua", "numero", "cidade", "estado")


class Carrinho(ModeloBase):
    tabela = "CARRINHOS"
    chave_primaria = "id_carrinho"
    colunas = ("id_carrinho", "id_cliente", "status", "data_criacao")


class Favorito(ModeloBase):
    tabela = "FAVORITOS"
    chave_primaria = "id_favorito"
    colunas = ("id_favorito", "id_cliente", "id_produto", "data_adicao")


class ImagemProduto(ModeloBase):
    tabela = "IMAGENS_PRODUTOS"
    chave_primaria = "id_imagem"
    colunas = ("id_imagem", "id_produto", "caminho_imagem", "imagem_principal")


class VariacaoProduto(ModeloBase):
    tabela = "VARIACOES_PRODUTOS"
    chave_primaria = "id_variacao"
    colunas = ("id_variacao", "id_produto", "id_tamanho", "id_cor", "sku")


class Pedido(ModeloBase):
    tabela = "PEDIDOS"
    chave_primaria = "id_pedido"
    colunas = ("id_pedido", "id_cliente", "id_endereco", "valor_total", "status", "data_pedido")


class ItemCarrinho(ModeloBase):
    tabela = "ITENS_CARRINHO"
    chave_primaria = "id_item_carrinho"
    colunas = ("id_item_carrinho", "id_carrinho", "id_variacao", "quantidade")


class Estoque(ModeloBase):
    tabela = "ESTOQUE"
    chave_primaria = "id_estoque"
    colunas = ("id_estoque", "id_variacao", "quantidade")


class Pagamento(ModeloBase):
    tabela = "PAGAMENTOS"
    chave_primaria = "id_pagamento"
    colunas = ("id_pagamento", "id_pedido", "forma_pagamento", "valor", "status", "data_pagamento")


class ItemPedido(ModeloBase):
    tabela = "ITENS_PEDIDO"
    chave_primaria = "id_item_pedido"
    colunas = ("id_item_pedido", "id_pedido", "id_variacao", "quantidade", "preco_unitario")


# Lista única usada pelo Flask para registrar as rotas de todas as tabelas.
MODELOS = (
    Categoria, Cliente, Tamanho, Cor, Produto, Endereco, Carrinho, Favorito,
    ImagemProduto, VariacaoProduto, Pedido, ItemCarrinho, Estoque, Pagamento,
    ItemPedido,
)
