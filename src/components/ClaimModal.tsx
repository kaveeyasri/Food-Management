import React, { useState } from 'react';
import { X, MapPin, Clock, Package } from 'lucide-react';
import type { FoodListing } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface ClaimModalProps {
  listing: FoodListing;
  onClose: () => void;
  onSuccess: () => void;
}

const ClaimModal: React.FC<ClaimModalProps> = ({ listing, onClose, onSuccess }) => {
  const { user, profile } = useAuth();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClaim = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Create transaction record
      const { error: txError } = await supabase.from('transactions').insert({
        listing_id: listing.id,
        receiver_id: user.id,
        status: 'pending',
        notes: notes || null,
      });
      if (txError) throw txError;

      // 2. Mark listing as pending
      const { data: updatedListing, error: listingError } = await supabase
        .from('listings')
        .update({ status: 'pending' })
        .eq('id', listing.id)
        .select();

      if (listingError) throw listingError;
      if (!updatedListing || updatedListing.length === 0) {
        throw new Error('Action blocked by database rules (RLS). You need to add the policy to allow updating listing status.');
      }

      // 3. Notify the donor in real-time
      const receiverName = profile?.full_name || user.email || 'Someone';
      const notifMessage = notes
        ? `${receiverName} claimed your "${listing.food_item}". Their note: "${notes}"`
        : `${receiverName} claimed your "${listing.food_item}". Arrange pickup soon!`;

      await supabase.from('notifications').insert({
        user_id: listing.donor_id,
        title: '🎉 Your food was claimed!',
        message: notifMessage,
        type: 'claim',
        listing_id: listing.id,
      });

      toast.success('Food claimed! The donor has been notified.');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to claim food');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Claim Food</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="claim-listing-info">
            <h3>{listing.food_item}</h3>
            <div className="claim-meta">
              <span><Package size={14} /> {listing.quantity} {listing.unit}</span>
              <span><Clock size={14} /> Expires {formatDistanceToNow(new Date(listing.expires_at), { addSuffix: true })}</span>
              {listing.address && <span><MapPin size={14} /> {listing.address}</span>}
            </div>
            {listing.description && <p className="claim-desc">{listing.description}</p>}
            <div className="donor-info">
              <strong>Donor:</strong> {listing.profiles?.full_name || 'Anonymous'} ({listing.profiles?.role || 'Donor'})
              {listing.profiles?.phone && (
                <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '14px' }}>📞</span> 
                  <span>{listing.profiles.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Message to Donor (optional)</label>
            <textarea
              id="notes"
              className="form-textarea"
              placeholder="e.g. I'll pick up within 30 minutes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleClaim} disabled={loading}>
            {loading ? 'Claiming...' : 'Confirm Claim'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClaimModal;
