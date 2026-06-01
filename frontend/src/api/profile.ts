import { api, unwrap } from './client';
import type { User } from '@/types';

export interface UpdateProfileDto {
  name?: string;
  photoUrl?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export const profileApi = {
  me: () => unwrap<User>(api.get('/auth/me')),

  update: (data: UpdateProfileDto) =>
    unwrap<User>(api.put('/users/profile', data)),

  changePassword: (data: ChangePasswordDto) =>
    unwrap<{ message: string }>(api.post('/users/profile/change-password', data)),
};
