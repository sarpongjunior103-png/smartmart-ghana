// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    if (conversationId) {
      // Get messages for a specific conversation
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(
          `id, conversation_id, sender_id, content, message_type, created_at, is_read,
           profiles(id, full_name, avatar_url)`
        )
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      return NextResponse.json({ messages }, { headers: corsHeaders });
    }

    // List all conversations for the user
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select(
        `id, created_at, updated_at,
         participants(user_id),
         messages(id, content, created_at, sender_id)`
      )
      .order('updated_at', { ascending: false });

    if (conversationsError) throw conversationsError;

    // Filter conversations where user is a participant
    const userConversations = (conversations || []).filter((conv: any) =>
      conv.participants?.some((p: any) => p.user_id === user.id)
    );

    return NextResponse.json({ conversations: userConversations }, { headers: corsHeaders });
  } catch (error) {
    console.error('Chat GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const body = await request.json();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { conversation_id, recipient_id, content, message_type = 'text' } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    let conversationId = conversation_id;

    // Create conversation if it doesn't exist
    if (!conversationId && recipient_id) {
      // Check if conversation already exists between these two users
      const { data: existingConversations } = await supabase
        .from('conversations')
        .select('id, participants(user_id)')
        .order('updated_at', { ascending: false });

      const existing = (existingConversations || []).find((conv: any) => {
        const participantIds = conv.participants?.map((p: any) => p.user_id) || [];
        return participantIds.includes(user.id) && participantIds.includes(recipient_id);
      });

      if (existing) {
        conversationId = existing.id;
      } else {
        // Create new conversation
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({})
          .select()
          .single();

        if (convError) throw convError;
        conversationId = newConversation.id;

        // Add participants
        const { error: participantsError } = await supabase.from('conversation_participants').insert([
          { conversation_id: conversationId, user_id: user.id },
          { conversation_id: conversationId, user_id: recipient_id },
        ]);

        if (participantsError) throw participantsError;
      }
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversation_id or recipient_id is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Send message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        message_type,
        is_read: false,
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // Update conversation updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return NextResponse.json({ message }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Chat POST error:', error);
    return NextResponse.json(
      { error: 'Failed to send message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
