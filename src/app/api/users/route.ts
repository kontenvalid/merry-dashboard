import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Demo users fallback (when not connected to database)
const demoUsers = [
  {
    id: '1',
    name: 'Satria Ady Chandra',
    email: 'kontenval.id@gmail.com',
    role: 'ADMIN',
    status: 'active',
    createdAt: '2026-04-30',
    lastLogin: '2026-05-04'
  }
]

// GET - List all users
export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if admin
  const isAdmin = session.user?.email === 'kontenval.id@gmail.com'
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  try {
    // Try to fetch from Prisma database
    const dbUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    if (dbUsers && dbUsers.length > 0) {
      const users = dbUsers.map(u => ({
        id: u.id,
        name: u.name || u.email,
        email: u.email,
        role: u.role || 'MEMBER',
        status: 'active',
        createdAt: u.createdAt?.toISOString() || new Date().toISOString(),
        lastLogin: null
      }));

      return NextResponse.json({
        success: true,
        users,
        source: 'database',
        meta: {
          total: users.length,
          admins: users.filter(u => u.role === 'ADMIN').length,
          members: users.filter(u => u.role === 'MEMBER').length
        }
      })
    }
  } catch (error) {
    console.log('Database not available, using demo users')
  }

  // Fallback to demo users
  return NextResponse.json({
    success: true,
    users: demoUsers,
    source: 'demo',
    meta: {
      total: demoUsers.length,
      admins: demoUsers.filter(u => u.role === 'ADMIN').length,
      members: demoUsers.filter(u => u.role === 'MEMBER').length
    }
  })
}

// POST - Create new user (admin only)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user?.email !== 'kontenval.id@gmail.com') {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { email, name, role } = body

    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Try to create in database
    try {
      const newUser = await prisma.user.create({
        data: {
          email,
          name,
          role: role.toUpperCase(),
        }
      });

      return NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: 'active',
          createdAt: newUser.createdAt?.toISOString()
        }
      }, { status: 201 })
    } catch {
      // Database not available
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// PUT - Update user role (admin only)
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user?.email !== 'kontenval.id@gmail.com') {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { userId, role } = body

    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: role.toUpperCase() }
      })

      return NextResponse.json({
        success: true,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role
        }
      })
    } catch {
      return NextResponse.json({ error: 'Database not available or user not found' }, { status: 503 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// DELETE - Remove user (admin only)
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user?.email !== 'kontenval.id@gmail.com') {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('id')

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  try {
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted'
    })
  } catch {
    return NextResponse.json({ error: 'Database not available or user not found' }, { status: 503 })
  }
}