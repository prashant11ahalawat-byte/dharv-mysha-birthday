/**
 * Public Invitation & RSVP Interactivity
 * Handles live countdown, guest counters, RSVP form validation, and submission
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initial Welcoming Confetti Sparkle
  if (window.PartyConfetti) {
    setTimeout(() => {
      window.PartyConfetti.sparkle();
    }, 600);
  }

  // 2. Countdown Timer
  initCountdown();

  // 3. RSVP Form Interactivity
  initRSVPForm();

  // 4. Print Button
  const printBtn = document.getElementById('btn-print-invite');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
});

/**
 * Live Countdown to Thursday, 10 December 2026 at 4:30 PM (16:30) IST
 */
function initCountdown() {
  const targetDate = new Date('2026-12-10T16:30:00+05:30').getTime();
  
  const elDays = document.getElementById('count-days');
  const elHours = document.getElementById('count-hours');
  const elMins = document.getElementById('count-mins');
  const elSecs = document.getElementById('count-secs');
  const countdownBox = document.getElementById('countdown-container');

  function update() {
    const now = Date.now();
    const distance = targetDate - now;

    if (distance <= 0) {
      if (countdownBox) {
        countdownBox.innerHTML = `
          <div class="countdown-title" style="font-size: 1.2rem; color: #ffc83b;">
            🎬 SHOWTIME IS HERE! WELCOME TO THE MOVIE PARTY! 🍿
          </div>
        `;
      }
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (elDays) elDays.textContent = String(days);
    if (elHours) elHours.textContent = String(hours).padStart(2, '0');
    if (elMins) elMins.textContent = String(minutes).padStart(2, '0');
    if (elSecs) elSecs.textContent = String(seconds).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
}

/**
 * RSVP Form Handling & Validation
 */
function initRSVPForm() {
  const form = document.getElementById('rsvp-form');
  if (!form) return;

  const attendanceRadios = form.querySelectorAll('input[name="attending"]');
  const guestCountsSection = document.getElementById('guest-counts-section');
  const adultsInput = document.getElementById('adults-count');
  const kidsInput = document.getElementById('kids-count');
  const totalSummaryPill = document.getElementById('guest-summary-text');
  const feedbackBanner = document.getElementById('rsvp-feedback');
  const submitBtn = document.getElementById('btn-submit-rsvp');
  const successCard = document.getElementById('rsvp-success-card');
  const successSummary = document.getElementById('success-summary-details');
  const resetBtn = document.getElementById('btn-reset-form');

  let isSubmitting = false;

  // Stepper buttons
  document.querySelectorAll('.stepper-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      const step = parseInt(btn.getAttribute('data-step'), 10) || 0;
      const min = parseInt(input.getAttribute('min'), 10) || 0;
      const max = parseInt(input.getAttribute('max'), 10) || 20;

      let currentVal = parseInt(input.value, 10) || 0;
      let nextVal = Math.min(max, Math.max(min, currentVal + step));
      input.value = nextVal;
      updateGuestSummary();
    });
  });

  if (adultsInput) adultsInput.addEventListener('input', updateGuestSummary);
  if (kidsInput) kidsInput.addEventListener('input', updateGuestSummary);

  // Attendance Toggle (Yes / No)
  attendanceRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const isAttending = radio.value === 'yes';
      if (guestCountsSection) {
        guestCountsSection.style.display = isAttending ? 'block' : 'none';
      }
      if (submitBtn) {
        submitBtn.querySelector('.btn-text').textContent = isAttending
          ? 'Reserve Your Seats 🎬'
          : 'Send Response 💌';
      }
      updateGuestSummary();
    });
  });

  function updateGuestSummary() {
    const isAttending = form.querySelector('input[name="attending"]:checked')?.value === 'yes';
    if (!isAttending) {
      if (totalSummaryPill) {
        totalSummaryPill.textContent = 'Not attending';
      }
      return;
    }

    const adults = parseInt(adultsInput?.value, 10) || 0;
    const kids = parseInt(kidsInput?.value, 10) || 0;
    const total = adults + kids;

    const adultText = adults === 1 ? '1 Adult' : `${adults} Adults`;
    const kidText = kids === 1 ? '1 Kid' : `${kids} Kids`;

    if (totalSummaryPill) {
      totalSummaryPill.textContent = `Total: ${total} ${total === 1 ? 'Guest' : 'Guests'} (${adultText}, ${kidText})`;
    }
  }

  updateGuestSummary();

  // Reset form handler to submit another or make changes
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      successCard.classList.remove('active');
      form.style.display = 'block';
      form.reset();
      updateGuestSummary();
      feedbackBanner.className = 'form-feedback';
      feedbackBanner.textContent = '';
      feedbackBanner.style.display = 'none';
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      isSubmitting = false;
    });
  }

  // Handle Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Reset feedback
    feedbackBanner.className = 'form-feedback';
    feedbackBanner.textContent = '';
    feedbackBanner.style.display = 'none';

    const name = form.querySelector('#guest-name')?.value.trim();
    const attendingVal = form.querySelector('input[name="attending"]:checked')?.value;
    const isAttending = attendingVal === 'yes';
    const adults = parseInt(adultsInput?.value, 10) || 0;
    const kids = parseInt(kidsInput?.value, 10) || 0;
    const phone = form.querySelector('#guest-phone')?.value.trim();
    const message = form.querySelector('#guest-message')?.value.trim();

    // Client Validation
    if (!name) {
      showError('Please enter your name.');
      form.querySelector('#guest-name')?.focus();
      return;
    }

    if (isAttending && (adults + kids < 1)) {
      showError('Please specify at least 1 guest attending (adult or kid).');
      return;
    }

    // Lock submission button
    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.querySelector('.btn-text').textContent = 'Confirming...';

    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          attending: isAttending,
          adults: isAttending ? adults : 0,
          kids: isAttending ? kids : 0,
          phone,
          message
        })
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Unable to submit RSVP. Please try again.');
      }

      // Success!
      if (window.PartyConfetti) {
        window.PartyConfetti.celebrate();
      }

      // Populate success card
      if (successSummary) {
        if (isAttending) {
          successSummary.innerHTML = `
            <p><strong>Name:</strong> ${escapeHTML(name)}</p>
            <p><strong>Status:</strong> Attending 🎉</p>
            <p><strong>Seats Reserved:</strong> ${adults + kids} Total (${adults} Adults, ${kids} Kids)</p>
            ${phone ? `<p><strong>Phone:</strong> ${escapeHTML(phone)}</p>` : ''}
            ${message ? `<p><strong>Your Wishes:</strong> "${escapeHTML(message)}"</p>` : ''}
          `;
        } else {
          successSummary.innerHTML = `
            <p><strong>Name:</strong> ${escapeHTML(name)}</p>
            <p><strong>Status:</strong> Can't make it</p>
            <p>We'll miss you at the party! Thank you for letting us know.</p>
            ${message ? `<p><strong>Your Note:</strong> "${escapeHTML(message)}"</p>` : ''}
          `;
        }
      }

      form.style.display = 'none';
      successCard.classList.add('active');
      successCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (err) {
      console.error('Submission error:', err);
      showError(err.message || 'Network error occurred. Please check your connection and try again.');
    } finally {
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      submitBtn.querySelector('.btn-text').textContent = isAttending
        ? 'Reserve Your Seats 🎬'
        : 'Send Response 💌';
    }
  });

  function showError(msg) {
    if (feedbackBanner) {
      feedbackBanner.textContent = msg;
      feedbackBanner.className = 'form-feedback error';
      feedbackBanner.style.display = 'block';
      feedbackBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
}
