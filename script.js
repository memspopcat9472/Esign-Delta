document.addEventListener("DOMContentLoaded", () => {
  const focusItems = Array.from(document.querySelectorAll(".focus-item"));
  const ambientGlow = document.getElementById("ambientGlow");
  const progressBar = document.getElementById("progressBar");

  // เก็บค่าสถานะปัจจุบันของแต่ละ Element เพื่อทำ Smooth Lerp (นุ่มนวล 60fps)
  const itemStates = focusItems.map(() => ({
    opacity: 0.05,
    blur: 14,
    scale: 0.92,
    translateY: 0,
  }));

  let lastScrollY = window.scrollY;
  let scrollVelocity = 0;

  // ฟังก์ชันคำนวณความคมชัดตามระยะห่างจากกึ่งกลางหน้าจอ (50vh)
  function updateOpticalFocus() {
    const viewportHeight = window.innerHeight;
    const viewportCenter = viewportHeight / 2;
    // รัศมีโซนโฟกัส: ยิ่งออกห่างจากกลางจอเกินระยะนี้ จะยิ่งเบลอและจางลงจนถึงขอบเว็บ
    const maxDistance = viewportHeight * 0.46;

    let activeMood = "calm";
    let closestDistance = Infinity;

    focusItems.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;
      const distanceFromCenter = itemCenter - viewportCenter;
      const absDistance = Math.abs(distanceFromCenter);

      // เช็กว่า Element ไหนอยู่ใกล้กลางหน้าจอมากที่สุด เพื่อเปลี่ยนแสงบรรยากาศ
      if (absDistance < closestDistance) {
        closestDistance = absDistance;
        activeMood = item.dataset.mood || "calm";
      }

      // คำนวณอัตราส่วนความห่างจากจุดกึ่งกลาง (0 = กลางจอเป๊ะ, 1 = ขอบบนหรือขอบล่าง)
      const normalized = Math.min(absDistance / maxDistance, 1);

      // ใช้เส้นโค้ง Ease-In-Out เพื่อให้ตรงกลางคมชัดนานและค่อยๆ จางอย่างนุ่มนวล
      const focusFactor = Math.pow(1 - normalized, 1.85);

      const targetOpacity = 0.04 + focusFactor * 0.96; // 0.04 -> 1.0
      const targetBlur = (1 - focusFactor) * 14; // 14px -> 0px
      const targetScale = 0.92 + focusFactor * 0.08; // 0.92 -> 1.0
      const targetY = (distanceFromCenter / viewportHeight) * 28; // Parallax เล็กน้อย

      // Smooth interpolation (Lerp)
      const state = itemStates[index];
      state.opacity += (targetOpacity - state.opacity) * 0.14;
      state.blur += (targetBlur - state.blur) * 0.14;
      state.scale += (targetScale - state.scale) * 0.14;
      state.translateY += (targetY - state.translateY) * 0.14;

      item.style.opacity = state.opacity.toFixed(3);
      item.style.filter = `blur(${state.blur.toFixed(2)}px)`;
      item.style.transform = `translate3d(0, ${state.translateY.toFixed(2)}px, 0) scale(${state.scale.toFixed(4)})`;
    });

    // เปลี่ยนสีแสงพื้นหลังเมื่อเลื่อนถึงท่อน "แล้วบ้าคลั่ง"
    if (activeMood === "狂気") {
      ambientGlow.classList.add("is-frenzy");
    } else {
      ambientGlow.classList.remove("is-frenzy");
    }

    // อัปเดตแถบ Scroll Progress ด้านขวา
    const maxScroll = document.documentElement.scrollHeight - viewportHeight;
    const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
    progressBar.style.height = `${Math.min(Math.max(progress, 0), 100)}%`;

    // คำนวณความเร็วการเลื่อนสำหรับระบบอนุภาคพื้นหลัง
    const currentScrollY = window.scrollY;
    scrollVelocity = (currentScrollY - lastScrollY) * 0.18;
    lastScrollY = currentScrollY;

    requestAnimationFrame(updateOpticalFocus);
  }

  requestAnimationFrame(updateOpticalFocus);

  // ==========================================
  // ระบบอนุภาคฝุ่นแสง (Ambient Dust Particles)
  // ==========================================
  const canvas = document.getElementById("particleCanvas");
  const ctx = canvas.getContext("2d");
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  const particleCount = Math.min(45, Math.floor(window.innerWidth / 28));
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.8 + 0.5,
      speedY: (Math.random() - 0.5) * 0.35,
      speedX: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.45 + 0.1,
    });
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY - scrollVelocity * 0.35;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 190, 140, ${p.alpha})`;
      ctx.fill();
    });

    scrollVelocity *= 0.92;
    requestAnimationFrame(animateParticles);
  }

  animateParticles();

  // ==========================================
  // ระบบขยายภาพเต็มจอ (Lightbox)
  // ==========================================
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxClose = document.getElementById("lightboxClose");

  document.querySelectorAll(".frame-wrapper").forEach((wrapper) => {
    wrapper.addEventListener("click", () => {
      const src = wrapper.getAttribute("data-lightbox");
      if (!src) return;
      lightboxImg.src = src;
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
    });
  });

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
  }

  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  // ==========================================
  // ปุ่มคัดลอกข้อความ และปุ่มเลื่อนกลับด้านบน
  // ==========================================
  const copyBtn = document.getElementById("copyBtn");
  const copyBtnText = document.getElementById("copyBtnText");
  const fullQuoteText = document.getElementById("fullQuoteText");
  const topBtn = document.getElementById("topBtn");

  copyBtn.addEventListener("click", async () => {
    const cleanText = fullQuoteText.textContent.trim();
    try {
      await navigator.clipboard.writeText(cleanText);
      copyBtnText.textContent = "คัดลอกเรียบร้อยแล้ว ✓";
      setTimeout(() => {
        copyBtnText.textContent = "คัดลอกข้อความ";
      }, 2200);
    } catch {
      copyBtnText.textContent = "ไม่สามารถคัดลอกได้";
    }
  });

  topBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
