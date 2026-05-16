import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

/**
 * AuthTenant — representa uma organização/empresa no sistema multi-tenant.
 * Cada tenant possui dados isolados através de tenant_id em todas as tabelas.
 * O slug é o identificador técnico usado em headers HTTP e JWT claims.
 */
@Entity('auth_tenant')
@Index('uq_tenant_slug',   ['slug'],       { unique: true })
@Index('uq_tenant_schema', ['schemaName'], { unique: true })
export class Tenant {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** Identificador técnico único (URL-safe). Ex: "empresa-abc" */
  @Column({ name: 'slug', length: 60, unique: true })
  slug: string;

  /** Nome humano da organização */
  @Column({ name: 'name', length: 200 })
  name: string;

  /** Prefixo de schema (para multi-schema futuro) */
  @Column({ name: 'schema_name', length: 60, unique: true })
  schemaName: string;

  /** Plano de subscrição: FREE | PRO | ENTERPRISE */
  @Column({ name: 'plan', length: 20, default: 'FREE' })
  plan: string;

  @Column({ name: 'active', default: true })
  active: boolean;

  @Column({ name: 'email', length: 150, nullable: true })
  email: string;

  /** Número de Identificação Fiscal */
  @Column({ name: 'nif', length: 20, nullable: true })
  nif: string;

  /** Número fiscal (NIPC para empresas) */
  @Column({ name: 'nipc', length: 20, nullable: true })
  nipc: string;

  /** Morada fiscal */
  @Column({ name: 'morada', length: 300, nullable: true })
  morada: string;

  @Column({ name: 'localidade', length: 150, nullable: true })
  localidade: string;

  @Column({ name: 'codigo_postal', length: 15, nullable: true })
  codigoPostal: string;

  @Column({ name: 'pais', length: 3, default: 'PT' })
  pais: string;

  @Column({ name: 'telefone', length: 30, nullable: true })
  telefone: string;

  @Column({ name: 'website', length: 200, nullable: true })
  website: string;

  @Column({ name: 'logo_url', length: 500, nullable: true })
  logoUrl: string;

  /** Número máximo de utilizadores (0 = ilimitado) */
  @Column({ name: 'max_users', default: 5 })
  maxUsers: number;

  /** Data de expiração da licença */
  @Column({ name: 'license_expires_at', type: 'datetime', nullable: true })
  licenseExpiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
