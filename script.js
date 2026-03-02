require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const axios = require('axios');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// Models
const Toilet = mongoose.model('Toilet', {
    name: String,
    location: {
        lat: Number,
        lon: Number
    },
    qrId: String,
    averageRating: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
});

const Review = mongoose.model('Review', {
    toiletId: String,
    rating: Number,
    comment: String,
    photos: [String],
    aiVerdict: String,
    timestamp: { type: Date, default: Date.now }
});

// AI Verification Helper (Hugging Face)
async function verifyImage(photoPath) {
    try {
        // Mocking AI response for demonstration
        // In reality, you'd use Hugging Face API
        /*
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/google/vit-base-patch16-224',
            fs.createReadStream(photoPath),
            { headers: { Authorization: `Bearer ${process.env.HF_API_TOKEN}` } }
        );
        return response.data;
        */
        return { isDirty: Math.random() > 0.5 };
    } catch (error) {
        console.error('AI Verification failed', error);
        return null;
    }
}

// Routes
app.get('/api/toilets/nearby', async (req, res) => {
    const { lat, lon } = req.query;
    // Simple mock logic: return all toilets
    const toilets = await Toilet.find();
    res.json(toilets);
});

app.post('/api/review', upload.array('photos'), async (req, res) => {
    try {
        const { toiletId, rating, comment } = req.body;
        const photos = req.files.map(f => f.path);

        let aiVerdict = 'N/A';
        if (rating <= 2 && photos.length > 0) {
            const result = await verifyImage(photos[0]);
            aiVerdict = result.isDirty ? 'Dirty Detected' : 'Clean';

            if (result.isDirty) {
                console.log(`EMERGENCY: Dirty toilet reported at ${toiletId}. Notifying Suchitwa Mission...`);
                // Implementation for email notification would go here
            }
        }

        const review = new Review({
            toiletId,
            rating: parseInt(rating),
            comment,
            photos,
            aiVerdict
        });
        await review.save();

        // Update Toilet Avg Rating
        const toilet = await Toilet.findOne({ qrId: toiletId });
        if (toilet) {
            toilet.averageRating = ((toilet.averageRating * toilet.count) + parseInt(rating)) / (toilet.count + 1);
            toilet.count += 1;
            await toilet.save();
        }

        res.status(201).json({ message: 'Review submitted successfully', aiVerdict });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Seed Initial Data Route (for convenience)
app.post('/api/seed', async (req, res) => {
    await Toilet.deleteMany({});
    await Toilet.insertMany([
        { name: "Public Toilet, Kollam Beach", location: { lat: 8.8821, lon: 76.5786 }, qrId: "T1", averageRating: 4.2, count: 10 },
        { name: "KSRTC Bus Stand Toilet, TVM", location: { lat: 8.4839, lon: 76.9497 }, qrId: "T2", averageRating: 2.5, count: 20 }
    ]);
    res.json({ message: 'Seeded successfully' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

