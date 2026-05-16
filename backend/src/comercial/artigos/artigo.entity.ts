import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

@Entity('com_artigo')
@Index('idx_art_tenant',    ['tenantId'])
@Index('idx_art_codigo',    ['tenantId', 'codigo'], { unique: true })
@Index('idx_art_descricao', ['tenantId', 'descricao'])
export class Artigo {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'tenant_id' })
  tenantId: number;

  @Column({ name: 'codigo', length: 50 })
  codigo: string;

  @Column({ name: 'descricao', length: 300 })
  descricao: string;

  @Column({ name: 'descricao_longa', type: 'text', nullable: true })
  descricaoLonga: string;

  @Column({ name: 'unidade', length: 10, default: 'UN' })
  unidade: string;

  @Column({ name: 'preco1', type: 'decimal', precision: 18, scale: 4, default: 0 })
  preco1: number;

  @Column({ name: 'preco2', type: 'decimal', precision: 18, scale: 4, default: 0 })
  preco2: number;

  @Column({ name: 'preco3', type: 'decimal', precision: 18, scale: 4, default: 0 })
  preco3: number;

  @Column({ name: 'preco_custo', type: 'decimal', precision: 18, scale: 4, default: 0 })
  precoCusto: number;

  @Column({ name: 'taxa_iva', type: 'decimal', precision: 5, scale: 2, default: 23 })
  taxaIva: number;

  @Column({ name: 'stock_atual', type: 'decimal', precision: 18, scale: 3, default: 0 })
  stockAtual: number;

  @Column({ name: 'stock_minimo', type: 'decimal', precision: 18, scale: 3, default: 0 })
  stockMinimo: number;

  @Column({ name: 'stock_maximo', type: 'decimal', precision: 18, scale: 3, nullable: true })
  stockMaximo: number;

  @Column({ name: 'categoria', length: 100, nullable: true })
  categoria: string;

  @Column({ name: 'subcategoria', length: 100, nullable: true })
  subcategoria: string;

  @Column({ name: 'referencia_fornecedor', length: 100, nullable: true })
  referenciaFornecedor: string;

  @Column({ name: 'codigo_barras', length: 50, nullable: true })
  codigoBarras: string;

  @Column({ name: 'peso', type: 'decimal', precision: 10, scale: 3, nullable: true })
  peso: number;

  @Column({ name: 'imagem_url', length: 500, nullable: true })
  imagemUrl: string;

  @Column({ name: 'ativo', default: true })
  ativo: boolean;

  @Column({ name: 'servico', default: false })
  servico: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
