import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { FoodListing } from '../types';
import { formatDistanceToNow, isPast } from 'date-fns';
import { Clock, Package, MapPin, User, Leaf, Phone } from 'lucide-react';

interface MapViewProps {
  listings: FoodListing[];
  onClaim: (listing: FoodListing) => void;
  userLocation?: { lat: number; lng: number };
  currentUserId?: string;
}

const getIcon = (listing: FoodListing) => {
  const expired = isPast(new Date(listing.expires_at));
  const mins = (new Date(listing.expires_at).getTime() - Date.now()) / 60000;
  
  const bgColor = expired ? '#999999' : mins <= 30 ? '#E07A5F' : '#3D9970';
  
  let emoji = '🍲';
  if (listing.food_type === 'Veg') emoji = '🥗';
  if (listing.food_type === 'Non-Veg') emoji = '🍗';
  if (listing.food_type === 'Vegan') emoji = '🌱';

  const html = `<div style="
    background-color: ${bgColor}; 
    width: 38px; 
    height: 38px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    border-radius: 50%; 
    border: 3px solid white; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.25); 
    font-size: 18px;
    line-height: 1;
  ">${emoji}</div>`;

  return L.divIcon({
    html,
    className: 'custom-map-icon', // removes default Leaflet marker background
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -22]
  });
};



const getExpiryLabel = (expiresAt: string) => {
  const expiry = new Date(expiresAt);
  if (isPast(expiry)) return { text: 'Expired', cls: 'expiry-expired' };
  const mins = (expiry.getTime() - Date.now()) / 60000;
  if (mins <= 30) return { text: `Expires ${formatDistanceToNow(expiry, { addSuffix: true })}`, cls: 'expiry-urgent' };
  return { text: `Expires ${formatDistanceToNow(expiry, { addSuffix: true })}`, cls: 'expiry-ok' };
};

const foodTypeBadge: Record<string, string> = {
  Veg: 'badge-veg',
  'Non-Veg': 'badge-nonveg',
  Vegan: 'badge-vegan',
  Mixed: 'badge-mixed',
};

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]; // India center

// Component to handle auto-panning the map when userLocation changes
function MapPanController({ position }: { position: { lat: number; lng: number } | undefined }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], 16, {
        animate: true,
        duration: 1
      });
    }
  }, [position, map]);
  return null;
}

const MapView: React.FC<MapViewProps> = ({ listings, onClaim, userLocation, currentUserId }) => {
  const center = userLocation
    ? [userLocation.lat, userLocation.lng] as [number, number]
    : DEFAULT_CENTER;

  const mappableListing = listings.filter(l => l.lat && l.lng);

  return (
    <div className="map-container">
      <MapContainer center={center} zoom={userLocation ? 16 : 5} style={{ height: '100%', width: '100%' }}>
        <MapPanController position={userLocation} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mappableListing.map(listing => {
          const expired = isPast(new Date(listing.expires_at));
          const expiry = getExpiryLabel(listing.expires_at);
          return (
            <Marker
              key={listing.id}
              position={[listing.lat!, listing.lng!]}
              icon={getIcon(listing)}
            >
              <Popup className="map-popup-rich" minWidth={260} maxWidth={300}>
                <div className="popup-rich">
                  {/* Header */}
                  <div className="popup-rich-header">
                    <div className="card-title-group" style={{ marginBottom: '6px' }}>
                      <h3 className="popup-food-name" style={{ margin: 0 }}>{listing.food_item}</h3>
                      <span className={`popup-type-badge ${foodTypeBadge[listing.food_type] || ''}`}>
                        {listing.food_type}
                      </span>
                    </div>
                    {listing.donor_id === currentUserId && (
                      <span className="owner-badge" style={{ display: 'inline-block', marginBottom: '8px' }}>My Donation</span>
                    )}
                  </div>

                  {/* Meta row */}
                  <div className="popup-meta-row">
                    <span className="popup-meta-item">
                      <Package size={13} />
                      {listing.quantity} {listing.unit}
                    </span>
                    <span className={`popup-meta-item ${expiry.cls}`}>
                      <Clock size={13} />
                      {expiry.text}
                    </span>
                  </div>

                  {/* Donor */}
                  <div className="popup-meta-item popup-donor">
                    <User size={13} />
                    <div className="popup-donor-details">
                      <div>
                        <strong>{listing.profiles?.full_name || 'Anonymous'}</strong>
                        {listing.profiles?.role && (
                          <span className="popup-role"> · {listing.profiles.role}</span>
                        )}
                      </div>
                      {listing.profiles?.phone && (
                        <div className="popup-phone">
                          <Phone size={11} />
                          <span>{listing.profiles.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  {(listing.address || (listing.lat && listing.lng)) && (
                    <div className="popup-meta-item popup-address">
                      <MapPin size={13} />
                      <span>{listing.address || 'Location provided'}</span>
                    </div>
                  )}

                  {/* Description */}
                  {listing.description && (
                    <p className="popup-description">{listing.description}</p>
                  )}

                  {/* Claim button */}
                  {listing.donor_id !== currentUserId && listing.status === 'available' && !expired ? (
                    <button
                      className="btn-claim popup-claim-btn"
                      onClick={() => onClaim(listing)}
                    >
                      <Leaf size={14} /> Claim Food
                    </button>
                  ) : (
                    <div className="popup-status-tag">
                      {expired ? '⏰ Expired' : 
                       listing.status === 'available' ? '✅ Available' :
                       listing.status === 'pending' ? '🔄 Pending pickup' : 
                       '✅ Collected'}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>📍 Your location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
