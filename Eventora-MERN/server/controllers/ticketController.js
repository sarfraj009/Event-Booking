const PDFDocument = require('pdfkit');
const Booking = require('../models/Booking');

exports.downloadTicket = async (req, res) => {
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.id }).populate('eventId').populate('userId', 'name');
    if (!booking) return res.status(404).json({ message: 'Ticket not found' });
    const document = new PDFDocument({ size: 'A5', margin: 36 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${booking._id || 'eventora-ticket'}.pdf`);
    document.pipe(res);
    document.fontSize(24).fillColor('#111827').text('EVENTORA', { align: 'center' });
    document.moveDown().fontSize(18).text(booking.eventId.title);
    document.moveDown().fontSize(11).fillColor('#4b5563')
        .text(`Date: ${new Date(booking.eventId.date).toLocaleString()}`)
        .text(`Venue: ${booking.eventId.location}`)
        .text(`Name: ${booking.userId.name}`)
        .text(`Booking ID: ${booking._id}`)
        .text(`Tickets: ${booking.quantity || 1}`)
        .text(`Amount paid: INR ${booking.amount}`)
        .text(`Status: ${booking.status}`);
    document.moveDown(2).fontSize(10).text('Present this ticket at the venue for entry.', { align: 'center' });
    document.end();
};