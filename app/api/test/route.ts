export async function GET() {
    // Send a response to the client
    return new Response(JSON.stringify({ message: "Hello world!" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  export async function OPTIONS() {
    // Handle preflight requests or unsupported methods
    return new Response(null, {
      status: 405,
      headers: {
        Allow: "GET, OPTIONS",
      },
    });
  }
  