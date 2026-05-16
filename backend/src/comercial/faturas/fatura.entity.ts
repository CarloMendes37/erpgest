import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
  OneToMany,
} from 'typeorm';
import { FaturaLinha } from './fatura-linha.entity';

/**
 * Documento comercial (Fatura, NC, ND, Recibo, etc.)
 * Todos os campos críticos incluem tenant_id para isolamento.
 *
 * Tipos: FT=Fatura, FS=Fatura Simplificada, NC=Nota de Crédito,
 *        ND=Nota de Débito, RC=Recibo, OR=Orçamento, GT=Guia Transporte
 * Status: 0=Rascunho, 1=Emitida, 2=Paga, 3=Parcial, 4=Anulada, 5=Vencida
 */
@Entity('com_fatura')
@Index('idx_fat_tenant',        ['tenantId'])
@Index('idx_fat_cliente',       ['tenantId', 'clienteId'])
@Index('idx_fat_numero',        ['tenantId', 'numero'])
@Index('idx_fat_data',          ['tenantId', 'data'])
@Index('idx_fat_status',        ['tenantId', 'status'])
@Index('idx_fat_tipo',          ['tenantId', 'tipo'])
@Index('uq_fat_numero_serie',   ['tenantId', 'numero', 'serie', 'tipo'], { unique: true })
export class Fatura {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** TENANT — presente em todos os queries */
  @Column({ name: 'tenant_id' })
  tenantId: number;

  @Column({ name: 'numero', length: 30 })
  numero: string;

  @Column({ name: 'serie', length: 10, default: 'A' })
  serie: string;

  @Column({ name: 'tipo', length: 2, default: 'FT' })
  tipo: string;

  @Column({ name: 'cliente_id' })
  clienteId: number;

  @Column({ name: 'cliente_nome', length: 200, nullable: true })
  clienteNome: string;

  @Column({ name: 'cliente_nif', length: 20, nullable: true })
  clienteNif: string;

  @Column({ name: 'data', type: 'date' })
  data: string;

  @Column({ name: 'data_vencimento', type: 'date', nullable: true })
  dataVencimento: string;

  @Column({ name: 'data_entrega', type: 'date', nullable: true })
  dataEntrega: string;

  /** Referência ao documento de origem (para NC/ND) */
  @Column({ name: 'referencia_doc', length: 50, nullable: true })
  referenciaDoc: string;

  @Column({ name: 'doc_origem_id', nullable: true })
  docOrigemId: number;

  // ── Totais ──────────────────────────────────────────────
  @Column({ name: 'subtotal', type: 'decimal', precision: 18, scale: 2, default: 0 })
  subtotal: number;

  @Column({ name: 'desconto', type: 'decimal', precision: 18, scale: 2, default: 0 })
  desconto: number;

  @Column({ name: 'base_iva', type: 'decimal', precision: 18, scale: 2, default: 0 })
  baseIva: number;

  @Column({ name: 'total_iva', type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalIva: number;

  @Column({ name: 'total', type: 'decimal', precision: 18, scale: 2, default: 0 })
  total: number;

  @Column({ name: 'total_pago', type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalPago: number;

  @Column({ name: 'saldo', type: 'decimal', precision: 18, scale: 2, default: 0 })
  saldo: number;

  @Column({ name: 'moeda', length: 3, default: 'EUR' })
  moeda: string;

  @Column({ name: 'cambio', type: 'decimal', precision: 12, scale: 6, default: 1 })
  cambio: number;

  /** 0=Rascunho 1=Emitida 2=Paga 3=ParcialmentePaga 4=Anulada 5=Vencida */
  @Column({ name: 'status', type: 'tinyint', default: 0 })
  status: number;

  @Column({ name: 'observacoes', type: 'text', nullable: true })
  observacoes: string;

  @Column({ name: 'notas_rodape', length: 500, nullable: true })
  notasRodape: string;

  @Column({ name: 'cond_pagamento', length: 100, nullable: true })
  condPagamento: string;

  @Column({ name: 'operador_id', nullable: true })
  operadorId: number;

  /** Hash SAF-T / ATCUD para compliance fiscal */
  @Column({ name: 'hash', length: 172, nullable: true })
  hash: string;

  @Column({ name: 'atcud', length: 50, nullable: true })
  atcud: string;

  @OneToMany(() => FaturaLinha, l => l.fatura, { cascade: true, eager: false })
  linhas: FaturaLinha[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
