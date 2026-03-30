document.documentElement.classList.add('motion');

const rows = document.querySelectorAll('.row.reveal');

const observer = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.24,
    rootMargin: '0px 0px -10% 0px'
  }
);

rows.forEach((row, index) => {
  row.style.transitionDelay = `${120 + index * 70}ms`;
  observer.observe(row);
});

const links = document.querySelectorAll('a[href^="#"]');
links.forEach((link) => {
  link.addEventListener('click', (event) => {
    const id = link.getAttribute('href');
    if (!id || id.length < 2) {
      return;
    }

    const target = document.querySelector(id);
    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
