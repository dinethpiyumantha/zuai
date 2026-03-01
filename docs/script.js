document.addEventListener('DOMContentLoaded', () => {
  // ─── Theme toggle (light/dark) ────────────────────────────
  const themeBtn = document.querySelector('.theme-toggle');
  const themeIcon = document.querySelector('.theme-icon');
  const root = document.documentElement;

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('zuai-theme', theme);
    if (themeIcon) themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
  }

  // Restore saved preference, or follow system
  const saved = localStorage.getItem('zuai-theme');
  if (saved) {
    setTheme(saved);
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    setTheme('light');
  } else {
    setTheme('dark');
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = root.getAttribute('data-theme') || 'dark';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // Listen for OS theme changes
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
    if (!localStorage.getItem('zuai-theme')) {
      setTheme(e.matches ? 'light' : 'dark');
    }
  });

  // ─── Mobile menu toggle ───────────────────────────────────
  const toggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Close sidebar when a nav link is clicked (mobile)
    sidebar.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 900) {
          sidebar.classList.remove('open');
        }
      });
    });
  }

  // ─── Active nav link tracking ─────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const observerOpts = {
    rootMargin: '-80px 0px -60% 0px',
    threshold: 0,
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, observerOpts);

  sections.forEach(section => observer.observe(section));

  // ─── Back to top button ───────────────────────────────────
  const backBtn = document.querySelector('.back-to-top');

  if (backBtn) {
    window.addEventListener('scroll', () => {
      backBtn.classList.toggle('visible', window.scrollY > 400);
    });
  }

  // ─── Copy install command ─────────────────────────────────
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.closest('.install-bar')?.querySelector('code')?.textContent;
      if (text) {
        navigator.clipboard.writeText(text).then(() => {
          const orig = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => (btn.textContent = orig), 1500);
        });
      }
    });
  });

  // ─── Minimal syntax highlighting ──────────────────────────
  document.querySelectorAll('pre code[data-lang]').forEach(block => {
    const lang = block.getAttribute('data-lang');
    if (lang === 'typescript' || lang === 'ts') {
      block.innerHTML = highlightTS(block.textContent || '');
    } else if (lang === 'bash' || lang === 'sh') {
      block.innerHTML = highlightBash(block.textContent || '');
    }
  });
});

// ─── Simple TS syntax highlighter ─────────────────────────────
function highlightTS(code) {
  return code
    // Comments
    .replace(/(\/\/.*)/g, '<span class="tok-comment">$1</span>')
    // Strings (double, single, backtick)
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, '<span class="tok-string">$1</span>')
    // Keywords
    .replace(/\b(import|export|from|type|interface|class|extends|implements|async|await|function|const|let|var|return|if|else|try|catch|throw|new|typeof|instanceof|readonly)\b/g, '<span class="tok-keyword">$1</span>')
    // Types
    .replace(/\b(string|number|boolean|void|null|undefined|unknown|never|Promise|Array|Record|ReadonlyArray)\b/g, '<span class="tok-type">$1</span>')
    // Numbers
    .replace(/\b(\d+)\b/g, '<span class="tok-number">$1</span>');
}

function highlightBash(code) {
  return code
    // Comments
    .replace(/(#.*)/g, '<span class="tok-comment">$1</span>')
    // Strings
    .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="tok-string">$1</span>');
}
