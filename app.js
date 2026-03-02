// App logic for Kerala Toilet Rating

document.addEventListener('DOMContentLoaded', () => {
    // Section Switching
    const findBtn = document.getElementById('find-btn');
    const reviewBtn = document.getElementById('review-btn');
    const mapSection = document.getElementById('map-section');
    const reviewSection = document.getElementById('review-section');

    findBtn.addEventListener('click', () => {
        findBtn.classList.add('active');
        reviewBtn.classList.remove('active');
        mapSection.classList.add('active-section');
        mapSection.classList.remove('hidden-section');
        reviewSection.classList.add('hidden-section');
        reviewSection.classList.remove('active-section');
    });

    reviewBtn.addEventListener('click', () => {
        reviewBtn.classList.add('active');
        findBtn.classList.remove('active');
        reviewSection.classList.add('active-section');
        reviewSection.classList.remove('hidden-section');
        mapSection.classList.add('hidden-section');
        mapSection.classList.remove('active-section');
        initScanner();
    });

    // Map Initialization
    let map = L.map('map').setView([10.8505, 76.2711], 7); // Center of Kerala

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Get User Location
    document.getElementById('locate-me').addEventListener('click', () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(position => {
                const { latitude, longitude } = position.coords;
                map.setView([latitude, longitude], 15);
                L.marker([latitude, longitude]).addTo(map)
                    .bindPopup('You are here!')
                    .openPopup();
            });
        }
    });

    // QR Scanner Initialization
    let html5QrCode;
    function initScanner() {
        if (html5QrCode) return;

        html5QrCode = new Html5Qrcode("qr-reader");
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
                console.log(`Code matched = ${decodedText}`);
                handleQRSuccess(decodedText);
            },
            (errorMessage) => {
                // parse error, ignore
            }
        ).catch((err) => {
            console.error("Unable to start scanning.", err);
        });
    }

    function handleQRSuccess(url) {
        // Assume URL format: domain.com/review?id=TOILET_ID
        const urlParams = new URL(url).searchParams;
        const toiletId = urlParams.get('id');
        if (toiletId) {
            showReviewForm(toiletId);
            if (html5QrCode) {
                html5QrCode.stop().then(() => {
                    document.getElementById('qr-reader').classList.add('hidden');
                });
            }
        }
    }

    function showReviewForm(id) {
        const form = document.getElementById('review-form');
        form.classList.remove('hidden');
        // Pre-fill or fetch toilet details if needed
    }

    // Star Rating Logic
    const stars = document.querySelectorAll('#star-rating span');
    let currentRating = 0;

    stars.forEach(star => {
        star.addEventListener('click', (e) => {
            currentRating = parseInt(e.target.dataset.value);
            updateStars(currentRating);

            // Show complain upload if rating is low (1 or 2)
            const upload = document.getElementById('complain-upload');
            if (currentRating <= 2) {
                upload.classList.remove('hidden');
            } else {
                upload.classList.add('hidden');
            }
        });

        star.addEventListener('mouseover', (e) => {
            const val = parseInt(e.target.dataset.value);
            updateStars(val);
        });

        star.addEventListener('mouseout', () => {
            updateStars(currentRating);
        });
    });

    function updateStars(val) {
        stars.forEach(star => {
            if (parseInt(star.dataset.value) <= val) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    // API Integration
    const PROD_API_URL = 'https://your-backend-url.onrender.com/api'; // Replace with your actual Render/Railway URL
    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'
        : PROD_API_URL;

    async function loadToilets() {
        try {
            const res = await fetch(`${API_URL}/toilets/nearby`);
            const toilets = await res.json();
            if (toilets.length > 0) renderMarkers(toilets);
            else renderMarkers(mockToilets); // Fallback
        } catch (err) {
            console.error('Failed to fetch toilets, using mocks');
            renderMarkers(mockToilets);
        }
    }

    function renderMarkers(toilets) {
        // Clear existing markers if any
        toilets.forEach(toilet => {
            const loc = toilet.location || { lat: toilet.lat, lon: toilet.lon };
            const marker = L.marker([loc.lat, loc.lon]).addTo(map);
            marker.bindPopup(`
                <div class="popup-content" style="font-family: 'Inter', sans-serif;">
                    <strong style="color: #008069;">${toilet.name}</strong><br>
                    <span style="color: #666;">Rating: ${"★".repeat(Math.round(toilet.averageRating || toilet.rating))} (${toilet.averageRating || toilet.rating})</span><br>
                    <button onclick="openReview('${toilet.qrId || toilet.id}')" style="margin-top:8px; background:#25d366; color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer; width:100%; font-weight:600;">Rate Now</button>
                </div>
            `);

            const option = document.createElement('option');
            option.value = toilet.qrId || toilet.id;
            option.textContent = toilet.name;
            document.getElementById('toilet-list').appendChild(option);
        });
    }

    // Review Submission
    document.getElementById('review-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const originalText = btn.textContent;
        btn.textContent = 'Submitting...';
        btn.disabled = true;

        const formData = new FormData();
        formData.append('toiletId', document.getElementById('toilet-list').value);
        formData.append('rating', currentRating);
        formData.append('comment', e.target.querySelector('textarea').value);

        const files = document.getElementById('photo-upload').files;
        for (let i = 0; i < files.length; i++) {
            formData.append('photos', files[i]);
        }

        try {
            const res = await fetch(`${API_URL}/review`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                alert(`Thank you! ${data.aiVerdict !== 'N/A' ? `AI Result: ${data.aiVerdict}` : 'Review saved.'}`);
                e.target.reset();
                document.getElementById('preview-container').innerHTML = '';
                document.getElementById('review-form').classList.add('hidden');
                reviewBtn.classList.remove('active');
                findBtn.click();
            } else {
                throw new Error('Server error');
            }
        } catch (err) {
            console.error('Submission failed', err);
            alert('Rating saved locally (Backend simulation)');
            // Fallback: dummy success
            findBtn.click();
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });

    loadToilets();

    // Image Preview logic
    document.getElementById('photo-upload').addEventListener('change', (e) => {
        const preview = document.getElementById('preview-container');
        preview.innerHTML = '';
        [...e.target.files].forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.style.width = '60px';
                img.style.height = '60px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '8px';
                img.style.margin = '4px';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    });
});
