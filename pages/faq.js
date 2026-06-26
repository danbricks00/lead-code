import React from 'react';
import Layout from '../components/Layout';
import SEO from '../components/SEO';

const FAQPage = () => {
  const faqs = [
    {
      question: "How much does electric underfloor heating cost in Auckland?",
      answer: "Every home is different. Costs depend on your floor plan, room sizes, floor type, and system requirements. We provide free, no-obligation custom quotes tailored to your specific project — contact us to get started."
    },
    {
      question: "How long does electric underfloor heating installation take?",
      answer: "Installation timeframes vary depending on the scope of your project, floor type, and number of zones. We provide a detailed timeline with every custom quote so you know exactly what to expect."
    },
    {
      question: "What types of underfloor heating do you install?",
      answer: "We specialise exclusively in premium electric underfloor heating systems — including under-tile heating for bathrooms and wet areas, and whole-home electric systems for living spaces and renovations."
    },
    {
      question: "Do you provide warranties on your installations?",
      answer: "Yes, all our electric underfloor heating installations come with a 10-year warranty covering both materials and workmanship."
    },
    {
      question: "Can underfloor heating be installed in existing homes?",
      answer: "Yes, electric underfloor heating can be retrofitted into existing homes. Electric systems are particularly suitable for renovations as they require minimal floor height increase."
    },
    {
      question: "Is electric underfloor heating energy efficient?",
      answer: "Electric underfloor heating with smart thermostats and proper zoning is highly efficient for targeted heating. It provides precise temperature control and heats only the areas you need."
    },
    {
      question: "Do you work with all floor types?",
      answer: "Yes, we can install electric underfloor heating under most floor types including tiles, stone, engineered wood, and some carpet types. We'll assess your specific floor during the quote process."
    },
    {
      question: "What areas of Auckland do you service?",
      answer: "We service all areas of Auckland including Remuera, Ponsonby, Parnell, Herne Bay, Takapuna, Devonport, Mission Bay, and surrounding suburbs."
    },
    {
      question: "How do I get a free quote?",
      answer: "Simply use our chatbot to provide your project details, or contact us directly. We'll arrange a convenient time to visit your property and provide a detailed, no-obligation custom quote."
    }
  ];

  return (
    <Layout>
      <SEO
        title="Underfloor Heating Auckland FAQ — Electric Heating Questions"
        description="Get answers to your electric underfloor heating questions! Installation, warranties, and service info for Auckland homeowners. Expert advice from Heat NZ specialists."
        canonical="https://www.heat.nz/faq"
        keywords="underfloor heating FAQ Auckland, electric heating FAQ, heating installation questions, electric heating Auckland, underfloor heating quote Auckland"
      />
      <div style={styles.container}>
        <div style={styles.header}>
          <h1>Frequently Asked Questions</h1>
          <p>Get answers to common questions about electric underfloor heating in Auckland</p>
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
    backgroundColor: '#667eea',
    borderRadius: '10px',
    color: 'white',
  },
  ctaButton: {
    backgroundColor: 'white',
    color: '#667eea',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '5px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '1rem',
  },
};

export default FAQPage;
