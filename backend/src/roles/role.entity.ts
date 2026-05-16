import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToMany, Index,
} from 'typeorm';

@Entity('auth_role')
@Index('uq_role_name', ['name'], { unique: true })
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  /** Ex: ROLE_ADMIN, ROLE_MANAGER, ROLE_USER */
  @Column({ name: 'name', length: 60, unique: true })
  name: string;

  @Column({ name: 'description', length: 255, nullable: true })
  description: string;

  /**
   * Permissões separadas por vírgula.
   * Ex: "USERS_READ,USERS_WRITE,FATURAS_READ"
   */
  @Column({ name: 'permissions', type: 'text', nullable: true })
  permissions: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /** Retorna o conjunto de permissões como array */
  getPermissionArray(): string[] {
    if (!this.permissions) return [];
    return this.permissions
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }
}
