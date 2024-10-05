import prisma from "@/app/hooks/prisma";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return new Response(JSON.stringify({ error: 'Email or Matric number is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: {
        email, // shorthand for { email: email }
      },
    });

    if (user) {
      // User found, return success response
      return new Response(JSON.stringify({ message: 'Login successful', user }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // User not found
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error querying database:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
