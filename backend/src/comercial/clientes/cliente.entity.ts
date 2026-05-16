import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

/**
 * Cliente comercial com isolamento por tenant_id.
 * Todos os queries DEVEM filtrar por tenant_id.
 */
@Entity('com_cliente')
@Index('idx_cli_tenant', ['tenantId'])
@Index('idx_cli_nome',   ['tenantId', 'nome'])
@Index('idx_cli_nif',    ['tenantId', 'nif'])
@Index('idx_cli_email',  ['tenantId', 'email'])
export class Cliente {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** TENANT — obrigatório em todos os queries */
  @Column({ name: 'tenant_id' })
  tenantId: number;

  @Column({ name: 'nome', length: 200 })
  nome: string;

  @Column({ name: 'nif', length: 20, nullable: true })
  nif: string;

  @Column({ name: 'email', length: 150, nullable: true })
  email: string;

  @Column({ name: 'telefone', length: 20, nullable: true })
  telefone: string;

  @Column({ name: 'telemovel', length: 20, nullable: true })
  telemovel: string;

  @Column({ name: 'morada', length: 300, nullable: true })
  morada: string;

  @Column({ name: 'localidade', length: 150, nullable: true })
  localidade: string;

  @Column({ name: 'codigo_postal', length: 15, nullable: true })
  codigoPostal: string;

  @Column({ name: 'pais', length: 3, default: 'PT' })
  pais: string;

  @Column({ name: 'contacto', length: 100, nullable: true })
  contacto: string;

  @Column({ name: 'observacoes', type: 'text', nullable: true })
  observacoes: string;

  @Column({ name: 'limite_credito', type: 'decimal', precision: 18, scale: 2, nullable: true })
  limiteCredito: number;

  @Column({ name: 'prazo_pagamento', default: 30 })
  prazoPagamento: number;

  @Column({ name: 'tipo_preco', default: 1 })
  tipoPreco: number;

  @Column({ name: 'photo_url', length: 500, nullable: true })
  photoUrl: string;

  /** 0=Activo, 1=Inactivo, 2=Bloqueado */
  @Column({ name: 'status', type: 'tinyint', default: 0 })
  status: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
