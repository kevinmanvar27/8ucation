export default function PlainFetchPage() {
  return (
    <div>
      <h1>Plain Fetch Test</h1>
      <div id="result">Loading...</div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            fetch('/api/schools/public')
              .then(response => response.json())
              .then(data => {
                document.getElementById('result').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
              })
              .catch(error => {
                document.getElementById('result').innerHTML = '<p>Error: ' + error.message + '</p>';
              });
          `,
        }}
      />
    </div>
  );
}