import React from 'react';
import Layout from '../components/Layout';
import SEO from '../components/SEO';

const FAQPage = () => {
  const faqs = [
    {
      question: "How much does underfloor heating cost in Auckland?",
      answer: "Underfloor heating costs in Auckland typically range from $80-$150 per square meter for electric systems and $120-$200 per square meter for hydronic systems, including installation. We provide free quotes for all projects."
    },
    {
      question: "How long does underfloor heating installation take?",
      answer: "Installation time varies by system type and room size. Electric underfloor heating typically takes 1-3 days, while hydronic systems may take 3-7 days. We provide detailed timelines with every quote."
    },
    {
      question: "Do you service underfloor heating systems in Auckland?",
      answer: "Yes, we provide comprehensive maintenance and repair services for both electric and hydronic underfloor heating systems throughout Auckland and surrounding areas."
    },
    {
      question: "What types of underfloor heating do you install?",
      answer: "We install both electric and hydronic underfloor heating systems. Electric systems are ideal for smaller areas and renovations, while hydronic systems are more efficient for larger spaces and new builds."
    },
    {
      question: "Do you provide warranties on your installations?",
      answer: "Yes, all our installations come with comprehensive warranties covering both materials and workmanship. Warranty periods vary by system type and manufacturer."
    },
    {
      question: "Can underfloor heating be installed in existing homes?",
      answer: "Yes, underfloor heating can be retrofitted into existing homes. Electric systems are particularly suitable for renovations as they require minimal floor height increase."
    },
    {
      question: "Which is more energy efficient - electric or hydronic?",
      answer: "Hydronic systems are generally more energy efficient for larger areas and whole-house heating. Electric systems are efficient for smaller spaces and provide precise temperature control."
    },
    {
      question: "Do you work with all floor types?",
      answer: "Yes, we can install underfloor heating under most floor types including tiles, stone, engineered wood, and some carpet types. We'll assess your specific floor during the quote process."
    },
    {
      question: "What areas of Auckland do you service?",
      answer: "We service all areas of Auckland including Remuera, Ponsonby, Parnell, Herne Bay, Takapuna, Devonport, Mission Bay, and surrounding suburbs."
    },
    {
      question: "How do I get a free quote?",
      answer: "Simply use our chatbot to provide your project details, or contact us directly. We'll arrange a convenient time to visit your property and provide a detailed, no-obligation quote."
    }
  ];

  return (
    <Layout>
      <SEO
        title="Underfloor Heating Auckland FAQ — Costs, Installation & Service Questions"
        description="Get answers to all your underfloor heating questions! Costs, installation time, maintenance, and service info for Auckland homeowners. Expert advice from Heat NZ specialists."
        canonical="https://www.heat.nz/faq"
        keywords="underfloor heating FAQ Auckland, heating costs Auckland, heating installation questions, electric heating FAQ, hydronic heating questions, heating service Auckland, heating maintenance Auckland"
      />
      <div style={styles.container}>
        <div style={styles.header}>
          <h1>Frequently Asked Questions</h1>
          <p>Get answers to common questions about underfloor heating in Auckland</p>
        </div>
        
        <div style={styles.faqContainer}>
          {faqs.map((faq, index) => (
            <div key={index} style={styles.faqItem}>
              <h3 style={styles.question}>{faq.question}</h3>
              <p style={styles.answer}>{faq.answer}</p>
            </div>
          ))}
        </div>

        <div style={styles.ctaSection}>
          <h2>Still Have Questions?</h2>
          <p>Our team is here to help. Get in touch for personalized advice about your underfloor heating project.</p>
          <button style={styles.ctaButton} onClick={() => window.open('/contact', '_self')}>
            Contact Us Today
          </button>
        </div>
      </div>
    </Layout>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem 1rem',
    fontFamily: 'Inter, sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '3rem',
    paddingBottom: '2rem',
    borderBottom: '2px solid #667eea',
  },
  faqContainer: {
    marginBottom: '3rem',
  },
  faqItem: {
    marginBottom: '2rem',
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    borderLeft: '4px solid #667eea',
  },
  question: {
    color: '#333',
    marginBottom: '1rem',
    fontSize: '1.2rem',
    fontWeight: '600',
  },
  answer: {
    color: '#666',
    lineHeight: '1.6',
    margin: 0,
  },
  ctaSection: {
    textAlign: 'center',
    padding: '2rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '15px',
    border: '2px solid #e9ecef',
  },
  ctaButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '1rem 2rem',
    borderRadius: '25px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '1rem',
    transition: 'transform 0.3s ease',
  },
};

export default FAQPage;
