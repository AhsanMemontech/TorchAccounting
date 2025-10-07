import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { randomUUID } from 'crypto';

// GoHighLevel API configuration
const GHL_API_KEY = process.env.GHL_API_KEY
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID

export async function POST(request: NextRequest) {
  try {
    console.log("called api gohiglevel");
    const { id, name, email, phone } = await request.json()

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json(
        { message: 'Name, email, and phone are required' },
        { status: 400 }
      )
    }

    //Enhanced email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { message: 'Please enter a valid email address with @ symbol' },
        { status: 400 }
      )
    }

    //Enhanced phone validation - numbers only with length limits
    const cleanPhone = phone.replace(/[\s\-\(\)\.+]/g, '') // Remove all non-numeric characters except +
    const phoneRegex = /^\+?[1-9]\d{9,14}$/ // International format: optional +, starts with 1-9, 10-15 digits total
    
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { message: 'Please enter a valid phone number (10-15 digits, numbers only)' },
        { status: 400 }
      )
    }

    // Additional phone length validation
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return NextResponse.json(
        { message: 'Phone number must be between 10-15 digits' },
        { status: 400 }
      )
    }

    // Validate name (no numbers, reasonable length)
    if (name.trim().length < 2 || name.trim().length > 100) {
      return NextResponse.json(
        { message: 'Name must be between 2-100 characters' },
        { status: 400 }
      )
    }

    // // Check if email already exists in waiting list
    // const { data: existingEntry, error: checkError } = await supabase
    //   .from('users')
    //   .select('email')
    //   .eq('email', email.toLowerCase().trim())
    //   .single()

    // if (checkError && checkError.code !== 'PGRST116') {
    //   console.error('Error checking existing email:', checkError)
    //   return NextResponse.json(
    //     { message: 'Database error occurred' },
    //     { status: 500 }
    //   )
    // }

    // if (existingEntry) {
    //   return NextResponse.json(
    //     { message: 'This email is already on our waiting list' },
    //     { status: 409 }
    //   )
    // }

    // Insert new waiting list entry

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: id,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: cleanPhone,
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('Error inserting waiting list entry:', error)
      return NextResponse.json(
        { message: 'Failed to add to waiting list' },
        { status: 500 }
      )
    }
    
    // Create contact in GoHighLevel
    
    const contactData = {
      email: email.toLowerCase().trim(),
      name: name.trim(),
      phone: phone, // Make sure to include phone
      tags: ['Waiting List']
    }
    console.log(contactData);

    // Make API call to GoHighLevel
    const response = await fetch(`https://rest.gohighlevel.com/v1/contacts/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GHL_API_KEY}`
      },
      body: JSON.stringify(contactData)
    })
    
    const responseClone = response.clone();
    const responseData = await responseClone.json();
    console.log("GoHighLevel API Response:", JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      const errorData = await response.json();
      console.error('GoHighLevel API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to add contact to GoHighLevel' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Successfully added to waiting list',
//        data: data[0]
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Waiting list API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get all waiting list entries (for admin purposes)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching waiting list:', error)
      return NextResponse.json(
        { message: 'Failed to fetch waiting list' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 200 })

  } catch (error) {
    console.error('Waiting list GET API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}