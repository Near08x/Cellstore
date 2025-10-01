'use server';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseServer'; // cliente anon/admin

// GET capital
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('capital')
      .select('total')
      .eq('id', 1)
      .single();

    if (error) throw error;

    if (data) {
      return NextResponse.json(data);
    } else {
      // Si no existe el registro, crearlo con valor inicial
      const initialData = { id: 1, total: 100000 };
      const { error: insertError } = await supabase
        .from('capital')
        .insert(initialData);

      if (insertError) throw insertError;

      return NextResponse.json(initialData);
    }
  } catch (error) {
    console.error('Error fetching capital: ', error);
    return NextResponse.json(
      { message: 'Error fetching capital', error },
      { status: 500 }
    );
  }
}

// POST capital
export async function POST(request: Request) {
  try {
    const { total } = await request.json();

    if (typeof total !== 'number') {
      return NextResponse.json(
        { message: 'Invalid capital amount' },
        { status: 400 }
      );
    }

    // Update o Insert con UPSERT
    const { error } = await supabase
      .from('capital')
      .upsert({ id: 1, total });

    if (error) throw error;

    return NextResponse.json({ total });
  } catch (error) {
    console.error('Error updating capital: ', error);
    return NextResponse.json(
      { message: 'Error updating capital', error },
      { status: 500 }
    );
  }
}
