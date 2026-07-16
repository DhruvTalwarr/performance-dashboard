import { NextResponse } from 'next/server';
import { generateBulkData } from '../../../lib/dataGenerator';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const countParam = searchParams.get('count');
  const count = countParam ? parseInt(countParam, 10) : 1000;

  try {
    const data = generateBulkData(Math.min(count, 50000), 100);
    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      count: data.length,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
