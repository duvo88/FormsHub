import { useEffect, useState } from 'react';

type FooterVariant = 'registry' | 'a2j';

type FooterProps = {
  variant: FooterVariant;
  onSubmit: () => void;
  isSubmitting?: boolean;
  isSubmitDisabled?: boolean;
  hideSubmit?: boolean;
  submitLabel?: string;
};

const footerConfig = {
  registry: { email: 'registry@lawsociety.com.au', fax: '+61 2 9926 0257' },
  a2j: { email: 'a2j@lawsociety.com.au', fax: '' },
};

export default function Footer({ variant, onSubmit, isSubmitting = false, isSubmitDisabled = false, hideSubmit = false, submitLabel }: FooterProps) {
  const { email, fax } = footerConfig[variant];
  const phone = '(02) 9926 0333';
  const isButtonDisabled = isSubmitting || isSubmitDisabled;
  const [sectionProgress, setSectionProgress] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => {
    let rafId = 0;
    let observer: MutationObserver | null = null;

    const updateProgress = () => {
      const headings = Array.from(
        document.querySelectorAll<HTMLElement>('.section-title, .section-heading'),
      ).filter((heading) => heading.offsetParent !== null && heading.textContent?.trim());

      if (headings.length < 2) {
        setSectionProgress(null);
        return;
      }

      const triggerTop = window.innerHeight * 0.35;
      let currentIndex = 0;

      headings.forEach((heading, index) => {
        if (heading.getBoundingClientRect().top <= triggerTop) {
          currentIndex = index;
        }
      });

      setSectionProgress({
        current: Math.min(currentIndex + 1, headings.length),
        total: headings.length,
      });
    };

    const requestUpdate = () => {
      if (rafId) {
        return;
      }

      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        updateProgress();
      });
    };

    requestUpdate();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    observer = new MutationObserver(requestUpdate);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden'],
    });

    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      observer?.disconnect();
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  return (
    <footer style={{
      textAlign: 'center',
      padding: '20px 20px 40px 20px',
      background: '#fff'
    }}>
      {sectionProgress && (
        <div className="floating-section-progress" aria-live="polite">
          Section {sectionProgress.current}/{sectionProgress.total}
        </div>
      )}

      <div className="floating-scroll-nav" aria-label="Page scroll controls">
        <button
          type="button"
          className="floating-scroll-btn"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          ↑
        </button>
        <button
          type="button"
          className="floating-scroll-btn"
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
          title="Scroll to bottom"
        >
          ↓
        </button>
      </div>

      {!hideSubmit && <div style={{ marginBottom: '90px' }}>
        <button 
          className="btn primary" 
          onClick={(e) => { e.preventDefault(); onSubmit(); }}
          disabled={isButtonDisabled}
          style={{
            opacity: isButtonDisabled ? 0.6 : 1,
            cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
            padding: '12px 40px',
            fontSize: '16px',
            fontWeight: 600,
            textTransform: 'uppercase'
          }}
        >
          {isSubmitting ? 'Submitting...' : (submitLabel ?? 'SUBMIT')}
        </button>
      </div>}

      <div style={{
        fontSize: '14px',
        color: '#4b5563',
        lineHeight: '1.8'
      }}>
        <p style={{ margin: '8px 0', fontWeight: 600 }}>The Law Society of New South Wales</p>
        <p style={{ margin: '8px 0' }}>170 Phillip Street, Sydney NSW 2000</p>
        <p style={{ margin: '8px 0' }}>
          <strong>T:</strong> {phone}{fax && <> | <strong>F:</strong> {fax}</>} | <strong>E:</strong> <a href={`mailto:${email}`}>{email}</a> | <strong>W:</strong> <a href="https://lawsociety.com.au" target="_blank" rel="noopener noreferrer">lawsociety.com.au</a>
        </p>
        <p style={{ margin: '8px 0' }}>
          <strong>ACN:</strong> 000 000 699 | <strong>ABN:</strong> 98 696 304 966
        </p>
      </div>
    </footer>
  );
}
