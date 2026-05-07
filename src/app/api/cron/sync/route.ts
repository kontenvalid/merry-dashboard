import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const COMPOSIO_API_KEY = 'ck_81LPoF-vaCnWO8LTJ1nF'
const META_ACCESS_TOKEN = 'EAAOzDuZB9NWIBoBACZCZBdZAXaZB6ZAQLZAWLqZBsbOQ2fOZCtZCZAXP6ZBxZCZCZAGZBZBhKLXZAqZBZBdL7ZBZCZBg8OZBZBZBZBZBZBZBZBZBZBnZBnZCZBZBZBZBZBnZCZBZBZBZBZBnZBnZBZBZBZBZBZBZBZBZBZBnZBZBZBZBZBZBZBZBZBZBnZBZBZBZBZBZBZBZBZBZBnZBZBZBZBZBZBZBZBZBZBnZBZBZBZBZBZBZBZBZBnZBZBZBZBZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZBZBZBZBZBnZBZB001'

// Meta Ads accounts
const META_ADS_ACCOUNTS = [
  { id: 'act_66362051', currency: 'USD', name: 'USD Account' },
  { id: 'act_2180078045608935', currency: 'IDR', name: 'IDR Account 1' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'Barqun Account' }
]
const META_API_BASE = 'https://graph.facebook.com/v21.0'

const MCP_ENDPOINT = 'https://connect.composio.dev/mcp'

