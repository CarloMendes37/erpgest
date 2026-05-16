import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, Index,
} from 'typeorm';

@Entity('auth_refresh_token')
@Index('idx_rt_token',   ['token'],  { unique: true })
@Index('idx_rt_user_id', ['userId'])
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'tenant_id' })
  tenantId: number;

  @Column({ name: 'token', length: 512, unique: true })
  token: string;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date;

  @Column({ name: 'revoked', default: false })
  revoked: boolean;

  @Column({ name: 'revoked_at', type: 'datetime', nullable: true })
  revokedAt: Date;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', length: 500, nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
