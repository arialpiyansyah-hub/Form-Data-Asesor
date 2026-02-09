<script>
        // --- PASTE URL SCRIPT ANDA DI SINI ---
        // (Pastikan ini adalah URL yang SAMA dari deployment Anda sebelumnya)
        const scriptURL = 'https://script.google.com/macros/s/AKfycbw7epQ6S-TkJA-ICpCs9NMGrD1Xx2DbwDuv0O6_xUmfPtDqGsqlxCk6aPdPDVukhsQ9Bg/exec'; 
        
        // --- Inisialisasi Elemen ---
        const form = document.getElementById('assessorForm');
        const submitButton = document.getElementById('submit-button');
        const notification = document.getElementById('notification');
        const canvas = document.getElementById('signature-pad');
        const clearButton = document.getElementById('clear-signature');
        const ctx = canvas.getContext('2d');
        let drawing = false;
        let lastPos = { x: 0, y: 0 };
        let signatureEmpty = true;

        // --- Fungsi untuk Canvas Tanda Tangan ---
        function resizeCanvas() {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            ctx.scale(ratio, ratio);
            ctx.clearRect(0, 0, canvas.width, canvas.height); 
        }

        function getEventPos(canvasDom, event) {
            const rect = canvasDom.getBoundingClientRect();
            const touch = event.touches ? event.touches[0] : event;
            return {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
        }

        function startDrawing(e) {
            e.preventDefault(); // Mencegah scrolling saat tanda tangan di mobile
            drawing = true;
            signatureEmpty = false;
            lastPos = getEventPos(canvas, e);
        }

        function stopDrawing() {
            drawing = false;
        }

        function draw(e) {
            if (!drawing) return;
            e.preventDefault(); // Mencegah scrolling saat tanda tangan di mobile
            const pos = getEventPos(canvas, e);
            ctx.beginPath();
            ctx.moveTo(lastPos.x, lastPos.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.stroke();
            lastPos = pos;
        }

        function clearCanvas() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            signatureEmpty = true;
        }

        // --- Event Listeners ---
        window.addEventListener('resize', resizeCanvas);
        // Mouse events
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);
        canvas.addEventListener('mousemove', draw);
        // Touch events
        canvas.addEventListener('touchstart', startDrawing);
        canvas.addEventListener('touchend', stopDrawing);
        canvas.addEventListener('touchmove', draw);
        
        clearButton.addEventListener('click', clearCanvas);
        
        // --- Fungsi Notifikasi ---
        function showNotification(message, type) {
            notification.textContent = message;
            notification.className = 'mt-4 text-center p-4 rounded-md text-white transition-opacity duration-300';
            notification.classList.add(type === 'success' ? 'bg-green-500' : 'bg-red-500');
            setTimeout(() => {
                notification.classList.add('hidden');
            }, 5000);
        }

        // --- Logika Pengiriman Formulir ---
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!form.checkValidity()) {
                showNotification('Harap isi semua kolom yang wajib diisi.', 'error');
                form.reportValidity(); // Tampilkan pesan validasi browser
                return;
            }
            if (signatureEmpty) {
                showNotification('Tanda tangan tidak boleh kosong.', 'error');
                return;
            }
            // Validasi No Rekening (harus dimulai dengan tanda petik)
            if (form.rekening.value.charAt(0) !== "'") {
                 showNotification("No. Rekening harus diawali dengan tanda petik ('). Contoh: '123456", 'error');
                 return;
            }


            submitButton.disabled = true;
            submitButton.textContent = 'Mengirim...';
            const file = document.getElementById('file').files[0];
            const reader = new FileReader();
            
            reader.onloadend = function() {
                // Kumpulkan semua data dari formulir
                const data = {
                    nama: form.nama.value,
                    asal: form.asal.value,
                    tujuan: form.tujuan.value,
                    tanggal: form.tanggal.value,
                    telepon: form.telepon.value,
                    rekening: form.rekening.value,
                    bank: form.bank.value,
                    pemilikRekening: form.pemilikRekening.value,
                    fileName: file.name,
                    fileType: file.type,
                    fileData: reader.result,
                    signatureData: canvas.toDataURL('image/png')
                };

                // Kirim data ke Apps Script
                fetch(scriptURL, {
                    method: 'POST',
                    mode: 'no-cors', // Penting untuk Apps Script
                    body: JSON.stringify(data),
                })
                .then(() => {
                    // Karena mode 'no-cors', kita tidak bisa membaca respons.
                    // Kita asumsikan sukses jika fetch tidak melempar error.
                    showNotification('Data berhasil dikirim! Terima kasih.', 'success');
                    form.reset();
                    clearCanvas();
                })
                .catch(error => {
                    console.error('Error!', error.message);
                    showNotification('Terjadi kesalahan: ' + error.message, 'error');
                })
                .finally(() => {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Kirim Data';
                });
            };
            // Baca file sebagai DataURL (Base64)
            reader.readAsDataURL(file);
        });
        
        // Panggil resizeCanvas saat halaman dimuat
        resizeCanvas();
    </script>
