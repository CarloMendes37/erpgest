import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { License } from './license.entity';

@Injectable()
export class LicenseService {
  constructor(@InjectRepository(License) private repo: Repository<License>) {}

  async findByTenant(tenantId: number) {
    return this.repo.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }

  async getActiveLicense(tenantId: number) {
    const today = new Date().toISOString().split('T')[0];
    const license = await this.repo
      .createQueryBuilder('l')
      .where('l.tenantId = :tid', { tid: tenantId })
      .andWhere('l.ativa = true')
      .andWhere('(l.validaAte IS NULL OR l.validaAte >= :today)', { today })
      .orderBy('l.anoFiscal', 'DESC')
      .getOne();
    return license;
  }

  async checkLicense(tenantId: number): Promise<boolean> {
    const license = await this.getActiveLicense(tenantId);
    return !!license;
  }

  async createLicense(tenantId: number, data: any) {
    const key = `ERPGEST-${tenantId}-${uuidv4().substring(0, 8).toUpperCase()}`;
    const license = this.repo.create({
      tenantId,
      licenseKey: key,
      anoFiscal: data.anoFiscal || new Date().getFullYear(),
      tipo: data.tipo || 'ANUAL',
      modulos: data.modulos,
      maxUsers: data.maxUsers || 5,
      maxFaturas: data.maxFaturas || 1000,
      validaAte: data.validaAte,
      observacoes: data.observacoes,
      ativa: true,
    });
    return this.repo.save(license);
  }

  async revoke(id: number, tenantId: number) {
    const l = await this.repo.findOne({ where: { id, tenantId } });
    if (!l) throw new NotFoundException('Licença não encontrada');
    await this.repo.update(id, { ativa: false });
    return { message: 'Licença revogada' };
  }
}
