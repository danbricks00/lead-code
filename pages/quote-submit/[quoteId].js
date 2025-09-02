import { useRouter } from 'next/router';

const QuoteSubmitPage = () => {
  const router = useRouter();
  const { quoteId } = router.query;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Submit Your Quote</h1>
      <p>Please fill out the form below to submit your quote.</p>
      <p>
        <strong>Quote ID:</strong> {quoteId}
      </p>
      {/* A simple form placeholder */}
      <form>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="cost">Estimated Cost:</label><br />
          <input type="text" id="cost" name="cost" style={{ width: '300px', padding: '5px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="details">Details:</label><br />
          <textarea id="details" name="details" rows="4" style={{ width: '300px', padding: '5px' }}></textarea>
        </div>
        <button type="submit">Submit Quote</button>
      </form>
    </div>
  );
};

export default QuoteSubmitPage;
