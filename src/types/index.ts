export type UserRole = 'Individual' | 'NGO' | 'Restaurant' | 'Hotel' | 'Canteen';
export type FoodType = 'Veg' | 'Non-Veg' | 'Vegan' | 'Mixed';
export type ListingStatus = 'available' | 'pending' | 'collected';
export type TransactionStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface FoodListing {
  id: string;
  donor_id: string;
  food_item: string;
  food_type: FoodType;
  quantity: number;
  unit: string;
  description: string | null;
  status: ListingStatus;
  expires_at: string;
  address: string | null;
  image_url: string | null;
  created_at: string;
  // Joined
  profiles?: Profile;
  lat?: number;
  lng?: number;
}

export interface Transaction {
  id: string;
  listing_id: string;
  receiver_id: string;
  status: TransactionStatus;
  claimed_at: string;
  notes: string | null;
  listings?: FoodListing;
  profiles?: Profile;
}
