const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(cors());

// Load bookings from bookings.json
let bookings = [];
if (fs.existsSync('bookings.json')) {
    bookings = JSON.parse(fs.readFileSync('bookings.json'));
}

// Example rooms
const rooms = [
    { id: 1, name: 'Cozy Room' },
    { id: 2, name: 'Family Suite' },
    { id: 3, name: 'Deluxe Suite' }
];

// Helper: check if room is available
function isRoomAvailable(roomId, checkin, checkout) {
    for (const booking of bookings) {
        if (booking.roomId === roomId) {
            // Check for overlap
            if (!(checkout <= booking.checkin || checkin >= booking.checkout)) {
                return false;
            }
        }
    }
    return true;
}

// Endpoint: Get all bookings
app.get('/bookings', (req, res) => {
    res.json(bookings);
});

// Endpoint: Create a booking
app.post('/book', async (req, res) => {
    const { name, email, roomId, checkin, checkout, paymentMethod } = req.body;

    if (!isRoomAvailable(roomId, checkin, checkout)) {
        return res.status(400).json({ success: false, message: 'Room not available for selected dates' });
    }

    const bookingId = uuidv4();
    const newBooking = { id: bookingId, name, email, roomId, checkin, checkout, paymentMethod, paid: false };
    bookings.push(newBooking);
    fs.writeFileSync('bookings.json', JSON.stringify(bookings, null, 2));

    // Simulate payment
    let paymentResponse = {};
    if (paymentMethod === 'MPesa') {
        paymentResponse = { message: `M-Pesa STK Push triggered for ${name}, amount: KES 1000`, status: 'pending' };
    } else if (paymentMethod === 'MPesaGlobal') {
        paymentResponse = { message: `M-Pesa Global payment triggered for ${name}, amount: USD 10`, status: 'pending' };
    } else if (paymentMethod === 'PayPal') {
        paymentResponse = { message: `Redirect to PayPal sandbox for ${name}, amount: USD 10`, approvalUrl: 'https://www.sandbox.paypal.com/checkoutnow' };
    }

    res.json({ success: true, bookingId, payment: paymentResponse });
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
