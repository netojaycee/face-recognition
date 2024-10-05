import prisma from "@/app/hooks/prisma";

export async function GET() {
  try {
    // Fetch all users with their face data
    const usersWithFaceData = await prisma.user.findMany({
        where: {
          role: {
            not: 'ADMIN', // Exclude users with the role of ADMIN
          },
        },
        select: {
          email: true,
          fullName: true,
          faceData: true, // Fetch face data
        },
      });
      

    // Return success response with users' face data
    return new Response(JSON.stringify(usersWithFaceData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching face data:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
