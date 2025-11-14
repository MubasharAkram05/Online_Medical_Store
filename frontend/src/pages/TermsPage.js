import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './TermsPage.css';

const sections = [
  {
    id: 'usage',
    title: 'Use of Our Platform',
    summary: 'We provide authentic medicines and health services for personal use. By using the site you agree to share accurate information and comply with medical regulations.',
    points: [
      'Services are intended for users who are 18 years or older or supervised by a guardian.',
      'All information that you submit (name, email, prescriptions) must be accurate and up to date.',
      'You may not use our products for resale, commercial distribution, or illegal purposes.'
    ]
  },
  {
    id: 'accounts',
    title: 'Account Responsibilities',
    summary: 'Account security is a shared responsibility. Keep your password safe and notify us immediately if you suspect unauthorized usage.',
    points: [
      'Each user is responsible for activities carried out under their account.',
      'Use a strong password and avoid sharing login details with anyone.',
      'We reserve the right to suspend any account that violates our policies.'
    ]
  },
  {
    id: 'prescriptions',
    title: 'Prescription & Medical Compliance',
    summary: 'Certain medicines require verified prescriptions. Orders for regulated products will only be dispatched once prescriptions are validated.',
    points: [
      'Upload clear prescriptions issued by a licensed healthcare professional.',
      'Pharmacists may contact you or your doctor for additional verification.',
      'Orders lacking proper documentation will be cancelled and refunded.'
    ]
  },
  {
    id: 'payments',
    title: 'Payments & Billing',
    summary: 'We accept major digital wallets, bank cards, and COD where available.',
    points: [
      'Prices are inclusive of applicable taxes unless otherwise stated.',
      'Payments processed through third-party gateways are subject to their own terms.',
      'Suspicious or fraudulent transactions may be declined automatically.'
    ]
  },
  {
    id: 'shipping',
    title: 'Shipping & Delivery',
    summary: 'We ship nationwide with real-time tracking. Delivery timelines vary by city and availability.',
    points: [
      'Standard delivery: 2-4 business days in major cities, 3-7 days elsewhere.',
      'Cold-chain medicines are packed with temperature control; please refrigerate immediately upon receipt.',
      'Delays caused by courier disruptions or natural events are outside our direct control, yet we will keep you informed.'
    ]
  },
  {
    id: 'returns',
    title: 'Returns & Refunds',
    summary: 'For safety reasons, medicines cannot be returned once opened unless there is a proven quality issue.',
    points: [
      'Contact support within 48 hours if you receive a damaged or incorrect item.',
      'Refunds are processed within 7 working days after verification.',
      'We may request supporting evidence (photos, batch numbers) to approve a claim.'
    ]
  },
  {
    id: 'privacy',
    title: 'Privacy & Data Protection',
    summary: 'Your data is protected using encryption, secure storage, and strict access controls.',
    points: [
      'Refer to our Privacy Policy for detailed information on data collection and usage.',
      'We never sell your personal information to advertisers.',
      'You can request account deletion or data export by contacting support.'
    ]
  },
  {
    id: 'contact',
    title: 'Need Assistance?',
    summary: 'Reach out to our support team for any additional questions about these terms.',
    points: [
      'Email: info@medicalstore.com',
      'WhatsApp / Phone: +92 300 1234567',
      'Support hours: Mon–Sat, 9:00 AM – 9:00 PM PKT'
    ]
  }
];

const TermsPage = () => {
  const location = useLocation();

  useEffect(() => {
    const { hash } = location;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  return (
    <div className="terms-page">
      <div className="terms-hero">
        <h1>Terms & Conditions</h1>
        <p>
          Please read these terms carefully before using our services. By creating an account or placing an order you agree to
          the conditions below.
        </p>
      </div>

      <div className="terms-layout">
        <aside className="terms-sidebar">
          <h3>Jump to Section</h3>
          <ul>
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.title}</a>
              </li>
            ))}
          </ul>
        </aside>

        <section className="terms-content">
          {sections.map((section) => (
            <article key={section.id} id={section.id} className="terms-card">
              <h2>{section.title}</h2>
              <p className="terms-summary">{section.summary}</p>
              <ul>
                {section.points.map((point, index) => (
                  <li key={`${section.id}-${index}`}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
          <div className="terms-footer-note">
            Last updated on {new Date().toLocaleDateString()} — we may revise these terms periodically. Continued use of the
            platform implies acceptance of the latest version.
          </div>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;

