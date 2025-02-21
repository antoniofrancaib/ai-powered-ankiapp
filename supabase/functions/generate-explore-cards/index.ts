
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateCardParams {
  interest: string;
  count?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { interest, count = 3 } = await req.json() as GenerateCardParams
    const apiKey = Deno.env.get('OPENAI_API_KEY')

    console.log(`Generating ${count} cards for interest: ${interest}`)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert flashcard creator for the topic: ${interest}. Create engaging and educational flashcards that help users learn about this topic.`
          },
          {
            role: 'user',
            content: `Create ${count} flashcards about ${interest}. Return them in this exact JSON format:
            {
              "cards": [
                {
                  "front": "question or concept",
                  "back": "answer or explanation"
                }
              ]
            }`
          }
        ],
      }),
    })

    const data = await response.json()
    console.log('OpenAI response:', JSON.stringify(data))
    
    let cards
    try {
      cards = JSON.parse(data.choices[0].message.content).cards
    } catch (error) {
      console.error('Error parsing OpenAI response:', error)
      throw new Error('Invalid response format from OpenAI')
    }

    return new Response(JSON.stringify({ cards }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
