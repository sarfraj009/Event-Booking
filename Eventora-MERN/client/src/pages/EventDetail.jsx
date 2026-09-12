import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { AuthContext } from '../context/AuthContext';
import { FaCalendarAlt, FaMapMarkerAlt, FaChair, FaMoneyBillWave, FaHeart } from 'react-icons/fa';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [wishlist, setWishlist] = useState(false);
    const [otp, setOtp] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [showOTP, setShowOTP] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const { data } = await api.get(`/events/${id}`);
                setEvent(data);
            } catch (err) {
                setError('Failed to load event details.');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id]);

    useEffect(() => {
        if (!user) return;
        const fetchWishlist = async () => {
            try {
                const { data } = await api.get('/users/wishlist');
                setWishlist(Array.isArray(data) ? data.some((item) => (item._id || item) === id) : false);
            } catch (error) {
                console.error('Error fetching wishlist', error);
            }
        };
        fetchWishlist();
    }, [user, id]);

    const toggleWishlist = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            const { data } = await api.post(`/users/wishlist/${id}`);
            setWishlist(data.isSaved);
        } catch (error) {
            console.error('Error toggling wishlist', error);
        }
    };

    const handleBooking = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        setBookingLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            if (!showOTP) {
                await api.post('/bookings/send-otp');
                setShowOTP(true);
                setSuccessMsg('OTP sent to your email. Please verify to confirm booking.');
            } else {
                await api.post('/bookings', { eventId: event._id, otp, quantity });
                setSuccessMsg('Booking requested! Awaiting admin confirmation.');
                setShowOTP(false);
                // Update local seats count dynamically after booking
                setEvent({ ...event, availableSeats: event.availableSeats - Number(quantity) });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Booking failed');
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading...</div>;
    if (error && !event) return <div className="text-center py-20 text-xl text-red-500">{error || 'Event not found'}</div>;

    const isSoldOut = event.availableSeats <= 0;
    const averageRating = Number(event.averageRating || 0);
    const reviewCount = Number(event.ratingCount || 0);

    const renderStars = (value) => {
        return Array.from({ length: 5 }, (_, index) => (
            <span key={index} className={index < Math.round(value) ? 'text-yellow-500' : 'text-gray-300'}>
                ★
            </span>
        ));
    };

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mt-8">
            {event.image ? (
                <>
                    <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-80 object-cover"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                        }}
                    />
                    <div className="hidden w-full h-64 bg-gray-900 items-center justify-center text-white/50 text-6xl font-black uppercase tracking-widest">
                        {event.category}
                    </div>
                </>
            ) : (
                <div className="w-full h-64 bg-gray-900 flex items-center justify-center text-white/50 text-6xl font-black uppercase tracking-widest">
                    {event.category}
                </div>
            )}

            <div className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="inline-block bg-gray-200 text-gray-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                {event.category}
                            </div>
                            <button
                                type="button"
                                onClick={toggleWishlist}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold border transition ${wishlist ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                            >
                                <FaHeart className={wishlist ? 'text-red-500' : ''} />
                                {wishlist ? 'Saved' : 'Save'}
                            </button>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex items-center gap-1 text-lg">{renderStars(averageRating)}</div>
                            <span className="text-sm font-semibold text-gray-700">
                                {averageRating > 0 ? `${averageRating.toFixed(1)} / 5` : 'No ratings yet'}
                            </span>
                            <span className="text-xs text-gray-500">({reviewCount} reviews)</span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{event.title}</h1>
                        <p className="text-gray-600 text-lg leading-relaxed mb-6">{event.description}</p>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 min-w-[300px] w-full md:w-auto shrink-0 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Booking Details</h3>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-4 text-gray-600">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-900 shrink-0">
                                    <FaMoneyBillWave />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-400 uppercase">Ticket Price</p>
                                    <p className="font-bold text-gray-800 text-lg">{event.ticketPrice === 0 ? <span className="text-green-500">Free</span> : `₹${event.ticketPrice}`}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-gray-600">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-900 shrink-0">
                                    <FaChair />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-400 uppercase">Availability</p>
                                    <p className="font-bold text-gray-800">
                                        <span className={event.availableSeats < 10 ? 'text-orange-500' : ''}>{event.availableSeats}</span> / {event.totalSeats}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-gray-600">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-900 shrink-0">
                                    <FaCalendarAlt />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-400 uppercase">Date</p>
                                    <p className="font-bold text-gray-800">{new Date(event.date).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-gray-600">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-900 shrink-0">
                                    <FaMapMarkerAlt />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-400 uppercase">Location</p>
                                    <p className="font-bold text-gray-800">{event.location}</p>
                                </div>
                            </div>
                        </div>

                        {showOTP && (
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Enter OTP to Confirm</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="6-digit code"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-700 transition shadow-sm font-bold tracking-widest text-center text-lg"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength="6"
                                />
                            </div>
                        )}

                        {!showOTP && !isSoldOut && (
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Tickets
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setQuantity((prev) => Math.max(1, Math.min(prev - 1, Math.min(event.availableSeats, 50))))}
                                        className="w-12 h-12 rounded-full border-2 border-black bg-white text-2xl font-bold text-black flex items-center justify-center hover:bg-gray-100 transition"
                                        aria-label="Decrease tickets"
                                    >
                                        −
                                    </button>

                                    <input
                                        type="number"
                                        min="1"
                                        max={Math.min(event.availableSeats, 50)}
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, Math.min(Number(e.target.value) || 1, Math.min(event.availableSeats, 50))))}
                                        className="flex-1 border-[3px] border-black rounded-full px-5 py-4 text-2xl font-medium text-black focus:outline-none bg-white text-center"
                                        style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setQuantity((prev) => Math.min(Math.min(event.availableSeats, 50), prev + 1))}
                                        className="w-12 h-12 rounded-full border-2 border-black bg-white text-2xl font-bold text-black flex items-center justify-center hover:bg-gray-100 transition"
                                        aria-label="Increase tickets"
                                    >
                                        +
                                    </button>
                                </div>
                                <p className="mt-3 text-xs text-gray-500">Max 50 tickets per booking. Ticket number will be generated randomly after confirmation.</p>
                            </div>
                        )}

                        <button
                            onClick={handleBooking}
                            disabled={isSoldOut || bookingLoading || (showOTP && !otp)}
                            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition shadow-lg ${isSoldOut || (successMsg && !showOTP)
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-900 hover:bg-black text-white hover:shadow-xl hover:-translate-y-1'
                                }`}
                        >
                            {bookingLoading ? 'Processing...' : (showOTP ? 'Verify OTP & Confirm' : (successMsg && !showOTP ? 'Request Sent' : (isSoldOut ? 'Sold Out' : 'Confirm Registration')))}
                        </button>
                        {error && <p className="text-red-500 mt-4 text-center font-medium bg-red-50 p-2 rounded">{error}</p>}
                        {successMsg && <p className="text-green-600 mt-4 text-center font-medium bg-green-50 p-2 rounded">{successMsg}</p>}
                    </div>
                </div>

                <div className="mt-8 border-t border-gray-100 pt-8">
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-5">Reviews & Ratings</h2>
                    {(!event.reviews || event.reviews.length === 0) ? (
                        <p className="text-gray-500">No reviews yet. Be the first to rate this event.</p>
                    ) : (
                        <div className="space-y-4">
                            {event.reviews.map((review) => (
                                <div key={review.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                                    <div className="flex items-center justify-between gap-3 mb-2">
                                        <p className="font-bold text-gray-800">{review.userName}</p>
                                        <div className="flex items-center gap-1 text-sm">{renderStars(review.rating)}</div>
                                    </div>
                                    <p className="text-gray-600 text-sm">{review.review || 'No comment added.'}</p>
                                    <p className="mt-2 text-[11px] uppercase tracking-wide text-gray-400">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventDetail;
