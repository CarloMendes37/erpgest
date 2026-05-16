import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Fatura } from './fatura.entity';

@Entity('com_fatura_linha')
@Index('idx_fl_tenant',  ['tenantId'])
@Index('idx_fl_fatura',  ['faturaId'])
@Index('idx_fl_artigo',  ['artigoId'])
export class FaturaLinha {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'tenant_id' })
  tenantId: number;

  @Column({ name: 'fatura_id' })
  faturaId: number;

  @ManyToOne(() => Fatura, f => f.linhas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fatura_id' })
  fatura: Fatura;

  @Column({ name: 'linha_num', default: 1 })
  linhaNum: number;

  @Column({ name: 'artigo_id', nullable: true })
  artigoId: number;

  @Column({ name: 'artigo_codigo', length: 50, nullable: true })
  artigoCodigo: string;

  @Column({ name: 'descricao', length: 500 })
  descricao: string;

  @Column({ name: 'quantidade', type: 'decimal', precision: 18, scale: 3, default: 1 })
  quantidade: number;

  @Column({ name: 'preco_unit', type: 'decimal', precision: 18, scale: 4, default: 0 })
  precoUnit: number;

  @Column({ name: 'desconto1', type: 'decimal', precision: 5, scale: 2, default: 0 })
  desconto1: number;

  @Column({ name: 'desconto2', type: 'decimal', precision: 5, scale: 2, default: 0 })
  desconto2: number;

  @Column({ name: 'taxa_iva', type: 'decimal', precision: 5, scale: 2, default: 23 })
  taxaIva: number;

  @Column({ name: 'base_tributavel', type: 'decimal', precision: 18, scale: 2, default: 0 })
  baseTributavel: number;

  @Column({ name: 'valor_iva', type: 'decimal', precision: 18, scale: 2, default: 0 })
  valorIva: number;

  @Column({ name: 'total_linha', type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalLinha: number;

  @Column({ name: 'unidade', length: 10, default: 'UN' })
  unidade: string;

  @Column({ name: 'observacoes', length: 500, nullable: true })
  observacoes: string;
}
