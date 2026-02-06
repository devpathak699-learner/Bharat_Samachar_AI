# Cultural Adaptation Guide

## Core Principle
**Don't just translate words - adapt cultural context for Indian audiences**

This is our competitive advantage over Google Translate and Microsoft Translator.

## Cultural Mapping Database
Maintain a database of idioms, references, and cultural elements that need adaptation.

### Categories

#### 1. Idioms & Expressions
Replace English idioms with culturally equivalent Indian expressions:

**English → Hindi**
- "Raining cats and dogs" → "मूसलाधार बारिश" (torrential rain)
- "House of cards" → "रेत की दीवार" (wall of sand)
- "Piece of cake" → "बाएं हाथ का खेल" (left hand's game)
- "Break the ice" → "बर्फ तोड़ना" (same literal, but ensure context)
- "Spill the beans" → "राज़ खोलना" (reveal the secret)

#### 2. Sports References
Adapt to Indian sports context:

- "Super Bowl excitement" → "IPL Final जैसा उत्साह"
- "World Series" → "Cricket World Cup"
- "March Madness" → "IPL Season"
- "Touchdown" → "Century" (cricket context)

#### 3. Holiday & Festival References
Replace Western holidays with Indian equivalents:

- "Black Friday deals" → "Diwali Sale जैसे ऑफर"
- "Thanksgiving dinner" → "दिवाली की पारिवारिक gathering"
- "Christmas shopping" → "त्योहारों की खरीदारी"
- "New Year's resolution" → "नए साल का संकल्प" (acceptable as-is)

#### 4. Food References
Adapt food metaphors:

- "Apple pie" → "गुलाब जामुन" (when referring to something quintessentially American/Indian)
- "Hot dog" → "वड़ा पाव" (street food context)
- "Burger joint" → "ढाबा" (casual dining context)

#### 5. Currency & Measurements
Convert to Indian standards:

- "$100" → "₹8,000" (with current exchange rate)
- "Miles" → "किलोमीटर"
- "Fahrenheit" → "Celsius"
- "Pounds" → "किलोग्राम"

#### 6. Pop Culture References
Replace with Indian equivalents:

- "Hollywood star" → "Bollywood सितारा"
- "Broadway show" → "नाटक" or "थिएटर"
- "Grammy Awards" → "Filmfare Awards" or "National Film Awards"

## Implementation Guidelines

### 1. Detection Phase
Identify cultural elements in source text:
- Use NLP to detect idioms, named entities, cultural references
- Flag items that need adaptation (not just translation)

### 2. Adaptation Phase
Apply cultural mappings:
- Check cultural_mappings database first
- If no mapping exists, use LLM with cultural context prompt
- Validate with native speakers

### 3. Validation Phase
Ensure natural fluency:
- Does it sound natural to a native speaker?
- Is the meaning preserved?
- Is it culturally appropriate?

## Prompting Strategy for Gemini

### Good Prompt Example
```
Translate this English article to Hindi, but apply cultural adaptation:

1. Replace idioms with Hindi equivalents (not literal translations)
2. Convert "Super Bowl" to "IPL Final" 
3. Convert currency to INR
4. Keep technical terms in English if commonly used (e.g., "smartphone")
5. Maintain natural, conversational tone

Article: [content]
```

### Bad Prompt Example
```
Translate this to Hindi.
```

## Quality Metrics
- **Fluency**: Does it read naturally? (1-5 scale)
- **Accuracy**: Is meaning preserved? (1-5 scale)
- **Cultural fit**: Is it culturally appropriate? (1-5 scale)
- **Target**: Average 4.5+ across all metrics

## Testing Process
1. Translate 100 sample articles
2. Get 10 native speakers per language to review
3. Collect feedback on cultural appropriateness
4. Iterate on mappings based on feedback
5. Target: 90%+ approval rate

## Crowdsourcing Cultural Mappings
- Allow users to suggest better adaptations
- Implement voting system for community validation
- Review and approve high-voted suggestions
- Goal: Grow from 1,000 to 10,000+ mappings in Year 1

## Edge Cases
- **Technical content**: Keep technical terms in English if widely used
- **Proper nouns**: Don't translate names, brands (unless they have official local names)
- **Legal/medical**: Be extra careful, prefer literal translation for accuracy
- **Poetry/literature**: May require human review for artistic adaptation

## Regional Variations
Consider regional differences within languages:
- Hindi: Delhi vs Mumbai vs Lucknow dialects
- Tamil: Chennai vs Madurai variations
- Start with standard/formal versions, add regional variants later

## Continuous Improvement
- Track which adaptations get positive user feedback
- A/B test different cultural mappings
- Update database based on real-world usage
- Monthly review of low-scoring translations
