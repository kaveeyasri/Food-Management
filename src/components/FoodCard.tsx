import React from 'react';
import { formatDistanceToNow, isPast, differenceInMinutes, differenceInHours } from 'date-fns';
import { MapPin, Clock, Package, User, Leaf, Phone, Eye, X, Image as ImageIcon } from 'lucide-react';
import type { FoodListing } from '../types';

interface FoodCardProps {
  listing: FoodListing;
  onClaim: (listing: FoodListing) => void;
  isOwner?: boolean;
}

const getUrgencyClass = (expiresAt: string) => {
  const expiry = new Date(expiresAt);
  if (isPast(expiry)) return 'card-expired';
  const minutesLeft = differenceInMinutes(expiry, new Date());
  const hoursLeft = differenceInHours(expiry, new Date());
  if (minutesLeft <= 30) return 'card-urgent';
  if (hoursLeft >= 5) return 'card-fresh';
  return 'card-moderate';
};

const getTimeLabel = (expiresAt: string) => {
  const expiry = new Date(expiresAt);
  if (isPast(expiry)) return 'Expired';
  return `Expires ${formatDistanceToNow(expiry, { addSuffix: true })}`;
};

const foodTypeColors: Record<string, string> = {
  Veg: '#3D9970',
  'Non-Veg': '#E07A5F',
  Vegan: '#2D6A4F',
  Mixed: '#F2CC8F',
};

const FoodCard: React.FC<FoodCardProps> = ({ listing, onClaim, isOwner }) => {
  const [isFlipped, setIsFlipped] = React.useState(false);
  const urgencyClass = getUrgencyClass(listing.expires_at);
  const expired = isPast(new Date(listing.expires_at));

  return (
    <div className="food-card-container">
      <div className={`food-card-inner ${isFlipped ? 'flipped' : ''}`}>
        
        {/* Front Face: Listing Details */}
        <div className={`food-card-front food-card ${urgencyClass}`}>
          <div className="card-header">
            <div className="card-title-group">
              <h3 className="card-title">{listing.food_item}</h3>
              <span
                className="food-type-badge"
                style={{ backgroundColor: foodTypeColors[listing.food_type] || '#888' }}
              >
                {listing.food_type}
              </span>
            </div>
            <div className="card-right-group">
              <button 
                className="flip-btn" 
                onClick={() => setIsFlipped(true)}
                title="View Photo"
              >
                <Eye size={18} />
              </button>
              {isOwner && <span className="owner-badge">My Donation</span>}
              <div className={`status-dot status-${listing.status}`} title={listing.status} />
            </div>
          </div>

          <div className="card-meta">
            <div className="meta-item">
              <Package size={14} />
              <span>{listing.quantity} {listing.unit}</span>
            </div>
            <div className="meta-item">
              <Clock size={14} />
              <span className={expired ? 'text-expired' : ''}>{getTimeLabel(listing.expires_at)}</span>
            </div>
            {(listing.address || (listing.lat && listing.lng)) && (
              <div className="meta-item">
                <MapPin size={14} />
                <span className="meta-address">{listing.address || 'Location provided'}</span>
              </div>
            )}
            {listing.profiles?.full_name && (
              <div className="meta-item donor-meta">
                <User size={14} />
                <div className="donor-info">
                  <span>{listing.profiles.full_name}</span>
                  {listing.profiles.role && (
                    <span className="donor-role">{listing.profiles.role}</span>
                  )}
                  {listing.profiles.phone && (
                    <div className="donor-phone">
                      <Phone size={12} />
                      <span>{listing.profiles.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {listing.description && (
            <p className="card-description">{listing.description}</p>
          )}

          <div className="card-footer">
            <div className="urgency-indicator">
              <Leaf size={12} />
              <span>
                {urgencyClass === 'card-urgent' ? 'Urgent — collect soon!' :
                 urgencyClass === 'card-fresh' ? 'Fresh & available' :
                 urgencyClass === 'card-expired' ? 'Listing expired' :
                 'Moderate urgency'}
              </span>
            </div>

            {!isOwner && listing.status === 'available' && !expired && (
              <button className="btn-claim" onClick={() => onClaim(listing)}>
                Claim
              </button>
            )}
            {listing.status === 'pending' && (
              <span className="status-label pending">Pending</span>
            )}
            {listing.status === 'collected' && (
              <span className="status-label collected">Collected ✓</span>
            )}
          </div>
        </div>

        {/* Back Face: Photo Display */}
        <div className="food-card-back">
          <div className="card-back-header">
            <span>{listing.food_item} - Photo</span>
            <button className="flip-btn" onClick={() => setIsFlipped(false)}>
              <X size={20} />
            </button>
          </div>
          {listing.image_url ? (
            <img src={listing.image_url} alt={listing.food_item} className="card-photo-full" />
          ) : (
            <div className="no-photo-msg">
              <ImageIcon size={48} opacity={0.3} />
              <p>No photo provided</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default FoodCard;
