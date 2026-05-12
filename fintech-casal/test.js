const http = require('http');

http.get('http://localhost:3000/login', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    // Extract error message from Next.js 500 HTML
    const titleMatch = data.match(/<title>(.*?)<\/title>/i);
    console.log("Status:", res.statusCode);
    console.log("Title:", titleMatch ? titleMatch[1] : "N/A");
    
    // Look for error details
    if (data.includes('data-nextjs-dialog-overlay')) {
        console.log("Found Next.js Error Overlay!");
        const errorText = data.match(/<div.*?data-nextjs-dialog-body.*?>([\s\S]*?)<\/div>/i);
        if (errorText) {
            console.log("Error Details:", errorText[1].replace(/<[^>]+>/g, ' ').substring(0, 1000));
        }
    } else {
        // Just print a chunk to see what we got
        console.log("Data snippet:", data.substring(0, 500));
    }
  });
}).on('error', (err) => {
  console.error("Request error:", err.message);
});
