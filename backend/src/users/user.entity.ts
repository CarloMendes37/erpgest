import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToMany, JoinTable, Index,
  BeforeInsert, BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from '../roles/role.entity';

@Entity('auth_user')
@Index('uq_user_email', ['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', length: 100 })
  name: string;

  @Column({ name: 'email', length: 150, unique: true })
  email: string;

  @Exclude()
  @Column({ name: 'password_hash' })
  passwordHash: string;

  /**
   * TENANT — campo crítico para isolamento multi-tenant.
   * Todos os dados do utilizador pertencem a este tenant.
   */
  @Column({ name: 'tenant_id', default: 1 })
  tenantId: number;

  @Column({ name: 'photo_url', length: 500, nullable: true })
  photoUrl: string;

  @Column({ name: 'active', default: true })
  active: boolean;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'account_non_expired', default: true })
  accountNonExpired: boolean;

  @Column({ name: 'account_non_locked', default: true })
  accountNonLocked: boolean;

  @Column({ name: 'credentials_non_expired', default: true })
  credentialsNonExpired: boolean;

  @Column({ name: 'last_login_at', type: 'datetime', nullable: true })
  lastLoginAt: Date;

  @ManyToMany(() => Role, { eager: true })
  @JoinTable({
    name: 'auth_user_role',
    joinColumn:        { name: 'user_id',  referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id',  referencedColumnName: 'id' },
  })
  roles: Role[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ── Helpers ──────────────────────────────────────────────

  getRoleNames(): string[] {
    return (this.roles || []).map(r => r.name);
  }

  hasRole(roleName: string): boolean {
    return this.getRoleNames().includes(roleName);
  }

  getAllPermissions(): string[] {
    const perms = new Set<string>();
    (this.roles || []).forEach(r => r.getPermissionArray().forEach(p => perms.add(p)));
    return Array.from(perms);
  }
}
