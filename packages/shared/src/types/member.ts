import type { MemberRole, BodyArea } from '../constants';

export interface Member {
  id: string;
  role: MemberRole;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerProfile {
  memberId: string;
  hospitalName: string;
  hospitalNameZh: string | null;
  description: string | null;
  descriptionZh: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  specialties: BodyArea[];
  verified: boolean;
  createdAt: string;
}
