import React, { useEffect, useState } from 'react';
import api from '../utils/axios';

const MyTickets = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [ratingMap, setRatingMap] = useState({});
    const [reviewMap, setReviewMap] = useState({});

    const downloadTicket = async (bookingId, bookingName) => {
        try {
            const { data } = await api.get(`/tickets/${bookingId}/download`, { responseType: 'blob' });
            const url = URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${bookingName || 'eventora-ticket'}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        } catch {
            setError('Unable to download this ticket.');
        }
    };

    useEffect(() => {
        api.get('/bookings/my')
            .then(({ data }) => {
                setBookings(data);
                const initialRatings = {};
                const initialReviews = {};
                data.forEach((booking) => {
                    initialRatings[booking._id] = booking.rating || 0;
                    initialReviews[booking._id] = booking.review || '';
                });
                setRatingMap(initialRatings);
                setReviewMap(initialReviews);
            })
            .catch(() => setError('Unable to load your tickets.'))
            .finally(() => setLoading(false));
    }, []);

    const submitRating = async (bookingId) => {
        const rating = Number(ratingMap[bookingId] || 0);
        const review = reviewMap[bookingId] || '';

        if (!rating) {
            setSuccess('');
            setError('Please select a rating before submitting.');
            return;
        }

        try {
            const { data } = await api.post(`/bookings/${bookingId}/rating`, { rating, review });
            setBookings((prev) => prev.map((booking) => (
                booking._id === bookingId ? { ...booking, ...data.booking } : booking
            )));
            setError('');
            setSuccess('Review submitted successfully.');
        } catch (err) {
            setSuccess('');
            setError(err.response?.data?.message || 'Unable to submit rating.');
        }
    };

    if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading tickets...</div>;

    const groups = {
        upcoming: bookings.filter((booking) => booking.status === 'confirmed' && new Date(booking.eventId?.date) >= new Date()),
        past: bookings.filter((booking) => booking.status === 'completed' || new Date(booking.eventId?.date) < new Date()),
        cancelled: bookings.filter((booking) => booking.status === 'cancelled')
    };

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8">My Tickets</h1>
            {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
            {success && <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">{success}</div>}
            {bookings.length === 0 ? <p className="text-center py-20 text-gray-500">No tickets available.</p> :
                Object.entries(groups).map(([key, items]) => (
                    <section key={key} className="mb-10">
                        <h2 className="text-xl font-bold capitalize mb-4">{key} Tickets</h2>
                        {items.length === 0 ? <p className="text-gray-500">No tickets in this section.</p> :
                            <div className="grid gap-5 md:grid-cols-2">
                                {items.map((booking) => (
                                    <article key={booking._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex gap-5">
                                        {booking.eventId?.image && <img src={booking.eventId.image} alt="" className="w-24 h-24 rounded-lg object-cover" />}
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-gray-900 truncate">{booking.eventId?.title || 'Event'}</h3>
                                            <p className="text-sm text-gray-500 mt-1">{booking.eventId && new Date(booking.eventId.date).toLocaleString()}</p>
                                            <p className="text-sm text-gray-500">Quantity: {booking.quantity || 1}</p>
                                            <div className="flex gap-3 mt-3 items-center">
                                                <button onClick={() => downloadTicket(booking._id, booking._id)} className="self-end text-sm font-semibold text-gray-900 underline">Download PDF</button>
                                            </div>
                                            <div className="mt-4 border-t pt-3">
                                                {['confirmed', 'completed'].includes(booking.status) && (
                                                    <>
                                                <p className="text-xs font-bold uppercase text-gray-500 mb-2">Rate this event</p>
                                                <div className="flex gap-2 mb-2">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => setRatingMap((prev) => ({ ...prev, [booking._id]: star }))}
                                                            className={`text-lg ${Number(ratingMap[booking._id] || 0) >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                                                        >
                                                            ★
                                                        </button>
                                                    ))}
                                                </div>
                                                <textarea
                                                    rows="2"
                                                    value={reviewMap[booking._id] || ''}
                                                    onChange={(e) => setReviewMap((prev) => ({ ...prev, [booking._id]: e.target.value }))}
                                                    placeholder="Write a short review..."
                                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-700"
                                                />
                                                <button
                                                    onClick={() => submitRating(booking._id)}
                                                    className="mt-2 bg-gray-900 text-white px-3 py-2 text-xs font-bold rounded-lg hover:bg-black transition"
                                                >
                                                    Submit Rating
                                                </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>}
                    </section>
                ))}
        </div>
    );
};

export default MyTickets;