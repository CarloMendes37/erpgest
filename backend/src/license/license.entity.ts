import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, Index,
} from 'typeorm';

@Entity('sys_license')
@Index('idx_lic_tenant',  ['tenantId'])
@Index('idx_lic_key',     ['licenseKey'], { unique: true })
export class License {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tenant_id' })
  tenantId: number;

  @Column({ name: 'license_key', length: 100, unique: true })
  licenseKey: string;

  @Column({ name: 'ano_fiscal', default: new Date().getFullYear() })
  anoFiscal: number;

  @Column({ name: 'tipo', length: 30, default: 'ANUAL' })
  tipo: string;

  @Column({ name: 'modulos', type: 'text', nullable: true })
  modulos: string;

  @Column({ name: 'max_users', default: 5 })
  maxUsers: number;

  @Column({ name: 'max_faturas', default: 1000 })
  maxFaturas: number;

  @Column({ name: 'ativa', default: true })
  ativa: boolean;

  @Column({ name: 'valida_ate', type: 'date', nullable: true })
  validaAte: string;

  @Column({ name: 'observacoes', type: 'text', nullable: true })
  observacoes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
