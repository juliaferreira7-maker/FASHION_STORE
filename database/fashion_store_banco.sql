-- FASHION STORE
-- Modelo relacional baseado nas 15 tabelas das imagens de referência.
-- Tipos mantidos conforme o diagrama; tamanhos foram definidos para MySQL.
-- Execute no MySQL/MariaDB (por exemplo, pelo phpMyAdmin do XAMPP).

CREATE DATABASE IF NOT EXISTS fashion_store
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fashion_store;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS ITENS_PEDIDO;
DROP TABLE IF EXISTS PAGAMENTOS;
DROP TABLE IF EXISTS ESTOQUE;
DROP TABLE IF EXISTS ITENS_CARRINHO;
DROP TABLE IF EXISTS PEDIDOS;
DROP TABLE IF EXISTS VARIACOES_PRODUTOS;
DROP TABLE IF EXISTS IMAGENS_PRODUTOS;
DROP TABLE IF EXISTS FAVORITOS;
DROP TABLE IF EXISTS CARRINHOS;
DROP TABLE IF EXISTS ENDERECOS;
DROP TABLE IF EXISTS PRODUTOS;
DROP TABLE IF EXISTS CORES;
DROP TABLE IF EXISTS TAMANHOS;
DROP TABLE IF EXISTS CLIENTES;
DROP TABLE IF EXISTS CATEGORIAS;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE CATEGORIAS (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100),
    id_categoria_pai INT NULL,
    CONSTRAINT fk_categorias_pai
      FOREIGN KEY (id_categoria_pai) REFERENCES CATEGORIAS(id_categoria)
) ENGINE=InnoDB;

CREATE TABLE CLIENTES (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150),
    email VARCHAR(255) UNIQUE,
    senha VARCHAR(255),
    telefone VARCHAR(20),
    data_cadastro DATETIME
) ENGINE=InnoDB;

CREATE TABLE TAMANHOS (
    id_tamanho INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE CORES (
    id_cor INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) UNIQUE,
    codigo_hex CHAR(7)
) ENGINE=InnoDB;

CREATE TABLE PRODUTOS (
    id_produto INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria INT,
    nome VARCHAR(150),
    descricao TEXT,
    preco DECIMAL(10,2),
    ativo BOOLEAN,
    CONSTRAINT fk_produtos_categoria
      FOREIGN KEY (id_categoria) REFERENCES CATEGORIAS(id_categoria)
) ENGINE=InnoDB;

CREATE TABLE ENDERECOS (
    id_endereco INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT,
    cep VARCHAR(9),
    rua VARCHAR(150),
    numero VARCHAR(20),
    cidade VARCHAR(100),
    estado CHAR(2),
    CONSTRAINT fk_enderecos_cliente
      FOREIGN KEY (id_cliente) REFERENCES CLIENTES(id_cliente)
) ENGINE=InnoDB;

CREATE TABLE CARRINHOS (
    id_carrinho INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT,
    status VARCHAR(30),
    data_criacao DATETIME,
    CONSTRAINT fk_carrinhos_cliente
      FOREIGN KEY (id_cliente) REFERENCES CLIENTES(id_cliente)
) ENGINE=InnoDB;

CREATE TABLE FAVORITOS (
    id_favorito INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT,
    id_produto INT,
    data_adicao DATETIME,
    CONSTRAINT fk_favoritos_cliente
      FOREIGN KEY (id_cliente) REFERENCES CLIENTES(id_cliente),
    CONSTRAINT fk_favoritos_produto
      FOREIGN KEY (id_produto) REFERENCES PRODUTOS(id_produto)
) ENGINE=InnoDB;

CREATE TABLE IMAGENS_PRODUTOS (
    id_imagem INT AUTO_INCREMENT PRIMARY KEY,
    id_produto INT,
    caminho_imagem VARCHAR(500),
    imagem_principal BOOLEAN,
    CONSTRAINT fk_imagens_produto
      FOREIGN KEY (id_produto) REFERENCES PRODUTOS(id_produto)
) ENGINE=InnoDB;

CREATE TABLE VARIACOES_PRODUTOS (
    id_variacao INT AUTO_INCREMENT PRIMARY KEY,
    id_produto INT,
    id_tamanho INT,
    id_cor INT,
    sku VARCHAR(100) UNIQUE,
    CONSTRAINT fk_variacoes_produto
      FOREIGN KEY (id_produto) REFERENCES PRODUTOS(id_produto),
    CONSTRAINT fk_variacoes_tamanho
      FOREIGN KEY (id_tamanho) REFERENCES TAMANHOS(id_tamanho),
    CONSTRAINT fk_variacoes_cor
      FOREIGN KEY (id_cor) REFERENCES CORES(id_cor)
) ENGINE=InnoDB;

CREATE TABLE PEDIDOS (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT,
    id_endereco INT,
    valor_total DECIMAL(10,2),
    status VARCHAR(30),
    data_pedido DATETIME,
    CONSTRAINT fk_pedidos_cliente
      FOREIGN KEY (id_cliente) REFERENCES CLIENTES(id_cliente),
    CONSTRAINT fk_pedidos_endereco
      FOREIGN KEY (id_endereco) REFERENCES ENDERECOS(id_endereco)
) ENGINE=InnoDB;

CREATE TABLE ITENS_CARRINHO (
    id_item_carrinho INT AUTO_INCREMENT PRIMARY KEY,
    id_carrinho INT,
    id_variacao INT,
    quantidade INT,
    CONSTRAINT fk_itens_carrinho_carrinho
      FOREIGN KEY (id_carrinho) REFERENCES CARRINHOS(id_carrinho),
    CONSTRAINT fk_itens_carrinho_variacao
      FOREIGN KEY (id_variacao) REFERENCES VARIACOES_PRODUTOS(id_variacao)
) ENGINE=InnoDB;

CREATE TABLE ESTOQUE (
    id_estoque INT AUTO_INCREMENT PRIMARY KEY,
    id_variacao INT,
    quantidade INT,
    CONSTRAINT fk_estoque_variacao
      FOREIGN KEY (id_variacao) REFERENCES VARIACOES_PRODUTOS(id_variacao)
) ENGINE=InnoDB;

CREATE TABLE PAGAMENTOS (
    id_pagamento INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT,
    forma_pagamento VARCHAR(50),
    valor DECIMAL(10,2),
    status VARCHAR(30),
    data_pagamento DATETIME,
    CONSTRAINT fk_pagamentos_pedido
      FOREIGN KEY (id_pedido) REFERENCES PEDIDOS(id_pedido)
) ENGINE=InnoDB;

CREATE TABLE ITENS_PEDIDO (
    id_item_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT,
    id_variacao INT,
    quantidade INT,
    preco_unitario DECIMAL(10,2),
    CONSTRAINT fk_itens_pedido_pedido
      FOREIGN KEY (id_pedido) REFERENCES PEDIDOS(id_pedido),
    CONSTRAINT fk_itens_pedido_variacao
      FOREIGN KEY (id_variacao) REFERENCES VARIACOES_PRODUTOS(id_variacao)
) ENGINE=InnoDB;