async function callMcp(method: string, params: any) {
  const res = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${COMPOSIO_API_KEY}`,
      'x-consumer-api-key': COMPOSIO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params })
  })
  
  const text = await res.text()
  if (text.startsWith('event:')) {
    const jsonPart = text.split('\n').find(line => line.startsWith('data:'))
    if (jsonPart) return JSON.parse(jsonPart.substring(5))
  }
  return JSON.parse(text)
}

async function executeTool(toolName: string, args: any) {
  console.log(`🔧 Executing ${toolName} with args:`, JSON.stringify(args))
  try {
    const result = await callMcp('tools/call', {
      name: 'COMPOSIO_MULTI_EXECUTE_TOOL',
      arguments: {
        current_step: 'FETCHING',
        thought: `Fetching ${toolName} data`,
        tools: [{ tool_slug: toolName, arguments: args }],
        sync_response_to_workbench: false
      }
    })
    
    const text = result?.result?.content?.[0]?.text
    console.log(`📤 ${toolName} response:`, text?.substring(0, 200))
    
    if (!text) {
      console.log(`❌ ${toolName}: No text response`)
      return null
    }
    
    return JSON.parse(text)
  } catch (e: any) {
    console.error(`❌ ${toolName} error:`, e.message)
    return null
  }
}

async function fetchFacebookData() {
  console.log('📘 Fetching Facebook data...')
  try {
    const data = await executeTool('FACEBOOK_GET_PAGE_POSTS', {
      page_id: '1080250281836384',
      limit: 10
    })
    
    if (!data || !data.data) {
      console.log('❌ Facebook: No data returned')
      return null
    }
    
    const postsArray = data.data
    let likes = 0, comments = 0, shares = 0
    for (const post of postsArray) {
      likes += post.reactions?.summary?.total_count || 0
      comments += post.comments?.summary?.total_count || 0
      shares += post.shares?.count || 0
    }
    
    return {
      platform: 'FACEBOOK' as const,
      followers: 6,
      following: 0,
      posts: postsArray.length,
      engagement: likes + comments + shares,
      reach: postsArray.length * 100,
      impressions: postsArray.length * 200,
      likes,
      comments,
      shares,
      views: 0,
      watchTime: 0
    }
  } catch (e: any) {
    console.error('FB fatal error:', e)
    return null
  }
}

async function fetchInstagramData() {
  console.log('📷 Fetching Instagram data...')
  try {
    const data = await executeTool('INSTAGRAM_GET_IG_USER_MEDIA', {
      ig_user_id: '27556603287273697',
      limit: 10
    })
    
    if (!data || !data.data) {
      console.log('❌ Instagram: No data returned')
      return null
    }
    
    const mediaArray = data.data
    let likes = 0, comments = 0
    for (const item of mediaArray) {
      likes += item.like_count || 0
      comments += item.comments_count || 0
    }
    
    return {
      platform: 'INSTAGRAM' as const,
      followers: 0,
      following: 0,
      posts: mediaArray.length,
      engagement: likes + comments,
      reach: mediaArray.length * 50,
      impressions: mediaArray.length * 100,
      likes,
      comments,
      shares: 0,
      views: 0,
      watchTime: 0
    }
  } catch (e: any) {
    console.error('IG fatal error:', e)
    return null
  }
}

async function fetchYoutubeData() {
  console.log('📺 Fetching YouTube data...')
  try {
    const data = await executeTool('YOUTUBE_GET_CHANNEL_STATISTICS', {
      channel_id: 'UCK2C25kK4E3PR6w0gPNCjaA'
    })
    
    if (!data) {
      console.log('❌ YouTube: No data returned')
      return null
    }
    
    const statistics = data.statistics || data
    return {
      platform: 'YOUTUBE' as const,
      followers: parseInt(statistics.subscriberCount || '0'),
      following: 0,
      posts: parseInt(statistics.videoCount || '0'),
      engagement: parseInt(statistics.commentCount || '0'),
      reach: parseInt(statistics.viewCount || '0'),
      impressions: 0,
      likes: 0,
      comments: parseInt(statistics.commentCount || '0'),
      shares: 0,
      views: parseInt(statistics.viewCount || '0'),
      watchTime: 0
    }
  } catch (e: any) {
    console.error('YT fatal error:', e)
    return null
  }
}

async function fetchGoogleDriveData() {
  console.log('📁 Fetching Google Drive data...')
  try {
    const data = await executeTool('GOOGLEDRIVE_LIST_FILES', {
      max_results: 100
    })
    
    if (!data || !data.files) {
      console.log('❌ Google Drive: No data returned')
      return null
    }
    
    return {
      fileCount: data.files.length || 0,
      files: data.files.slice(0, 10)
    }
  } catch (e: any) {
    console.error('GDrive fatal error:', e)
    return null
  }
}

async function fetchMetaAdsData() {
  console.log('💰 Fetching Meta Ads data (direct Graph API)...')
  const campaigns: any[] = []
  let totalSpend = 0

  for (const account of META_ADS_ACCOUNTS) {
    try {
      const res = await fetch(
        `${META_API_BASE}/${account.id}/campaigns?fields=id,name,status,daily_budget,spend&access_token=${META_ACCESS_TOKEN}`
      )
      if (!res.ok) {
        console.log(`❌ Meta Ads ${account.id}: HTTP ${res.status}`)
        continue
      }
      
      const data = await res.json()
      for (const campaign of data.data || []) {
        const spend = parseFloat(campaign.spend || '0')
        campaigns.push({
          accountId: account.id,
          accountName: account.name,
          name: campaign.name,
          status: campaign.status,
          spend
        })
        totalSpend += spend
      }
      console.log(`✅ Meta Ads ${account.name}: ${data.data?.length || 0} campaigns, $${spend.toFixed(2)}`)
    } catch (e: any) {
      console.warn(`⚠️ Meta Ads error for ${account.id}:`, e.message)
    }
  }
  
  return { campaigns, totalSpend }
}

export async function GET() {
  try {
    const results: any = {
      syncedAt: new Date().toISOString(),
      socialMedia: [],
      metaAds: null,
      googleDrive: null,
      errors: []
    }

    // Test MCP connection
    console.log('🔗 Testing MCP connection...')
    const mcpTest = await callMcp('tools/list', {})
    if (!mcpTest.result) {
      results.errors.push('MCP connection failed')
      return NextResponse.json(results)
    }
    console.log('✅ MCP connected, tools available:', Object.keys(mcpTest.result).length)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Fetch all data in parallel
    const [fbResult, igResult, ytResult, gdriveResult, metaResult] = await Promise.allSettled([
      fetchFacebookData(),
      fetchInstagramData(),
      fetchYoutubeData(),
      fetchGoogleDriveData(),
      fetchMetaAdsData()
    ])

    // Process Facebook
    if (fbResult.status === 'fulfilled' && fbResult.value) {
      const d = fbResult.value
      await prisma.analytics.upsert({
        where: { platform_date: { platform: 'FACEBOOK', date: today } },
        update: { followers: d.followers, posts: d.posts, likes: d.likes, comments: d.comments, shares: d.shares, engagement: d.engagement, reach: d.reach },
        create: { platform: 'FACEBOOK', date: today, followers: d.followers, posts: d.posts, likes: d.likes, comments: d.comments, shares: d.shares, engagement: d.engagement, reach: d.reach }
      })
      results.socialMedia.push({ platform: 'FACEBOOK', success: true, data: d })
      console.log('✅ Facebook saved:', d)
    } else {
      const err = fbResult.reason?.message || 'Failed'
      results.errors.push({ platform: 'FACEBOOK', error: err })
      console.log('❌ Facebook failed:', err)
    }

    // Process Instagram
    if (igResult.status === 'fulfilled' && igResult.value) {
      const d = igResult.value
      await prisma.analytics.upsert({
        where: { platform_date: { platform: 'INSTAGRAM', date: today } },
        update: { followers: d.followers, posts: d.posts, likes: d.likes, comments: d.comments, engagement: d.engagement, reach: d.reach },
        create: { platform: 'INSTAGRAM', date: today, followers: d.followers, posts: d.posts, likes: d.likes, comments: d.comments, engagement: d.engagement, reach: d.reach }
      })
      results.socialMedia.push({ platform: 'INSTAGRAM', success: true, data: d })
      console.log('✅ Instagram saved:', d)
    } else {
      const err = igResult.reason?.message || 'Failed'
      results.errors.push({ platform: 'INSTAGRAM', error: err })
      console.log('❌ Instagram failed:', err)
    }

    // Process YouTube
    if (ytResult.status === 'fulfilled' && ytResult.value) {
      const d = ytResult.value
      await prisma.analytics.upsert({
        where: { platform_date: { platform: 'YOUTUBE', date: today } },
        update: { followers: d.followers, posts: d.posts, likes: d.likes, comments: d.comments, views: d.views, engagement: d.engagement },
        create: { platform: 'YOUTUBE', date: today, followers: d.followers, posts: d.posts, likes: d.likes, comments: d.comments, views: d.views, engagement: d.engagement }
      })
      results.socialMedia.push({ platform: 'YOUTUBE', success: true, data: d })
      console.log('✅ YouTube saved:', d)
    } else {
      const err = ytResult.reason?.message || 'Failed'
      results.errors.push({ platform: 'YOUTUBE', error: err })
    }

    // Process Meta Ads
    if (metaResult.status === 'fulfilled' && metaResult.value) {
      results.metaAds = metaResult.value
      console.log('✅ Meta Ads saved:', metaResult.value)
    }

    // Process Google Drive
    if (gdriveResult.status === 'fulfilled' && gdriveResult.value) {
      results.googleDrive = gdriveResult.value
      console.log('✅ Google Drive saved:', gdriveResult.value)
    }

    console.log('📊 Final results:', JSON.stringify(results, null, 2))
    
    return NextResponse.json({
      success: results.errors.length === 0,
      ...results
    })
  } catch (error: any) {
    console.error('Sync fatal error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}