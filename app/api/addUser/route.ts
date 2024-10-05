import prisma from "@/app/hooks/prisma";

export async function POST(req: Request) {
  const { email }: { email?: string } = await req.json();

  // Validate email format
  if (!email) {
    return createResponse(400, { error: 'A valid email is required' });
  }

  try {
    // Check if the email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return createResponse(409, { error: 'Email already exists' });
    }

    // Create a new user
    const newUser = await prisma.user.create({
      data: { email },
    });

    // Return only the relevant user data
    return createResponse(201, { message: 'Account created successfully', user: { id: newUser.id, email: newUser.email } });
  } catch (error) {
    console.error('Error creating account:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

// Helper function to create responses
function createResponse(status: number, body: object) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
